import { Action } from './Action'
import { PluginHooks } from '../plugin-system-struct'
import { DateEnv } from '../datelib/env'
import { CalendarApi } from '../CalendarApi'
import { EventSourceHash } from '../structs/event-source'
import { ViewSpecHash, ViewSpec } from '../structs/view-spec'
import { DateProfileGenerator, DateProfile } from '../DateProfileGenerator'
import { Emitter } from '../common/Emitter'
import { EventUiHash, EventUi } from '../component/event-ui'
import { DateMarker } from '../datelib/marker'
import { ViewApi } from '../ViewApi'
import { Theme } from '../theme/Theme'
import { EventStore } from '../structs/event-store'
import { DateSpan } from '../structs/date-span'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { RefinedCalendarOptions, RefinedViewOptions, GenericRefiners, RawCalendarOptions } from '../options'


export interface CalendarDataManagerState {
  dynamicOptionOverrides: RawCalendarOptions
  currentViewType: string
  currentDate: DateMarker
  dateProfile: DateProfile
  businessHours: EventStore
  eventSources: EventSourceHash
  eventUiBases: EventUiHash
  loadingLevel: number
  eventStore: EventStore
  renderableEventStore: EventStore
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  selectionConfig: EventUi
}

export interface CalendarOptionsData {
  localeDefaults: RawCalendarOptions
  calendarOptions: RefinedCalendarOptions
  toolbarConfig: any
  availableRawLocales: any
  refiners: GenericRefiners
  dateEnv: DateEnv
  theme: Theme
  pluginHooks: PluginHooks
  viewSpecs: ViewSpecHash
}

export interface CalendarCurrentViewData {
  viewSpec: ViewSpec
  options: RefinedViewOptions
  viewApi: ViewApi
  dateProfileGenerator: DateProfileGenerator
}


type CalendarDataBase = CalendarOptionsData & CalendarCurrentViewData & CalendarDataManagerState

// needs to be an interface so we can ambient-extend
// is a superset of CalendarContext
export interface CalendarData extends CalendarDataBase {
  viewTitle: string // based on current date
  calendarApi: CalendarApi // TODO: try to remove this
  dispatch: (action: Action) => void
  emitter: Emitter
  getCurrentData(): CalendarData // TODO: try to remove
}
