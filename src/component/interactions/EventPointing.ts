import GlobalEmitter from '../../common/GlobalEmitter'
import Interaction from './Interaction'


export default class EventPointing extends Interaction {

  mousedOverSeg: any // the segment object the user's mouse is over. null if over nothing


  /*
  component must implement:
    - publiclyTrigger
  */


  bindToEl(el) {
    let component = this.component

    component.bindSegHandlerToEl(el, 'click', this.handleClick.bind(this))

    component.bindSegHoverHandlersToEl(
      el,
      this.handleMouseover.bind(this),
      this.handleMouseout.bind(this)
    )
  }


  handleClick(seg, ev) {
    let res = this.component.publiclyTrigger('eventClick', [ // can return `false` to cancel
      {
        el: seg.el,
        event: seg.footprint.getEventLegacy(this.view.calendar),
        jsEvent: ev,
        view: this.view
      }
    ])

    if (res === false) {
      ev.preventDefault()
    }
  }


  // Updates internal state and triggers handlers for when an event element is moused over
  handleMouseover(seg, ev) {
    if (
      !GlobalEmitter.get().shouldIgnoreMouse() &&
      !this.mousedOverSeg
    ) {
      this.mousedOverSeg = seg

      // TODO: move to EventSelecting's responsibility
      if (this.view.isEventDefResizable(seg.footprint.eventDef)) {
        seg.el.classList.add('fc-allow-mouse-resize')
      }

      this.component.publiclyTrigger('eventMouseover', [
        {
          el: seg.el,
          event: seg.footprint.getEventLegacy(this.view.calendar),
          jsEvent: ev,
          view: this.view
        }
      ])
    }
  }


  // Updates internal state and triggers handlers for when an event element is moused out.
  // Can be given no arguments, in which case it will mouseout the segment that was previously moused over.
  handleMouseout(seg, ev?) {
    if (this.mousedOverSeg) {
      this.mousedOverSeg = null

      // TODO: move to EventSelecting's responsibility
      if (this.view.isEventDefResizable(seg.footprint.eventDef)) {
        seg.el.classList.remove('fc-allow-mouse-resize')
      }

      this.component.publiclyTrigger('eventMouseout', [
        {
          el: seg.el,
          event: seg.footprint.getEventLegacy(this.view.calendar),
          jsEvent: ev || {}, // if given no arg, make a mock mouse event
          view: this.view
        }
      ])
    }
  }


  end() {
    if (this.mousedOverSeg) {
      this.handleMouseout(this.mousedOverSeg)
    }
  }

}
