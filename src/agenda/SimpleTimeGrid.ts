import TimeGrid, { TimeGridSeg } from './TimeGrid'
import Component from '../component/Component'
import { DateProfile } from '../DateProfileGenerator'
import { EventStore } from '../structs/event-store'
import { EventUiHash } from '../component/event-rendering'
import { EventInteractionUiState } from '../interactions/event-interaction-state'
import { DateSpan } from '../structs/date-span'
import reselector from '../util/reselector'
import { intersectRanges, DateRange } from '../datelib/date-range'
import DayTable from '../common/DayTable'
import { DateEnv } from '../datelib/env'
import { DateMarker, addMs } from '../datelib/marker'
import { Slicer } from '../common/slicing-utils'

export interface SimpleTimeGridProps {
  dateProfile: DateProfile | null
  dayTable: DayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUis: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionUiState | null
  eventResize: EventInteractionUiState | null
}

export default class SimpleTimeGrid extends Component<SimpleTimeGridProps> {

  timeGrid: TimeGrid
  dayRanges: DateRange[]

  private buildDayRanges = reselector(buildDayRanges)
  private slicer = new Slicer(sliceSegs)

  constructor(context, timeGrid: TimeGrid) {
    super(context)

    this.timeGrid = timeGrid
    this.slicer.component = timeGrid
  }

  render(props: SimpleTimeGridProps) {
    let { slicer } = this
    let { dateProfile, dayTable } = props

    let dayRanges = this.dayRanges = this.buildDayRanges(dayTable, dateProfile, this.dateEnv)

    this.timeGrid.receiveProps({
      dateProfile,
      cells: dayTable.cells[0],
      businessHourSegs: slicer.businessHoursToSegs(props.businessHours, dateProfile, null, dayRanges),
      eventSegs: slicer.eventStoreToSegs(props.eventStore, props.eventUis, dateProfile, null, dayRanges),
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, dayRanges),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, dateProfile, dayRanges),
      eventResize: slicer.buildEventResize(props.eventResize, dateProfile, dayRanges)
    })
  }

  renderNowIndicator(date: DateMarker) {
    this.timeGrid.renderNowIndicator(
      // seg system might be overkill, but it handles scenario where line needs to be rendered
      //  more than once because of columns with the same date (resources columns for example)
      sliceSegs({
        start: date,
        end: addMs(date, 1) // protect against null range
      }, this.dayRanges),
      date
    )
  }

}

export function buildDayRanges(dayTable: DayTable, dateProfile: DateProfile, dateEnv: DateEnv): DateRange[] {
  let ranges: DateRange[] = []

  for (let date of dayTable.headerDates) {
    ranges.push({
      start: dateEnv.add(date, dateProfile.minTime),
      end: dateEnv.add(date, dateProfile.maxTime)
    })
  }

  return ranges
}

export function sliceSegs(range: DateRange, dayRanges: DateRange[]): TimeGridSeg[] {
  let segs: TimeGridSeg[] = []

  for (let col = 0; col < dayRanges.length; col++) {
    let segRange = intersectRanges(range, dayRanges[col])

    if (segRange) {
      segs.push({
        start: segRange.start,
        end: segRange.end,
        isStart: segRange.start.valueOf() === range.start.valueOf(),
        isEnd: segRange.end.valueOf() === range.end.valueOf(),
        col
      })
    }
  }

  return segs
}
