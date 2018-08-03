import UnzonedRange from '../models/UnzonedRange'
import { ClassNameInput, parseClassName } from '../util/html'
import { refineProps } from '../util/misc'
import { EventInput } from './event'
import Calendar from '../Calendar'

// TODO: unify with EventNonDateInput
export interface EventSourceInput {
  id?: string | number
  allDayDefault?: boolean
  eventDataTransform?: any
  editable?: boolean
  startEditable?: boolean
  durationEditable?: boolean
  overlap?: any
  constraint?: any
  rendering?: string
  className?: ClassNameInput
  color?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  success?: (eventInputs: EventInput[]) => void
  failure?: (errorObj: any) => void
  [extendedProp: string]: any
}

export interface EventSource {
  sourceId: string
  sourceDefId: number // one of the few IDs that's a NUMBER not a string
  meta: any
  publicId: string
  isFetching: boolean
  latestFetchId: string
  fetchRange: UnzonedRange | null
  allDayDefault: boolean | null
  eventDataTransform: any // TODO: make this a real type. AND use it
  editable: boolean | null
  startEditable: boolean | null
  durationEditable: boolean | null
  overlap: any
  constraint: any
  rendering: string
  className: string[]
  backgroundColor: string
  borderColor: string
  textColor: string
  success: (eventInputs: EventInput[]) => void
  failure: (errorObj: any) => void
}

export type EventSourceHash = { [sourceId: string]: EventSource }

export type EventSourceFetcher = (
  arg: {
    eventSource: EventSource
    calendar: Calendar
    range: UnzonedRange
  },
  success: (rawEvents: EventInput) => void,
  failure: (errorObj: any) => void
) => void

export interface EventSourceDef {
  parseMeta: (raw: EventSourceInput) => object | null
  fetch: EventSourceFetcher
}

const SIMPLE_SOURCE_PROPS = {
  allDayDefault: Boolean,
  eventDataTransform: Function,
  editable: Boolean,
  startEditable: Boolean,
  durationEditable: Boolean,
  overlap: null,
  constraint: null,
  rendering: String,
  className: parseClassName,
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

export function parseEventSource(raw: EventSourceInput): EventSource | null {
  for (let i = 0; i < defs.length; i++) {
    let def = defs[i]
    let meta = def.parseMeta(raw)

    if (meta) {
      return parseEventSourceProps(raw, meta, i)
    }
  }

  return null
}

function parseEventSourceProps(raw: EventSourceInput, meta: object, sourceDefId: number): EventSource {
  let props = refineProps(raw, SIMPLE_SOURCE_PROPS) as EventSource

  props.isFetching = false
  props.latestFetchId = ''
  props.fetchRange = null
  props.publicId = String(raw.id || '')
  props.sourceId = String(uid++)
  props.sourceDefId = sourceDefId
  props.meta = meta

  if (typeof raw.color === 'string') {
    if (!props.backgroundColor) {
      props.backgroundColor = raw.color
    }
    if (!props.borderColor) {
      props.borderColor = raw.color
    }
  }

  return props
}
