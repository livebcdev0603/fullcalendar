import { applyStyle } from '../util/dom-manip'
import HelperRenderer from '../component/renderers/HelperRenderer'


export default class TimeGridHelperRenderer extends HelperRenderer {

  renderSegs(segs, sourceSeg) {
    let helperNodes = []
    let i
    let seg
    let sourceEl
    let computedStyle

    // TODO: not good to call eventRenderer this way
    this.eventRenderer.renderFgSegsIntoContainers(
      segs,
      this.component.helperContainerEls
    )

    // Try to make the segment that is in the same row as sourceSeg look the same
    for (i = 0; i < segs.length; i++) {
      seg = segs[i]

      if (sourceSeg && sourceSeg.col === seg.col) {
        sourceEl = sourceSeg.el
        computedStyle = window.getComputedStyle(sourceEl)
        applyStyle(seg.el, {
          left: computedStyle.left,
          right: computedStyle.right,
          marginLeft: computedStyle.marginLeft,
          marginRight: computedStyle.marginRight
        })
      }

      helperNodes.push(seg.el)
    }

    return helperNodes // must return the elements rendered
  }

}
