import { htmlEscape } from '../util/html'
import { createElement, findElements } from '../util/dom-manip'
import {
  matchCellWidths,
  uncompensateScroll,
  compensateScroll,
  subtractInnerElHeight,
  distributeHeight,
  undistributeHeight
} from '../util/misc'
import { createFormatter } from '../datelib/formatting'
import ScrollComponent from '../common/ScrollComponent'
import View from '../View'
import BasicViewDateProfileGenerator from './BasicViewDateProfileGenerator'
import DayGrid from './DayGrid'

const WEEK_NUM_FORMAT = createFormatter({ week: 'numeric' })


/* An abstract class for the "basic" views, as well as month view. Renders one or more rows of day cells.
----------------------------------------------------------------------------------------------------------------------*/
// It is a manager for a DayGrid subcomponent, which does most of the heavy lifting.
// It is responsible for managing width/height.

export default class BasicView extends View {

  // initialized after class
  dateProfileGeneratorClass: any
  dayGridClass: any // class the dayGrid will be instantiated from (overridable by subclasses)

  scroller: ScrollComponent
  dayGrid: DayGrid // the main subcomponent that does most of the heavy lifting
  colWeekNumbersVisible: boolean = false

  weekNumberWidth: any // width of all the week-number cells running down the side


  constructor(calendar, viewSpec) {
    super(calendar, viewSpec)

    this.dayGrid = this.instantiateDayGrid()
    this.dayGrid.isRigid = this.hasRigidRows()

    if (this.opt('weekNumbers')) {
      if (this.opt('weekNumbersWithinDays')) {
        this.dayGrid.cellWeekNumbersVisible = true
        this.colWeekNumbersVisible = false
      } else {
        this.dayGrid.cellWeekNumbersVisible = false
        this.colWeekNumbersVisible = true
      }
    }

    this.addChild(this.dayGrid)

    this.scroller = new ScrollComponent(
      'hidden', // overflow x
      'auto' // overflow y
    )
  }


  // Generates the DayGrid object this view needs. Draws from this.dayGridClass
  instantiateDayGrid() {
    // generate a subclass on the fly with BasicView-specific behavior
    // TODO: cache this subclass
    let subclass: any = makeDayGridSubclass(this.dayGridClass)

    return new subclass(this)
  }


  renderDates() {
    this.dayGrid.breakOnWeeks = /year|month|week/.test(
      this.dateProfile.currentRangeUnit
    )

    super.renderDates()
  }


  renderSkeleton() {
    let dayGridContainerEl
    let dayGridEl

    this.el.classList.add('fc-basic-view')
    this.el.innerHTML = this.renderSkeletonHtml()

    this.scroller.applyOverflow()

    dayGridContainerEl = this.scroller.el
    dayGridContainerEl.classList.add('fc-day-grid-container')
    dayGridEl = createElement('div', { className: 'fc-day-grid' })
    dayGridContainerEl.appendChild(dayGridEl)

    this.el.querySelector('.fc-body > tr > td').appendChild(dayGridContainerEl)

    this.dayGrid.headContainerEl = this.el.querySelector('.fc-head-container')
    this.dayGrid.setElement(dayGridEl)
  }


  unrenderSkeleton() {
    this.dayGrid.removeElement()
    this.scroller.removeElement()
  }


  // Builds the HTML skeleton for the view.
  // The day-grid component will render inside of a container defined by this HTML.
  renderSkeletonHtml() {
    let theme = this.getTheme()

    return '' +
      '<table class="' + theme.getClass('tableGrid') + '">' +
        (this.opt('columnHeader') ?
          '<thead class="fc-head">' +
            '<tr>' +
              '<td class="fc-head-container ' + theme.getClass('widgetHeader') + '">&nbsp;</td>' +
            '</tr>' +
          '</thead>' :
          ''
          ) +
        '<tbody class="fc-body">' +
          '<tr>' +
            '<td class="' + theme.getClass('widgetContent') + '"></td>' +
          '</tr>' +
        '</tbody>' +
      '</table>'
  }


  // Generates an HTML attribute string for setting the width of the week number column, if it is known
  weekNumberStyleAttr() {
    if (this.weekNumberWidth != null) {
      return 'style="width:' + this.weekNumberWidth + 'px"'
    }
    return ''
  }


  // Determines whether each row should have a constant height
  hasRigidRows() {
    let eventLimit = this.opt('eventLimit')

    return eventLimit && typeof eventLimit !== 'number'
  }


  /* Dimensions
  ------------------------------------------------------------------------------------------------------------------*/


