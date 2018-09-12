import { Duration, asRoughMs, durationsEqual } from '../datelib/duration'
import { EventStore, createEmptyEventStore } from './event-store'
import { EventDef, EventInstance } from './event'
import { assignTo } from '../util/object'
import Calendar from '../Calendar'
import { computeAlignedDayRange } from '../util/misc'
import { startOfDay } from '../datelib/marker'

/*
A data structure for how to modify an EventDef/EventInstance within an EventStore
*/

export interface EventMutation {
  startDelta?: Duration
  endDelta?: Duration
  standardProps?: any // for the def. should not include extendedProps
  extendedProps?: any // for the def
}

// applies the mutation to ALL defs/instances within the event store
export function applyMutationToEventStore(eventStore: EventStore, mutation: EventMutation, calendar: Calendar): EventStore {
  let dest = createEmptyEventStore()

  for (let defId in eventStore.defs) {
    let def = eventStore.defs[defId]
    dest.defs[defId] = applyMutationToEventDef(def, mutation)
  }

  for (let instanceId in eventStore.instances) {
    let instance = eventStore.instances[instanceId]
    let def = dest.defs[instance.defId] // important to grab the newly modified def
    dest.instances[instanceId] = applyMutationToEventInstance(instance, def, mutation, calendar)
  }

  return dest
}

function applyMutationToEventDef(eventDef: EventDef, mutation: EventMutation): EventDef {
  let copy = assignTo({}, eventDef)
  let standardProps = mutation.standardProps || {}

  // if hasEnd has not been specified, guess a good value based on deltas.
  // if duration will change, there's no way the default duration will persist,
  // and thus, we need to mark the event as having a real end
  if (
    standardProps.hasEnd == null &&
    willDeltasAffectDuration(mutation.startDelta, mutation.endDelta)
  ) {
    standardProps.hasEnd = true
  }

  assignTo(copy, standardProps)

  if (mutation.extendedProps) {
    copy.extendedProps = assignTo({}, copy.extendedProps, mutation.extendedProps)
  }

  return copy
}

function willDeltasAffectDuration(startDelta: Duration | null, endDelta: Duration | null) {
  if (startDelta && !asRoughMs(startDelta)) { startDelta = null }
  if (endDelta && !asRoughMs(endDelta)) { endDelta = null }

  if (!startDelta && !endDelta) {
    return false
  }

  if (Boolean(startDelta) !== Boolean(endDelta)) {
    return true
  }

  return !durationsEqual(startDelta, endDelta)
}

function applyMutationToEventInstance(
  eventInstance: EventInstance,
  eventDef: EventDef, // must first be modified by applyMutationToEventDef
  mutation: EventMutation,
  calendar: Calendar
): EventInstance {
  let dateEnv = calendar.dateEnv
  let forceAllDay = mutation.standardProps && mutation.standardProps.isAllDay === true
  let clearEnd = mutation.standardProps && mutation.standardProps.hasEnd === false
  let copy = assignTo({}, eventInstance) as EventInstance

  if (forceAllDay) {
    copy.range = computeAlignedDayRange(copy.range)
  }

  if (mutation.startDelta) {
    copy.range = {
      start: dateEnv.add(copy.range.start, mutation.startDelta),
      end: copy.range.end
    }
  }

  if (clearEnd) {
    copy.range = {
      start: copy.range.start,
      end: calendar.getDefaultEventEnd(eventDef.isAllDay, copy.range.start)
    }
  } else if (mutation.endDelta) {
    copy.range = {
      start: copy.range.start,
      end: dateEnv.add(copy.range.end, mutation.endDelta)
    }
  }

  // in case event was all-day but the supplied deltas were not
  // better util for this?
  if (eventDef.isAllDay) {
    copy.range = {
      start: startOfDay(copy.range.start),
      end: startOfDay(copy.range.end)
    }
  }

  // handle invalid durations
  if (copy.range.end < copy.range.start) {
    copy.range.end = calendar.getDefaultEventEnd(eventDef.isAllDay, copy.range.start)
  }

  return copy
}
