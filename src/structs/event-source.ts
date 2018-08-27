import { ClassNameInput, parseClassName } from '../util/html'
import { refineProps } from '../util/misc'
import { EventInput } from './event'
import Calendar from '../Calendar'
import { DateRange } from '../datelib/date-range'
import { EventSourceFunc } from '../event-sources/func-event-source'
import { ConstraintInput, Constraint, normalizeConstraint, Allow } from '../validation'

/*
Parsing and normalization of the EventSource data type, which defines how event data is fetched.
Contains the plugin system for defining new types if event sources.

TODO: "EventSource" is the same name as a built-in type in TypeScript. Rethink.
*/

export type EventSourceError = {
  message: string
  response?: any // an XHR or something like it
  [otherProp: string]: any
}

export type EventInputTransformer = (eventInput: EventInput) => EventInput | null
export type EventSourceSuccessResponseHandler = (rawEvents: EventInput[], response: any) => void
export type EventSourceErrorResponseHandler = (error: EventSourceError) => void

export interface ExtendedEventSourceInput {
  id?: string | number
  allDayDefault?: boolean
  eventDataTransform?: EventInputTransformer
  editable?: boolean
  startEditable?: boolean
  durationEditable?: boolean
  constraint?: ConstraintInput
  overlap?: boolean
  allow?: Allow
  rendering?: string
  className?: ClassNameInput
  color?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string

  // array (TODO: how to move this to array-event-source?)
  events?: EventInput[]

  // json feed (TODO: how to move this to json-feed-event-source?)
  url?: string
  method?: string
  data?: object | (() => object)
  startParam?: string
  endParam?: string
  timeZoneParam?: string

  // for any network-related sources
  success?: EventSourceSuccessResponseHandler
  failure?: EventSourceErrorResponseHandler

  [otherProp: string]: any // in case plugins want more props
}

export type EventSourceInput =
  ExtendedEventSourceInput | // object in extended form
  EventSourceFunc | // just a function
  string // a URL for a JSON feed

export interface EventSource {
  sourceId: string
  sourceDefId: number // one of the few IDs that's a NUMBER not a string
  meta: any
  publicId: string
  isFetching: boolean
  latestFetchId: string
  fetchRange: DateRange | null
  allDayDefault: boolean | null
  eventDataTransform: EventInputTransformer
  startEditable: boolean | null
  durationEditable: boolean | null
  constraint: Constraint | null
  overlap: boolean | null // does not allow full Overlap data type
  allow: Allow | null
  rendering: string
  className: string[]
  backgroundColor: string
  borderColor: string
  textColor: string
  success: EventSourceSuccessResponseHandler | null
  failure: EventSourceErrorResponseHandler | null
}

export type EventSourceHash = { [sourceId: string]: EventSource }

export type EventSourceFetcher = (
  arg: {
    eventSource: EventSource
    calendar: Calendar
    range: DateRange
  },
  success: (res: { rawEvents: EventInput[], response?: any }) => void,
  failure: (error: EventSourceError) => void
) => void

export interface EventSourceDef {
  ignoreRange?: boolean
  parseMeta: (raw: EventSourceInput) => object | null
  fetch: EventSourceFetcher
}

const SIMPLE_SOURCE_PROPS = {
  id: String,
  allDayDefault: Boolean,
  eventDataTransform: Function,
  editable: Boolean,
  startEditable: Boolean,
  durationEditable: Boolean,
  constraint: normalizeConstraint,
  overlap: Boolean,
  allow: null,
  rendering: String,
  className: parseClassName,
  color: String,
  backgroundColor: String,
  borderColor: String,
  textColor: String,
  success: Function,
  failure: Function
}

let defs: EventSourceDef[] = []
let uid = 0

// NOTE: if we ever want to remove defs,
// we need to null out the entry in the array, not delete it,
// because our event source IDs rely on the index.
export function registerEventSourceDef(def: EventSourceDef) {
  defs.push(def)
}

export function getEventSourceDef(id: number): EventSourceDef {
  return defs[id]
}

export function doesSourceNeedRange(eventSource: EventSource) {
  return !defs[eventSource.sourceDefId].ignoreRange
}

export function parseEventSource(raw: EventSourceInput): EventSource | null {
  for (let i = defs.length - 1; i >= 0; i--) { // later-added plugins take precedence
    let def = defs[i]
    let meta = def.parseMeta(raw)

    if (meta) {
      return parseEventSourceProps(
        typeof raw === 'object' ? raw : {},
        meta,
        i
      )
    }
  }

  return null
}

/*
TODO: combine with pluckNonDateProps AND refineScopedUi
*/
function parseEventSourceProps(raw: ExtendedEventSourceInput, meta: object, sourceDefId: number): EventSource {
  let props = refineProps(raw, SIMPLE_SOURCE_PROPS) as (EventSource & { editable: boolean | null, color: string })

  props.isFetching = false
  props.latestFetchId = ''
  props.fetchRange = null
  props.publicId = String(raw.id || '')
  props.sourceId = String(uid++)
  props.sourceDefId = sourceDefId
  props.meta = meta

  if (props.startEditable == null) {
    props.startEditable = props.editable
  }

  if (props.durationEditable == null) {
    props.durationEditable = props.editable
  }

  if (!props.backgroundColor) {
    props.backgroundColor = props.color
  }

  if (!props.borderColor) {
    props.borderColor = props.color
  }

  delete props.editable
  delete props.color

  return props as EventSource
}
