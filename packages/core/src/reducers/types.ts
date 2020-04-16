import { EventInput, EventInstanceHash } from '../structs/event'
import { DateRange } from '../datelib/date-range'
import { EventStore } from '../structs/event-store'
import { EventMutation } from '../structs/event-mutation'
import { EventSource, EventSourceHash, EventSourceError } from '../structs/event-source'
import { DateProfile, DateProfileGenerator } from '../DateProfileGenerator'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { DateSpan } from '../structs/date-span'
import { DateEnv } from '../datelib/env'
import { Calendar } from '../Calendar'
import { DateMarker } from '../datelib/marker'
import { PluginHooks } from '../plugin-system'
import { RawLocaleMap } from '../datelib/locale'
import { Theme } from '../theme/Theme'
import { ViewSpecHash } from '../structs/view-spec'

export interface CalendarState {
  eventSources: EventSourceHash
  eventSourceLoadingLevel: number
  loadingLevel: number
  viewType: string
  currentDate: DateMarker
  dateProfile: DateProfile | null // for the current view
  eventStore: EventStore
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  options: any
  optionOverrides: any
  dynamicOptionOverrides: any
  dateEnv: DateEnv
  pluginHooks: PluginHooks
  availableRawLocales: RawLocaleMap
  theme: Theme
  dateProfileGenerator: DateProfileGenerator
  viewSpecs: ViewSpecHash
}

export type reducerFunc = (state: CalendarState, action: Action, rawOptions: any, calendar: Calendar) => CalendarState

export type Action =

  { type: 'INIT', optionOverrides: object } | // wont it create another rerender?

  { type: 'SET_OPTION', optionName: string, optionValue: any } | // TODO: more strictly type
  { type: 'MUTATE_OPTIONS', updates: object, removals: string[], isDynamic: boolean } |

  { type: 'PREV' } |
  { type: 'NEXT' } |
  { type: 'SET_DATE', dateMarker: DateMarker } |
  { type: 'SET_VIEW_TYPE', viewType: string, dateMarker?: DateMarker } |

  { type: 'SELECT_DATES', selection: DateSpan } |
  { type: 'UNSELECT_DATES' } |

  { type: 'SELECT_EVENT', eventInstanceId: string } |
  { type: 'UNSELECT_EVENT' } |

  { type: 'SET_EVENT_DRAG', state: EventInteractionState } |
  { type: 'UNSET_EVENT_DRAG' } |

  { type: 'SET_EVENT_RESIZE', state: EventInteractionState } |
  { type: 'UNSET_EVENT_RESIZE' } |

  { type: 'ADD_EVENT_SOURCES', sources: EventSource[] } |
  { type: 'REMOVE_EVENT_SOURCE', sourceId: string } |
  { type: 'REMOVE_ALL_EVENT_SOURCES' } |

  { type: 'FETCH_EVENT_SOURCES', sourceIds?: string[] } | // if no sourceIds, fetch all

  { type: 'RECEIVE_EVENTS', sourceId: string, fetchId: string, fetchRange: DateRange | null, rawEvents: EventInput[] } |
  { type: 'RECEIVE_EVENT_ERROR', sourceId: string, fetchId: string, fetchRange: DateRange | null, error: EventSourceError } | // need all these?

  { type: 'ADD_EVENTS', eventStore: EventStore } |
  { type: 'MERGE_EVENTS', eventStore: EventStore } |
  { type: 'MUTATE_EVENTS', instanceId: string, mutation: EventMutation, fromApi?: boolean } |
  { type: 'REMOVE_EVENT_DEF', defId: string } |
  { type: 'REMOVE_EVENT_INSTANCES', instances: EventInstanceHash } |
  { type: 'REMOVE_ALL_EVENTS' }
