import View from '../../View'
import { DateMarker } from '../../datelib/marker'
import { createFormatter, DateFormatter } from '../../datelib/formatting'
import { htmlToElements } from '../../util/dom-manip'
import { compareByFieldSpecs } from '../../util/misc'
import { EventRenderRange } from '../../reducers/event-rendering'
import { Seg } from '../../reducers/seg'


export default class EventRenderer {

  view: View
  component: any
  fillRenderer: any // might remain null

  fgSegs: Seg[]
  bgSegs: Seg[]

  // derived from options
  eventTimeFormat: DateFormatter
  displayEventTime: boolean
  displayEventEnd: boolean


  constructor(component, fillRenderer) { // fillRenderer is optional
    this.view = component._getView()
    this.component = component
    this.fillRenderer = fillRenderer
  }


  opt(name) {
    return this.view.opt(name)
  }


  // Updates values that rely on options and also relate to range
  rangeUpdated() {
    let displayEventTime
    let displayEventEnd

    this.eventTimeFormat = createFormatter(
      this.opt('eventTimeFormat') ||
      this.opt('timeFormat') || // deprecated
      this.computeEventTimeFormat()
    )

    displayEventTime = this.opt('displayEventTime')
    if (displayEventTime == null) {
      displayEventTime = this.computeDisplayEventTime() // might be based off of range
    }

    displayEventEnd = this.opt('displayEventEnd')
    if (displayEventEnd == null) {
      displayEventEnd = this.computeDisplayEventEnd() // might be based off of range
    }

    this.displayEventTime = displayEventTime
    this.displayEventEnd = displayEventEnd
  }


  renderSegs(allSegs: Seg[]) {
    let bgSegs: Seg[] = []
    let fgSegs: Seg[] = []

    for (let seg of allSegs) {
      let rendering = seg.eventRange.eventDef.rendering

      if (rendering === 'background' || rendering === 'inverse-background') {
        bgSegs.push(seg)
      } else {
        fgSegs.push(seg)
      }
    }

    if (this.renderBgSegs(bgSegs) !== false) { // no failure?
      this.bgSegs = bgSegs
    }

    // render an `.el` on each seg
    // returns a subset of the segs. segs that were actually rendered
    fgSegs = this.renderFgSegEls(fgSegs)

    if (this.renderFgSegs(fgSegs) !== false) { // no failure?
      this.fgSegs = fgSegs
    }
  }


  unrender() {
    this.unrenderBgSegs()
    this.bgSegs = null

    this.unrenderFgSegs(this.fgSegs || [])
    this.fgSegs = null
  }


  getSegs() {
    return (this.bgSegs || []).concat(this.fgSegs || [])
  }


  // Renders foreground event segments onto the grid
  renderFgSegs(segs: Seg[]): (boolean | void) {
    // subclasses must implement
    // segs already has rendered els, and has been filtered.

    return false // signal failure if not implemented
  }


  // Unrenders all currently rendered foreground segments
  unrenderFgSegs(segs: Seg[]) {
    // subclasses must implement
  }


  renderBgSegs(segs: Seg[]) {
    if (this.fillRenderer) {
      this.fillRenderer.renderSegs('bgEvent', segs, {
        getClasses: (seg) => {
          return this.getBgClasses(seg.eventRange.eventDef)
        },
        getCss: (seg) => {
          return {
            'background-color': this.getBgColor(seg.eventRange.eventDef)
          }
        },
        filterEl: (seg, el) => {
          return this.filterEventRenderEl(seg.eventRange, el)
        }
      })
    } else {
      return false // signal failure if no fillRenderer
    }
  }


  unrenderBgSegs() {
    if (this.fillRenderer) {
      this.fillRenderer.unrender('bgEvent')
    }
  }


  // Renders and assigns an `el` property for each foreground event segment.
  // Only returns segments that successfully rendered.
  renderFgSegEls(segs: Seg[], disableResizing= false) {
    let hasEventRenderHandlers = this.view.hasPublicHandlers('eventRender')
    let html = ''
    let renderedSegs = []
    let i

    if (segs.length) { // don't build an empty html string

      // build a large concatenation of event segment HTML
      for (i = 0; i < segs.length; i++) {
        this.beforeFgSegHtml(segs[i])
        html += this.fgSegHtml(segs[i], disableResizing)
      }

      // Grab individual elements from the combined HTML string. Use each as the default rendering.
      // Then, compute the 'el' for each segment. An el might be null if the eventRender callback returned false.
      htmlToElements(html).forEach((el, i) => {
        let seg = segs[i]

        if (hasEventRenderHandlers) { // optimization
          el = this.filterEventRenderEl(seg.eventRange, el)
        }

        if (el) {
          (el as any).fcSeg = seg // used by handlers
          seg.el = el
          renderedSegs.push(seg)
        }
      })
    }

    return renderedSegs
  }


  beforeFgSegHtml(seg: Seg) { // hack
  }


  // Generates the HTML for the default rendering of a foreground event segment. Used by renderFgSegEls()
  fgSegHtml(seg: Seg, disableResizing) {
    // subclasses should implement
  }


  // Generic utility for generating the HTML classNames for an event segment's element
  getSegClasses(seg: Seg, isDraggable, isResizable) {
    let classes = [
      'fc-event',
      seg.isStart ? 'fc-start' : 'fc-not-start',
      seg.isEnd ? 'fc-end' : 'fc-not-end'
    ].concat(this.getClasses(seg.eventRange.eventDef))

    if (isDraggable) {
      classes.push('fc-draggable')
    }
    if (isResizable) {
      classes.push('fc-resizable')
    }

    // event is currently selected? attach a className.
    if (this.view.isEventDefSelected(seg.eventRange.eventDef)) {
      classes.push('fc-selected')
    }

    return classes
  }


