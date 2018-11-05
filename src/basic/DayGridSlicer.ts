import { DateRange, intersectRanges } from '../datelib/date-range'
import DateProfileGenerator, { DateProfile } from '../DateProfileGenerator'
import { Seg } from '../component/DateComponent'
import { addDays, DateMarker } from '../datelib/marker'
import DaySeries from '../component/DaySeries'


export default class DayGridSlicer {

  dateProfile: DateProfile
  daySeries: DaySeries
  daysPerRow: number
  isRtl: boolean
  rowCnt: number
  colCnt: number


  constructor(dateProfile: DateProfile, dateProfileGenerator: DateProfileGenerator, isRtl: boolean, breakOnWeeks: boolean) {
    let daySeries = new DaySeries(dateProfile, dateProfileGenerator)
    let { dates } = daySeries
    let daysPerRow
    let firstDay
    let rowCnt

    if (breakOnWeeks) {
      // count columns until the day-of-week repeats
      firstDay = dates[0].getUTCDay()
      for (daysPerRow = 1; daysPerRow < dates.length; daysPerRow++) {
        if (dates[daysPerRow].getUTCDay() === firstDay) {
          break
        }
      }
      rowCnt = Math.ceil(dates.length / daysPerRow)
    } else {
      rowCnt = 1
      daysPerRow = dates.length
    }

    this.dateProfile = dateProfile
    this.daySeries = daySeries
    this.daysPerRow = daysPerRow
    this.isRtl = isRtl
    this.rowCnt = rowCnt
    this.colCnt = daysPerRow
  }


  // Slices up the given span (unzoned start/end with other misc data) into an array of segments
  rangeToSegs(range: DateRange): Seg[] {

    range = intersectRanges(range, this.dateProfile.validRange)

    if (range) {
      let segs = this.sliceRangeByRow(range)

      for (let i = 0; i < segs.length; i++) {
        let seg = segs[i]
        seg.component = this

        if (this.isRtl) {
          seg.leftCol = this.daysPerRow - 1 - seg.lastRowDayIndex
          seg.rightCol = this.daysPerRow - 1 - seg.firstRowDayIndex
        } else {
          seg.leftCol = seg.firstRowDayIndex
          seg.rightCol = seg.lastRowDayIndex
        }
      }

      return segs
    } else {
      return []
    }
  }


  // Slices up a date range into a segment for every week-row it intersects with
  // range already normalized to start-of-day
  sliceRangeByRow(range) {
    let daysPerRow = this.daysPerRow
    let rangeFirst = this.daySeries.getDateDayIndex(range.start) // inclusive first index
    let rangeLast = this.daySeries.getDateDayIndex(addDays(range.end, -1)) // inclusive last index
    let segs = []
    let row
    let rowFirst
    let rowLast // inclusive day-index range for current row
    let segFirst
    let segLast // inclusive day-index range for segment

    for (row = 0; row < this.rowCnt; row++) {
      rowFirst = row * daysPerRow
      rowLast = rowFirst + daysPerRow - 1

      // intersect segment's offset range with the row's
      segFirst = Math.max(rangeFirst, rowFirst)
      segLast = Math.min(rangeLast, rowLast)

      // deal with in-between indices
      segFirst = Math.ceil(segFirst) // in-between starts round to next cell
      segLast = Math.floor(segLast) // in-between ends round to prev cell

      if (segFirst <= segLast) { // was there any intersection with the current row?
        segs.push({
          row: row,

          // normalize to start of row
          firstRowDayIndex: segFirst - rowFirst,
          lastRowDayIndex: segLast - rowFirst,

          // must be matching integers to be the segment's start/end
          isStart: segFirst === rangeFirst,
          isEnd: segLast === rangeLast
        })
      }
    }

    return segs
  }


  // Computes the DateMarker for the given cell
  getCellDate(row, col): DateMarker {
    return this.daySeries.dates[this.getCellDayIndex(row, col)]
  }


  // Computes the ambiguously-timed date range for the given cell
  getCellRange(row, col): DateRange {
    let start = this.getCellDate(row, col)
    let end = addDays(start, 1)

    return { start, end }
  }


  // Returns the number of day cells, chronologically, from the first of the grid (0-based)
  private getCellDayIndex(row, col) {
    return row * this.daysPerRow + this.getColDayIndex(col)
  }


  // Returns the numner of day cells, chronologically, from the first cell in *any given row*
  private getColDayIndex(col) {
    if (this.isRtl) {
      return this.colCnt - 1 - col
    } else {
      return col
    }
  }

}
