import TimeGrid, { TimeGridSeg } from './TimeGrid'
import DateComponent from '../component/DateComponent'
import { DateProfile } from '../DateProfileGenerator'
import { EventStore } from '../structs/event-store'
import { EventUiHash } from '../component/event-ui'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { DateSpan } from '../structs/date-span'
import reselector from '../util/reselector'
import { intersectRanges, DateRange } from '../datelib/date-range'
import DayTable from '../common/DayTable'
import { DateEnv } from '../datelib/env'
import { DateMarker, addMs } from '../datelib/marker'
import { Slicer, memoizeSlicer } from '../common/slicing-utils'
import OffsetTracker from '../common/OffsetTracker'
import { Hit } from '../interactions/HitDragging'

export interface SimpleTimeGridProps {
  dateProfile: DateProfile | null
  dayTable: DayTable
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
}

export interface SimpleTimeGridSlicerArgs {
  component: TimeGrid // TODO: kill
  dayRanges: DateRange[]
}

export default class SimpleTimeGrid extends DateComponent<SimpleTimeGridProps> {

  timeGrid: TimeGrid
  dayRanges: DateRange[]
  offsetTracker: OffsetTracker

  private buildDayRanges = reselector(buildDayRanges)
  private slicer = memoizeSlicer(new Slicer(sliceTimeGridSegs))

  constructor(context, timeGrid: TimeGrid) {
    super(context, timeGrid.el)

    this.timeGrid = timeGrid
  }

  render(props: SimpleTimeGridProps) {
    let { slicer } = this
    let { dateProfile, dayTable } = props

    let dayRanges = this.dayRanges = this.buildDayRanges(dayTable, dateProfile, this.dateEnv)
    let slicerArgs: SimpleTimeGridSlicerArgs = { dayRanges, component: this.timeGrid }
    let segRes = slicer.eventStoreToSegs(
      props.eventStore,
      props.eventUiBases,
      dateProfile,
      null,
      slicerArgs
    )

    this.timeGrid.receiveProps({
      dateProfile,
      cells: dayTable.cells[0],
      businessHourSegs: slicer.businessHoursToSegs(props.businessHours, dateProfile, null, slicerArgs),
      bgEventSegs: segRes.bg,
      fgEventSegs: segRes.fg,
      dateSelectionSegs: slicer.selectionToSegs(props.dateSelection, props.eventUiBases, slicerArgs),
      eventSelection: props.eventSelection,
      eventDrag: slicer.buildEventDrag(props.eventDrag, props.eventUiBases, dateProfile, null, slicerArgs),
      eventResize: slicer.buildEventResize(props.eventResize, props.eventUiBases, dateProfile, null, slicerArgs)
    })
  }

  renderNowIndicator(date: DateMarker) { // TODO: user slicer???
    this.timeGrid.renderNowIndicator(
      // seg system might be overkill, but it handles scenario where line needs to be rendered
      //  more than once because of columns with the same date (resources columns for example)
      sliceTimeGridSegs({
        start: date,
        end: addMs(date, 1) // protect against null range
      }, { dayRanges: this.dayRanges, component: this.timeGrid }),
      date
    )
  }

  prepareHits() {
    this.offsetTracker = new OffsetTracker(this.timeGrid.el)
  }

  releaseHits() {
    this.offsetTracker.destroy()
  }

  queryHit(leftOffset, topOffset): Hit {
    let { offsetTracker } = this

    if (offsetTracker.isWithinClipping(leftOffset, topOffset)) {
      let originLeft = offsetTracker.computeLeft()
      let originTop = offsetTracker.computeTop()

      let rawHit = this.timeGrid.positionToHit(
        leftOffset - originLeft,
        topOffset - originTop
      )

      if (rawHit) {
        return {
          component: this.timeGrid,
          dateSpan: rawHit.dateSpan,
          dayEl: rawHit.dayEl,
          rect: {
            left: rawHit.relativeRect.left + originLeft,
            right: rawHit.relativeRect.right + originLeft,
            top: rawHit.relativeRect.top + originTop,
            bottom: rawHit.relativeRect.bottom + originTop
          },
          layer: 0
        }
      }
    }
  }

}

SimpleTimeGrid.prototype.isInteractable = true


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

export function sliceTimeGridSegs(range: DateRange, slicerArgs: SimpleTimeGridSlicerArgs): TimeGridSeg[] {
  let { dayRanges } = slicerArgs
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
