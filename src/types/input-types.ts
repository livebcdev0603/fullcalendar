/*
Huge thanks to these people:
https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/fullcalendar/index.d.ts
*/

import View from '../View'
import EventSource from '../models/event-source/EventSource'
import { Duration } from '../datelib/duration'
import { DateInput } from '../datelib/env'
import { FormatterInput } from '../datelib/formatting'

export type DurationInput = Duration | object | string | number

export interface RangeInput {
  start?: DateInput
  end?: DateInput
}

export type ConstraintInput = RangeInput | BusinessHoursInput | 'businessHours'

export interface EventOptionsBase {
  className?: string | string[]
  editable?: boolean
  startEditable?: boolean
  durationEditable?: boolean
  rendering?: string
  overlap?: boolean
  constraint?: ConstraintInput
  color?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

// used for input and toLegacy output
// when we expose the real EventObject, will need lots of changes
export interface EventObjectInput extends EventOptionsBase, RangeInput {
  _id?: string
  id?: string | number
  title: string
  allDay?: boolean
  url?: string
  source?: EventSource
  [customField: string]: any // non-standard fields
}

export type EventSourceFunction = (start: Date, end: Date, timezone: string, callback: ((events: EventObjectInput[]) => void)) => void
export type EventSourceSimpleInput = EventObjectInput[] | EventSourceFunction | string

export interface EventSourceExtendedInput extends EventOptionsBase {

  // array
  events?: EventSourceSimpleInput

  // json feed
  url?: string
  method?: string
  data?: object | (() => object)
  startParam?: string
  endParam?: string
  timezoneParam?: string
  success?: (eventDefs: EventObjectInput[], ajaxRes: any) => void
  error?: (error: any, ajaxRes: any) => void

  // general
  allDayDefault?: boolean
  eventDataTransform?(eventData: any): EventObjectInput
}

export type EventSourceInput = EventSourceSimpleInput | EventSourceExtendedInput

export interface ToolbarInput {
  left?: string
  center?: string
  right?: string
}

export interface CustomButtonInput {
  text: string
  icon?: string
  themeIcon?: string
  bootstrapGlyphicon?: string,
  bootstrapFontAwesome?: string,
  click(element: HTMLElement): void
}

export interface ButtonIconsInput {
  prev?: string
  next?: string
  prevYear?: string
  nextYear?: string
}

export interface ButtonTextCompoundInput {
  prev?: string
  next?: string
  prevYear?: string
  nextYear?: string
  today?: string
  month?: string
  week?: string
  day?: string
  [viewId: string]: string | undefined // needed b/c of other optional types
}

export interface BusinessHoursInput {
  start?: DateInput
  end?: DateInput
  dow?: number[]
}

export interface EventSegment {
  event: EventObjectInput
  start: Date
  end: Date
  isStart: boolean
  isEnd: boolean
}

export interface CellInfo {
  date: Date
  dayEl: HTMLElement
  moreEl: HTMLElement
  segs: EventSegment[]
  hiddenSegs: EventSegment[]
}

export interface DropInfo {
  start: Date
  end: Date
}

export interface OptionsInputBase {
  header?: boolean | ToolbarInput
  footer?: boolean | ToolbarInput
  customButtons?: { [name: string]: CustomButtonInput }
  buttonIcons?: boolean | ButtonIconsInput
  themeSystem?: 'standard' | 'bootstrap3' | 'bootstrap4' | 'jquery-ui'
  themeButtonIcons?: boolean | ButtonIconsInput
  bootstrapGlyphicons?: boolean | ButtonIconsInput,
  bootstrapFontAwesome?: boolean | ButtonIconsInput,
  firstDay?: number
  isRTL?: boolean
  weekends?: boolean
  hiddenDays?: number[]
  fixedWeekCount?: boolean
  weekNumbers?: boolean
  weekNumbersWithinDays?: boolean
  weekNumberCalculation?: 'local' | 'ISO' | ((m: Date) => number)
  businessHours?: boolean | BusinessHoursInput | BusinessHoursInput[]
  showNonCurrentDates?: boolean
  height?: number | 'auto' | 'parent' | (() => number)
  contentHeight?: number | 'auto' | (() => number)
  aspectRatio?: number
  handleWindowResize?: boolean
  windowResizeDelay?: number
  eventLimit?: boolean | number
  eventLimitClick?: 'popover' | 'week' | 'day' | string | ((cellinfo: CellInfo, jsevent: Event) => void)
  timezone?: string | boolean
  now?: DateInput | (() => DateInput)
  defaultView?: string
  allDaySlot?: boolean
  allDayText?: string
  slotDuration?: DurationInput
  slotLabelFormat?: FormatterInput
  slotLabelInterval?: DurationInput
  snapDuration?: DurationInput
  scrollTime?: DurationInput
  minTime?: DurationInput
  maxTime?: DurationInput
  slotEventOverlap?: boolean
  listDayFormat?: FormatterInput | boolean
  listDayAltFormat?: FormatterInput | boolean
  noEventsMessage?: string
  defaultDate?: DateInput
  nowIndicator?: boolean
  visibleRange?: ((currentDate: Date) => RangeInput) | RangeInput
  validRange?: RangeInput
  dateIncrement?: DurationInput
  dateAlignment?: string
  duration?: DurationInput
  dayCount?: number
  locale?: string
  timeFormat?: FormatterInput
  columnHeader?: boolean
  columnHeaderFormat?: FormatterInput
  columnHeaderText?: string | ((date: DateInput) => string)
  columnHeaderHtml?: string | ((date: DateInput) => string)
  titleFormat?: FormatterInput
  monthNames?: string[]
  monthNamesShort?: string[]
  dayNames?: string[]
  dayNamesShort?: string[]
  weekNumberTitle?: string
  displayEventTime?: boolean
  displayEventEnd?: boolean
  eventLimitText?: string | ((eventCnt: number) => string)
  dayPopoverFormat?: FormatterInput
  navLinks?: boolean
  navLinkDayClick?: string | ((date: Date, jsEvent: Event) => void)
  navLinkWeekClick?: string | ((weekStart: any, jsEvent: Event) => void)
  selectable?: boolean
  selectHelper?: boolean
  unselectAuto?: boolean
  unselectCancel?: string
  selectOverlap?: boolean | ((event: EventObjectInput) => boolean)
  selectConstraint?: ConstraintInput
  events?: EventSourceInput
  eventSources?: EventSourceInput[]
  allDayDefault?: boolean
  startParam?: string
  endParam?: string
  lazyFetching?: boolean
  eventColor?: string
  eventBackgroundColor?: string
  eventBorderColor?: string
  eventTextColor?: string
  nextDayThreshold?: DurationInput
  eventOrder?: string | Array<((a: EventObjectInput, b: EventObjectInput) => number) | (string | ((a: EventObjectInput, b: EventObjectInput) => number))>
  eventRenderWait?: number | null
  editable?: boolean
  eventStartEditable?: boolean
  eventDurationEditable?: boolean
  dragRevertDuration?: number
  dragOpacity?: number
  dragScroll?: boolean
  eventOverlap?: boolean | ((stillEvent: EventObjectInput, movingEvent: EventObjectInput) => boolean)
  eventConstraint?: ConstraintInput
  eventAllow?: ((dropInfo: DropInfo, draggedEvent: Event) => boolean)
  longPressDelay?: number
  eventLongPressDelay?: number
  droppable?: boolean
  dropAccept?: string | ((draggable: any) => boolean)

