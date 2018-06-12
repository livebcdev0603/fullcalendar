import { removeElement } from '../../util/dom-manip'
import { Seg } from '../../reducers/seg'


export default abstract class HelperRenderer {

  view: any
  component: any
  eventRenderer: any
  helperEls: HTMLElement[]


  constructor(component, eventRenderer) {
    this.view = component._getView()
    this.component = component
    this.eventRenderer = eventRenderer
  }


  renderEventDraggingSegs(segs: Seg[], sourceSeg, isTouch) {
    this.renderEventSegs(
      segs,
      sourceSeg,
      'fc-dragging',
      isTouch ? null : this.view.opt('dragOpacity')
    )
  }


  renderEventResizingSegs(segs: Seg[], sourceSeg, isTouch) {
    this.renderEventSegs(
      segs,
      sourceSeg,
      'fc-resizing'
    )
  }


  renderEventSegs(segs: Seg[], sourceSeg?, extraClassName?, opacity?) {
    let i

    // assigns each seg's el and returns a subset of segs that were rendered
    segs = this.eventRenderer.renderFgSegEls(segs)

    for (i = 0; i < segs.length; i++) {
      let classList = segs[i].el.classList
      classList.add('fc-helper')
      if (extraClassName) {
        classList.add(extraClassName)
      }
    }

    if (opacity != null) {
      for (i = 0; i < segs.length; i++) {
        segs[i].el.style.opacity = opacity
      }
    }

    this.helperEls = this.renderSegs(segs, sourceSeg)
  }


  /*
  Must return all mock event elements
  */
  abstract renderSegs(segs: Seg[], sourceSeg?): HTMLElement[]


  unrender() {
    if (this.helperEls) {
      this.helperEls.forEach(removeElement)
      this.helperEls = null
    }
  }

}