  // Refreshes the horizontal dimensions of the view
  updateBaseSize(totalHeight, isAuto) {
    let { dayGrid } = this
    let eventLimit = this.opt('eventLimit')
    let headRowEl =
      dayGrid.headContainerEl ?
        dayGrid.headContainerEl.querySelector('.fc-row') as HTMLElement :
        null
    let scrollerHeight
    let scrollbarWidths

    // hack to give the view some height prior to dayGrid's columns being rendered
    // TODO: separate setting height from scroller VS dayGrid.
    if (!dayGrid.rowEls) {
      if (!isAuto) {
        scrollerHeight = this.computeScrollerHeight(totalHeight)
        this.scroller.setHeight(scrollerHeight)
      }
      return
    }

    if (this.colWeekNumbersVisible) {
      // Make sure all week number cells running down the side have the same width.
      // Record the width for cells created later.
      this.weekNumberWidth = matchCellWidths(
        findElements(this.el, '.fc-week-number')
      )
    }

    // reset all heights to be natural
    this.scroller.clear()
    if (headRowEl) {
      uncompensateScroll(headRowEl)
    }

    dayGrid.removeSegPopover() // kill the "more" popover if displayed

    // is the event limit a constant level number?
    if (eventLimit && typeof eventLimit === 'number') {
      dayGrid.limitRows(eventLimit) // limit the levels first so the height can redistribute after
    }

    // distribute the height to the rows
    // (totalHeight is a "recommended" value if isAuto)
    scrollerHeight = this.computeScrollerHeight(totalHeight)
    this.setGridHeight(scrollerHeight, isAuto)

    // is the event limit dynamically calculated?
    if (eventLimit && typeof eventLimit !== 'number') {
      dayGrid.limitRows(eventLimit) // limit the levels after the grid's row heights have been set
    }

    if (!isAuto) { // should we force dimensions of the scroll container?

      this.scroller.setHeight(scrollerHeight)
      scrollbarWidths = this.scroller.getScrollbarWidths()

      if (scrollbarWidths.left || scrollbarWidths.right) { // using scrollbars?

        if (headRowEl) {
          compensateScroll(headRowEl, scrollbarWidths)
        }

        // doing the scrollbar compensation might have created text overflow which created more height. redo
        scrollerHeight = this.computeScrollerHeight(totalHeight)
        this.scroller.setHeight(scrollerHeight)
      }

      // guarantees the same scrollbar widths
      this.scroller.lockOverflow(scrollbarWidths)
    }
  }


  // given a desired total height of the view, returns what the height of the scroller should be
  computeScrollerHeight(totalHeight) {
    return totalHeight -
      subtractInnerElHeight(this.el, this.scroller.el) // everything that's NOT the scroller
  }


  // Sets the height of just the DayGrid component in this view
  setGridHeight(height, isAuto) {
    if (isAuto) {
      undistributeHeight(this.dayGrid.rowEls) // let the rows be their natural height with no expanding
    } else {
      distributeHeight(this.dayGrid.rowEls, height, true) // true = compensate for height-hogging rows
    }
  }


  /* Scroll
  ------------------------------------------------------------------------------------------------------------------*/


  computeInitialDateScroll() {
    return { top: 0 }
  }


  queryDateScroll() {
    return { top: this.scroller.getScrollTop() }
  }


  applyDateScroll(scroll) {
    if (scroll.top !== undefined) {
      this.scroller.setScrollTop(scroll.top)
    }
  }

}


BasicView.prototype.dateProfileGeneratorClass = BasicViewDateProfileGenerator
BasicView.prototype.dayGridClass = DayGrid


// customize the rendering behavior of BasicView's dayGrid
function makeDayGridSubclass(SuperClass) {

  return class SubClass extends SuperClass {


    // Generates the HTML that will go before the day-of week header cells
    renderHeadIntroHtml() {
      let view = this.view

      if (view.colWeekNumbersVisible) {
        return '' +
          '<th class="fc-week-number ' + view.calendar.theme.getClass('widgetHeader') + '" ' + view.weekNumberStyleAttr() + '>' +
            '<span>' + // needed for matchCellWidths
              htmlEscape(this.opt('weekLabel')) +
            '</span>' +
          '</th>'
      }

      return ''
    }


    // Generates the HTML that will go before content-skeleton cells that display the day/week numbers
    renderNumberIntroHtml(row) {
      let view = this.view
      let dateEnv = this.getDateEnv()
      let weekStart = this.getCellDate(row, 0)

      if (view.colWeekNumbersVisible) {
        return '' +
          '<td class="fc-week-number" ' + view.weekNumberStyleAttr() + '>' +
            view.buildGotoAnchorHtml( // aside from link, important for matchCellWidths
              { date: weekStart, type: 'week', forceOff: this.colCnt === 1 },
              dateEnv.format(weekStart, WEEK_NUM_FORMAT) // inner HTML
            ) +
          '</td>'
      }

      return ''
    }


    // Generates the HTML that goes before the day bg cells for each day-row
    renderBgIntroHtml() {
      let view = this.view

      if (view.colWeekNumbersVisible) {
        return '<td class="fc-week-number ' + view.calendar.theme.getClass('widgetContent') + '" ' +
          view.weekNumberStyleAttr() + '></td>'
      }

      return ''
    }


    // Generates the HTML that goes before every other type of row generated by DayGrid.
    // Affects helper-skeleton and highlight-skeleton rows.
    renderIntroHtml() {
      let view = this.view

      if (view.colWeekNumbersVisible) {
        return '<td class="fc-week-number" ' + view.weekNumberStyleAttr() + '></td>'
      }

      return ''
    }


    getIsNumbersVisible() {
      let view = this.view
      return DayGrid.prototype.getIsNumbersVisible.apply(this, arguments) || view.colWeekNumbersVisible
    }

  }
}