  viewRender?(view: View, element: HTMLElement): void
  viewDestroy?(view: View, element: HTMLElement): void
  dayRender?(date: DateInput, cell: HTMLElement): void
  windowResize?(view: View): void
  dayClick?(date: DateInput, jsEvent: MouseEvent, view: View, resourceObj?): void // resourceObj for Scheduler
  eventClick?(event: EventObjectInput, jsEvent: MouseEvent, view: View): boolean | void
  eventMouseover?(event: EventObjectInput, jsEvent: MouseEvent, view: View): void
  eventMouseout?(event: EventObjectInput, jsEvent: MouseEvent, view: View): void
  select?(start: DateInput, end: DateInput, jsEvent: MouseEvent, view: View, resource?: any): void
  unselect?(view: View, jsEvent: Event): void
  eventDataTransform?(eventData: any): EventObjectInput
  loading?(isLoading: boolean, view: View): void
  eventRender?(event: EventObjectInput, element: HTMLElement, view: View): void
  eventAfterRender?(event: EventObjectInput, element: HTMLElement, view: View): void
  eventAfterAllRender?(view: View): void
  eventDestroy?(event: EventObjectInput, element: HTMLElement, view: View): void
  eventDragStart?(event: EventObjectInput, jsEvent: MouseEvent, ui: any, view: View): void
  eventDragStop?(event: EventObjectInput, jsEvent: MouseEvent, ui: any, view: View): void
  eventDrop?(event: EventObjectInput, delta: Duration, revertFunc: Function, jsEvent: Event, ui: any, view: View): void
  eventResizeStart?(event: EventObjectInput, jsEvent: MouseEvent, ui: any, view: View): void
  eventResizeStop?(event: EventObjectInput, jsEvent: MouseEvent, ui: any, view: View): void
  eventResize?(event: EventObjectInput, delta: Duration, revertFunc: Function, jsEvent: Event, ui: any, view: View): void
  drop?(date: DateInput, jsEvent: MouseEvent, ui: any): void
  eventReceive?(event: EventObjectInput): void
}

export interface ViewOptionsInput extends OptionsInputBase {
  type?: string
  buttonText?: string
}

export interface OptionsInput extends OptionsInputBase {
  buttonText?: ButtonTextCompoundInput
  views?: { [viewId: string]: ViewOptionsInput }
}