  // Given an event and the default element used for rendering, returns the element that should actually be used.
  // Basically runs events and elements through the eventRender hook.
  filterEventRenderEl(eventRange: EventRenderRange, el) {

    let custom = this.view.publiclyTrigger('eventRender', [
      {
        event: legacy,
        el,
        view: this.view
      }
    ])

    if (custom === false) { // means don't render at all
      el = null
    } else if (custom && custom !== true) {
      el = custom
    }

    return el
  }


  // Compute the text that should be displayed on an event's element.
  // `range` can be the Event object itself, or something range-like, with at least a `start`.
  // If event times are disabled, or the event has no time, will return a blank string.
  // If not specified, formatter will default to the eventTimeFormat setting,
  // and displayEnd will default to the displayEventEnd setting.
  getTimeText(eventRange: EventRenderRange, formatter?, displayEnd?) {
    let { eventDef, eventInstance } = eventRange

    return this._getTimeText(
      eventInstance.range.start,
      eventDef.hasEnd ? eventInstance.range.end : null,
      eventDef.isAllDay,
      formatter,
      displayEnd,
      eventInstance.forcedStartTzo,
      eventInstance.forcedEndTzo
    )
  }


  _getTimeText(
    start: DateMarker,
    end: DateMarker,
    isAllDay,
    formatter?,
    displayEnd?,
    forcedStartTimeZoneOffset?: number,
    forcedEndTimeZoneOffset?: number
) {
    const dateEnv = this.view.calendar.dateEnv

    if (formatter == null) {
      formatter = this.eventTimeFormat
    }

    if (displayEnd == null) {
      displayEnd = this.displayEventEnd
    }

    if (this.displayEventTime && !isAllDay) {
      if (displayEnd && end) {
        return dateEnv.formatRange(start, end, formatter, {
          forcedStartTimeZoneOffset,
          forcedEndTimeZoneOffset
        })
      } else {
        return dateEnv.format(start, formatter, {
          forcedTimeZoneOffset: forcedStartTimeZoneOffset
        })
      }
    }

    return ''
  }


  computeEventTimeFormat(): any {
    return {
      hour: 'numeric',
      minute: '2-digit',
      omitZeroTime: true
    }
  }


  computeDisplayEventTime() {
    return true
  }


  computeDisplayEventEnd() {
    return true
  }


  getBgClasses(eventDef) {
    let classNames = this.getClasses(eventDef)
    classNames.push('fc-bgevent')
    return classNames
  }


  getClasses(eventDef) {
    let objs = this.getStylingObjs(eventDef)
    let i
    let classNames = []

    for (i = 0; i < objs.length; i++) {
      classNames.push.apply( // append
        classNames,
        objs[i].eventClassName || objs[i].className || []
      )
    }

    return classNames
  }


  // Utility for generating event skin-related CSS properties
  getSkinCss(eventDef) {
    return {
      'background-color': this.getBgColor(eventDef),
      'border-color': this.getBorderColor(eventDef),
      color: this.getTextColor(eventDef)
    }
  }


  // Queries for caller-specified color, then falls back to default
  getBgColor(eventDef) {
    let objs = this.getStylingObjs(eventDef)
    let i
    let val

    for (i = 0; i < objs.length && !val; i++) {
      val = objs[i].eventBackgroundColor || objs[i].eventColor ||
        objs[i].backgroundColor || objs[i].color
    }

    if (!val) {
      val = this.opt('eventBackgroundColor') || this.opt('eventColor')
    }

    return val
  }


  // Queries for caller-specified color, then falls back to default
  getBorderColor(eventDef) {
    let objs = this.getStylingObjs(eventDef)
    let i
    let val

    for (i = 0; i < objs.length && !val; i++) {
      val = objs[i].eventBorderColor || objs[i].eventColor ||
        objs[i].borderColor || objs[i].color
    }

    if (!val) {
      val = this.opt('eventBorderColor') || this.opt('eventColor')
    }

    return val
  }


  // Queries for caller-specified color, then falls back to default
  getTextColor(eventDef) {
    let objs = this.getStylingObjs(eventDef)
    let i
    let val

    for (i = 0; i < objs.length && !val; i++) {
      val = objs[i].eventTextColor ||
        objs[i].textColor
    }

    if (!val) {
      val = this.opt('eventTextColor')
    }

    return val
  }


  getStylingObjs(eventDef) {
    let objs = this.getFallbackStylingObjs(eventDef)
    objs.unshift(eventDef)
    return objs
  }


  getFallbackStylingObjs(eventDef): any {
    if (eventDef.sourceId) {
      return [ this.view.calendar.state.eventSources[eventDef.sourceId] ]
    } else {
      return []
    }
  }


  sortEventSegs(segs) {
    segs.sort(this.compareEventSegs.bind(this))
  }


  // A cmp function for determining which segments should take visual priority
  compareEventSegs(seg1: Seg, seg2: Seg) {
    let eventDef1 = seg1.eventRange.eventDef
    let eventDef2 = seg2.eventRange.eventDef
    let r1 = seg1.range
    let r2 = seg2.range

    return r1.start.valueOf() - r2.start.valueOf() || // earlier events go first
      (r2.end.valueOf() - r2.start.valueOf()) - (r1.end.valueOf() - r1.start.valueOf()) || // tie? longer events go first
      Number(eventDef2.isAllDay) - Number(eventDef1.isAllDay) || // tie? put all-day events first
      compareByFieldSpecs(
        eventDef1,
        eventDef2,
        this.view.eventOrderSpecs,
        eventDef1.extendedProps,
        eventDef2.extendedProps
      )
  }

}
