import Calendar from '../Calendar'
import { DateComponentRenderState } from '../component/DateComponent'
import { EventSourceHash } from '../structs/event-source'
import { assignTo } from '../util/object'
import { reduceEventSourceHash } from './event-sources'
import { reduceEventStore } from './event-store'

export interface CalendarState extends DateComponentRenderState {
  loadingLevel: number
  eventSources: EventSourceHash
}

export function reduce(state: CalendarState, action: any, calendar: Calendar): CalendarState {
  let newState = {
    loadingLevel: reduceLoadingLevel(state.loadingLevel, action),
    eventSources: reduceEventSourceHash(state.eventSources, action, calendar),
    eventStore: reduceEventStore(state.eventStore, action, calendar),
    dateProfile: state.dateProfile,
    selection: state.selection,
    dragState: state.dragState,
    eventResizeState: state.eventResizeState,
    businessHoursDef: state.businessHoursDef,
    selectedEventInstanceId: state.selectedEventInstanceId
  }

  calendar.trigger(action.type, action) // for testing hooks

  switch(action.type) {

    case 'SET_VIEW_TYPE':
      if (!calendar.view || calendar.view.type !== action.viewType) {
        let view = calendar.getViewByType(action.viewType)
        calendar.view = view
        calendar.dispatch({
          type: 'SET_DATE_PROFILE',
          dateProfile: view.computeDateProfile(action.dateMarker)
        })
      }
      break

    case 'SET_DATE_PROFILE':
      if (action.dateProfile.isValid) {
        newState.dateProfile = action.dateProfile
        calendar.view.updateMiscDateProps(action.dateProfile)
      }
      break

    case 'NAVIGATE_PREV':
      calendar.dispatch({
        type: 'SET_DATE_PROFILE',
        dateProfile: calendar.view.dateProfileGenerator.buildPrev(newState.dateProfile)
      })
      break

    case 'NAVIGATE_NEXT':
      calendar.dispatch({
        type: 'SET_DATE_PROFILE',
        dateProfile: calendar.view.dateProfileGenerator.buildNext(newState.dateProfile)
      })
      break

    case 'NAVIGATE_TODAY':
      calendar.dispatch({
        type: 'SET_DATE_PROFILE',
        dateProfile: calendar.view.computeDateProfile(calendar.getNow())
      })
      break

    case 'NAVIGATE_PREV_YEAR':
      calendar.dispatch({
        type: 'SET_DATE_PROFILE',
        dateProfile: calendar.view.computeDateProfile(
          calendar.dateEnv.addYears(newState.dateProfile.currentDate, -1)
        )
      })
      break

    case 'NAVIGATE_NEXT_YEAR':
      calendar.dispatch({
        type: 'SET_DATE_PROFILE',
        dateProfile: calendar.view.computeDateProfile(
          calendar.dateEnv.addYears(newState.dateProfile.currentDate, 1)
        )
      })
      break

    case 'NAVIGATE_DATE':
      calendar.dispatch({
        type: 'SET_DATE_PROFILE',
        dateProfile: calendar.view.computeDateProfile(action.dateMarker)
      })
      break

    case 'NAVIGATE_DELTA':
      calendar.dispatch({
        type: 'SET_DATE_PROFILE',
        dateProfile: calendar.view.computeDateProfile(
          calendar.dateEnv.add(newState.dateProfile.currentDate, action.delta)
        )
      })
      break

    case 'SELECT':
      return assignTo({}, state, {
        selection: action.selection
      })

    case 'UNSELECT':
      if (state.selection) { // if already no selection, don't bother
        return assignTo({}, state, {
          selection: null
        })
      } else {
        break
      }

    case 'SET_DRAG':
      return assignTo({}, state, {
        dragState: action.dragState
      })

    case 'CLEAR_DRAG':
      return assignTo({}, state, {
        dragState: null
      })

    case 'SELECT_EVENT':
      return assignTo({}, state, {
        selectedEventInstanceId: action.eventInstanceId
      })

    case 'CLEAR_SELECTED_EVENT':
      return assignTo({}, state, {
        selectedEventInstanceId: null
      })

    case 'SET_EVENT_RESIZE':
      return assignTo({}, state, {
        eventResizeState: action.eventResizeState
      })

    case 'CLEAR_EVENT_RESIZE':
      return assignTo({}, state, {
        eventResizeState: null
      })

  }

  return newState
}

function reduceLoadingLevel(level: number, action): number {
  switch (action.type) {
    case 'FETCH_EVENT_SOURCE':
      return level + 1
    case 'RECEIVE_EVENT_SOURCE':
    case 'ERROR_EVENT_SOURCE':
      return level - 1
    default:
      return level
  }
}
