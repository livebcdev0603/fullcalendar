import { EventSource, EventSourceHash, getEventSourceDef, doesSourceNeedRange } from '../structs/event-source'
import Calendar from '../Calendar'
import { arrayToHash, assignTo, filterHash } from '../util/object'
import { DateRange } from '../datelib/date-range'
import { warn } from '../util/misc'
import { DateProfile } from '../DateProfileGenerator'
import { Action } from './types'

export default function(eventSources: EventSourceHash, action: Action, dateProfile: DateProfile | null, calendar: Calendar): EventSourceHash {
  switch (action.type) {

    case 'ADD_EVENT_SOURCES': // already parsed
      return addSources(eventSources, action.sources, dateProfile ? dateProfile.activeRange : null, calendar)

    case 'REMOVE_EVENT_SOURCE':
      return removeSource(eventSources, action.sourceId)

    case 'SET_DATE_PROFILE':
      return fetchDirtySources(eventSources, action.dateProfile.activeRange, calendar)

    case 'FETCH_EVENT_SOURCES':
    case 'CHANGE_TIMEZONE':
      return fetchSourcesByIds(
        eventSources,
        (action as any).sourceIds ?
          arrayToHash((action as any).sourceIds) :
          excludeStaticSources(eventSources),
        dateProfile ? dateProfile.activeRange : null,
        calendar
      )

    case 'RECEIVE_EVENTS':
    case 'RECEIVE_EVENT_ERROR':
      return receiveResponse(eventSources, action.sourceId, action.fetchId, action.fetchRange)

    case 'REMOVE_ALL_EVENT_SOURCES':
      return {}

    default:
      return eventSources
  }
}


let uid = 0


function addSources(eventSourceHash: EventSourceHash, sources: EventSource[], fetchRange: DateRange | null, calendar: Calendar): EventSourceHash {
  let hash: EventSourceHash = {}

  for (let source of sources) {
    hash[source.sourceId] = source
  }

  hash = fetchDirtySources(hash, fetchRange, calendar)

  return assignTo({}, eventSourceHash, hash)
}


function removeSource(eventSourceHash: EventSourceHash, sourceId: string): EventSourceHash {
  return filterHash(eventSourceHash, function(eventSource: EventSource) {
    return eventSource.sourceId !== sourceId
  })
}


function fetchDirtySources(sourceHash: EventSourceHash, fetchRange: DateRange | null, calendar: Calendar): EventSourceHash {
  return fetchSourcesByIds(
    sourceHash,
    filterHash(sourceHash, function(eventSource) {
      return isSourceDirty(eventSource, fetchRange, calendar)
    }),
    fetchRange,
    calendar
  )
}


function isSourceDirty(eventSource: EventSource, fetchRange: DateRange | null, calendar: Calendar) {

  if (!doesSourceNeedRange(eventSource)) {
    return !eventSource.latestFetchId
  } else if (fetchRange) {
    return !calendar.opt('lazyFetching') ||
      !eventSource.fetchRange ||
      fetchRange.start < eventSource.fetchRange.start ||
      fetchRange.end > eventSource.fetchRange.end
  }

  return false
}


function fetchSourcesByIds(
  prevSources: EventSourceHash,
  sourceIdHash: { [sourceId: string]: any },
  fetchRange: DateRange | null,
  calendar: Calendar
): EventSourceHash {
  let nextSources: EventSourceHash = {}

  for (let sourceId in prevSources) {
    let source = prevSources[sourceId]

    if (sourceIdHash[sourceId]) {
      nextSources[sourceId] = fetchSource(source, fetchRange, calendar)
    } else {
      nextSources[sourceId] = source
    }
  }

  return nextSources
}


function fetchSource(eventSource: EventSource, fetchRange: DateRange | null, calendar: Calendar) {
  let sourceDef = getEventSourceDef(eventSource.sourceDefId)
  let fetchId = String(uid++)

  sourceDef.fetch(
    {
      eventSource,
      calendar,
      range: fetchRange
    },
    function(res) {
      let calSuccess = calendar.opt('eventSourceSuccess')

      // only call success callbacks if it was a network request (aka has a `response`)
      if (res.response) {
        if (eventSource.success) {
          eventSource.success(res.rawEvents, res.response)
        }
        if (calSuccess) {
          calSuccess(res.rawEvents, res.response)
        }
      }

      calendar.dispatch({
        type: 'RECEIVE_EVENTS',
        sourceId: eventSource.sourceId,
        fetchId,
        fetchRange,
        rawEvents: res.rawEvents
      })
    },
    function(error) {
      let calError = calendar.opt('eventSourceFailure')

      warn(error.message, error)

      if (eventSource.failure) {
        eventSource.failure(error)
      }
      if (calError) {
        calError(error)
      }

      calendar.dispatch({
        type: 'RECEIVE_EVENT_ERROR',
        sourceId: eventSource.sourceId,
        fetchId,
        fetchRange,
        error
      })
    }
  )

  return assignTo({}, eventSource, {
    isFetching: true,
    latestFetchId: fetchId
  })
}


function receiveResponse(sourceHash: EventSourceHash, sourceId: string, fetchId: string, fetchRange: DateRange) {
  let eventSource: EventSource = sourceHash[sourceId]

  if (
    eventSource && // not already removed
    fetchId === eventSource.latestFetchId
  ) {
    return assignTo({}, sourceHash, {
      [sourceId]: assignTo({}, eventSource, {
        isFetching: false,
        fetchRange
      })
    })
  }

  return sourceHash
}


function excludeStaticSources(eventSources: EventSourceHash): EventSourceHash {
  return filterHash(eventSources, function(eventSource) {
    return doesSourceNeedRange(eventSource)
  })
}
