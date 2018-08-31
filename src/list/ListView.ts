import { htmlToElement, createElement } from '../util/dom-manip'
import { htmlEscape } from '../util/html'
import { subtractInnerElHeight } from '../util/misc'
import View from '../View'
import ScrollComponent from '../common/ScrollComponent'
import ListEventRenderer from './ListEventRenderer'
import { DateMarker, addDays, startOfDay } from '../datelib/marker'
import { createFormatter } from '../datelib/formatting'
import { DateRange, intersectRanges } from '../datelib/date-range'
import { DateProfile } from '../DateProfileGenerator'

/*
Responsible for the scroller, and forwarding event-related actions into the "grid".
*/
export default class ListView extends View {

  // initialized after the class
  eventRendererClass: any

  isInteractable = true
  slicingType: 'all-day' = 'all-day' // stupid TypeScript
  fgSegSelector: any = '.fc-list-item' // which elements accept event actions

  scroller: ScrollComponent
  contentEl: HTMLElement

  dayDates: DateMarker[]
  dayRanges: DateRange[] // start/end of each day


  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)

    this.scroller = new ScrollComponent(
      'hidden', // overflow x
      'auto' // overflow y
    )
  }


  renderSkeleton() {
    this.el.classList.add('fc-list-view')

    let themeClass = this.calendar.theme.getClass('listView')
    if (themeClass) {
      this.el.classList.add(themeClass)
    }

    this.scroller.applyOverflow()
    this.el.appendChild(this.scroller.el)

    this.contentEl = this.scroller.el // shortcut
  }


  unrenderSkeleton() {
    this.scroller.removeElement() // will remove the Grid too
  }


  updateBaseSize(totalHeight, isAuto) {
    this.scroller.clear() // sets height to 'auto' and clears overflow

    if (!isAuto) {
      this.scroller.setHeight(this.computeScrollerHeight(totalHeight))
    }
  }


  computeScrollerHeight(totalHeight) {
    return totalHeight -
      subtractInnerElHeight(this.el, this.scroller.el) // everything that's NOT the scroller
  }


  renderDates(dateProfile: DateProfile) {
    let dayStart = startOfDay(dateProfile.renderRange.start)
    let viewEnd = dateProfile.renderRange.end
    let dayDates: DateMarker[] = []
    let dayRanges: DateRange[] = []

    while (dayStart < viewEnd) {

      dayDates.push(dayStart)

      dayRanges.push({
        start: dayStart,
        end: addDays(dayStart, 1)
      })

      dayStart = addDays(dayStart, 1)
    }

    this.dayDates = dayDates
    this.dayRanges = dayRanges

    // all real rendering happens in EventRenderer

    super.renderDates(dateProfile) // important for firing datesRender
  }


  // slices by day
  rangeToSegs(range: DateRange, isAllDay: boolean) {
    let dateEnv = this.getDateEnv()
    let dayRanges = this.dayRanges
    let dayIndex
    let segRange
    let seg
    let segs = []

    for (dayIndex = 0; dayIndex < dayRanges.length; dayIndex++) {
      segRange = intersectRanges(range, dayRanges[dayIndex])

      if (segRange) {
        seg = {
          component: this,
          start: segRange.start,
          end: segRange.end,
          isStart: segRange.start.valueOf() === range.start.valueOf(),
          isEnd: segRange.end.valueOf() === range.end.valueOf(),
          dayIndex: dayIndex
        }

        segs.push(seg)

        // detect when range won't go fully into the next day,
        // and mutate the latest seg to the be the end.
        if (
          !seg.isEnd && !isAllDay &&
          dayIndex + 1 < dayRanges.length &&
          range.end <
            dateEnv.add(
              dayRanges[dayIndex + 1].start,
              this.nextDayThreshold
            )
        ) {
          seg.end = range.end
          seg.isEnd = true
          break
        }
      }
    }

    return segs
  }


  renderEmptyMessage() {
    this.contentEl.innerHTML =
      '<div class="fc-list-empty-wrap2">' + // TODO: try less wraps
      '<div class="fc-list-empty-wrap1">' +
      '<div class="fc-list-empty">' +
        htmlEscape(this.opt('noEventsMessage')) +
      '</div>' +
      '</div>' +
      '</div>'
  }


  // render the event segments in the view
  renderSegList(allSegs) {
    let segsByDay = this.groupSegsByDay(allSegs) // sparse array
    let dayIndex
    let daySegs
    let i
    let tableEl = htmlToElement('<table class="fc-list-table ' + this.calendar.theme.getClass('tableList') + '"><tbody></tbody></table>')
    let tbodyEl = tableEl.querySelector('tbody')

    for (dayIndex = 0; dayIndex < segsByDay.length; dayIndex++) {
      daySegs = segsByDay[dayIndex]

      if (daySegs) { // sparse array, so might be undefined

        // append a day header
        tbodyEl.appendChild(this.buildDayHeaderRow(this.dayDates[dayIndex]))

        daySegs = this.eventRenderer.sortEventSegs(
          daySegs,
          [
            { field: 'start', order: 1 } // always put earlier events first, regardless of eventOrder
          ].concat(this.view.eventOrderSpecs)
        )

        for (i = 0; i < daySegs.length; i++) {
          tbodyEl.appendChild(daySegs[i].el) // append event row
        }
      }
    }

    this.contentEl.innerHTML = ''
    this.contentEl.appendChild(tableEl)
  }


  // Returns a sparse array of arrays, segs grouped by their dayIndex
  groupSegsByDay(segs) {
    let segsByDay = [] // sparse array
    let i
    let seg

    for (i = 0; i < segs.length; i++) {
      seg = segs[i];
      (segsByDay[seg.dayIndex] || (segsByDay[seg.dayIndex] = []))
        .push(seg)
    }

    return segsByDay
  }


  // generates the HTML for the day headers that live amongst the event rows
  buildDayHeaderRow(dayDate) {
    let dateEnv = this.getDateEnv()
    let mainFormat = createFormatter(this.opt('listDayFormat')) // TODO: cache
    let altFormat = createFormatter(this.opt('listDayAltFormat')) // TODO: cache

    return createElement('tr', {
      className: 'fc-list-heading',
      'data-date': dateEnv.formatIso(dayDate, { omitTime: true })
    }, '<td class="' + (
      this.calendar.theme.getClass('tableListHeading') ||
      this.calendar.theme.getClass('widgetHeader')
    ) + '" colspan="3">' +
      (mainFormat ?
        this.buildGotoAnchorHtml(
          dayDate,
          { 'class': 'fc-list-heading-main' },
          htmlEscape(dateEnv.format(dayDate, mainFormat)) // inner HTML
        ) :
        '') +
      (altFormat ?
        this.buildGotoAnchorHtml(
          dayDate,
          { 'class': 'fc-list-heading-alt' },
          htmlEscape(dateEnv.format(dayDate, altFormat)) // inner HTML
        ) :
        '') +
    '</td>') as HTMLTableRowElement
  }

}

ListView.prototype.eventRendererClass = ListEventRenderer
