import DateComponent, { Seg } from '../component/DateComponent'
import DayGridEventRenderer from './DayGridEventRenderer'
import { htmlEscape } from '../util/html'
import { createFormatter } from '../datelib/formatting'
import { Hit } from '../interactions/HitDragging'
import OffsetTracker from '../common/OffsetTracker'
import { computeRect } from '../util/dom-geom'
import { Rect, pointInsideRect } from '../util/geom'
import { addDays } from '../datelib/marker'

export default class DayTile extends DateComponent {

  isInteractable = true
  useEventCenter = false
  date: Date
  segContainerEl: HTMLElement
  width: number
  height: number
  offsetTracker: OffsetTracker // TODO: abstraction for tracking dims of whole element rect

  constructor(component, date) {
    super(component)
    this.date = date
  }

  renderSkeleton() {
    let theme = this.getTheme()
    let dateEnv = this.getDateEnv()
    let title = dateEnv.format(
      this.date,
      createFormatter(this.opt('dayPopoverFormat')) // TODO: cache
    )

    this.el.innerHTML =
      '<div class="fc-header ' + theme.getClass('popoverHeader') + '">' +
        '<span class="fc-close ' + theme.getIconClass('close') + '"></span>' +
        '<span class="fc-title">' +
          htmlEscape(title) +
        '</span>' +
        '<div class="fc-clear"></div>' +
      '</div>' +
      '<div class="fc-body ' + theme.getClass('popoverContent') + '">' +
        '<div class="fc-event-container"></div>' +
      '</div>'

    this.segContainerEl = this.el.querySelector('.fc-event-container')
  }

  prepareHits() {
    let rect = computeRect(this.el)
    this.width = rect.right - rect.left
    this.height = rect.bottom - rect.top
    this.offsetTracker = new OffsetTracker(this.el)
  }

  releaseHits() {
    this.offsetTracker.destroy()
  }

  queryHit(leftOffset, topOffset): Hit | null {
    let rectLeft = this.offsetTracker.computeLeft()
    let rectTop = this.offsetTracker.computeTop()
    let rect: Rect = {
      left: rectLeft,
      right: rectLeft + this.width,
      top: rectTop,
      bottom: rectTop + this.height
    }

    if (pointInsideRect({ left: leftOffset, top: topOffset }, rect)) {
      return {
        component: this,
        dateSpan: {
          isAllDay: true,
          range: { start: this.date, end: addDays(this.date, 1) }
        },
        dayEl: this.el,
        rect: rect,
        layer: 1
      }
    }

    return null
  }

}

// hack
export class DayTileEventRenderer extends DayGridEventRenderer {

  // simply append the els the container element
  renderFgSegs(segs: Seg[]) {
    for (let seg of segs) {
      this.component.segContainerEl.appendChild(seg.el)
    }
  }

}

DayTile.prototype.eventRendererClass = DayTileEventRenderer
