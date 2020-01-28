import { h, ComponentChildren, Ref } from '../vdom'
import { BaseComponent, setRef } from '../vdom-util'
import { CssDimValue, ScrollerLike } from './util'


export type OverflowValue = 'auto' | 'hidden' | 'scroll'

export interface ScrollerProps {
  overflowX: OverflowValue
  overflowY: OverflowValue
  vGrow?: boolean
  maxHeight?: CssDimValue
  style?: object // complex object, bad for purecomponent, but who cares because has children anyway
  className?: string // can kill at some pt?
  children?: ComponentChildren
  elRef?: Ref<HTMLElement>
}

export default class Scroller extends BaseComponent<ScrollerProps> implements ScrollerLike {

  private el: HTMLElement // TODO: just use this.base?


  render(props: ScrollerProps) {
    let className = [ 'fc-scroller' ]

    if (props.className) {
      className = className.concat(props.className)
    }

    if (props.vGrow) {
      className.push('vgrow')
    }

    return (
      <div ref={this.handleEl} class={className.join(' ')} style={{
        ...props.style || {},
        maxHeight: props.maxHeight || '',
        overflowX: props.overflowX,
        overflowY: props.overflowY
      }}>{props.children}</div>
    )
  }


  handleEl = (el: HTMLElement) => {
    this.el = el
    setRef(this.props.elRef, el)
  }


  needsXScrolling() {
    return this.el.scrollWidth > this.el.clientWidth + 1 || // IE shittiness
      this.props.overflowX === 'auto' && Boolean(this.getXScrollbarWidth()) // hack safeguard
  }


  needsYScrolling() {
    return this.el.scrollHeight > this.el.clientHeight + 1 || // IE shittiness
      this.props.overflowY === 'auto' && Boolean(this.getYScrollbarWidth()) // hack safeguard
  }


  getXScrollbarWidth() {
    if (this.props.overflowX === 'hidden') {
      return 0
    } else {
      return this.el.offsetHeight - this.el.clientHeight // only works because we guarantee no borders
    }
  }


  getYScrollbarWidth() {
    if (this.props.overflowY === 'hidden') {
      return 0
    } else {
      return this.el.offsetWidth - this.el.clientWidth // only works because we guarantee no borders
    }
  }

}
