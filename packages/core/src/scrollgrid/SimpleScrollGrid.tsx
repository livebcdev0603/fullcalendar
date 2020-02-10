import { VNode, h } from '../vdom'
import ComponentContext from '../component/ComponentContext'
import { BaseComponent, setRef } from '../vdom-util'
import Scroller, { OverflowValue } from './Scroller'
import RefMap from '../util/RefMap'
import { ColProps, SectionConfig, renderMicroColGroup, computeShrinkWidth, getScrollGridClassNames, getSectionClassNames, getAllowYScrolling,
  renderChunkContent, getChunkVGrow, computeForceScrollbars, ChunkConfig, hasShrinkWidth, CssDimValue, getChunkClassNames, computeScrollerClientWidths, computeScrollerClientHeights,
  isColPropsEqual
  } from './util'
import { memoize } from '../util/memoize'
import { isPropsEqual } from '../util/object'
import { guid } from '../util/misc'


export interface SimpleScrollGridProps {
  cols: ColProps[]
  sections: SimpleScrollGridSection[]
  vGrow?: boolean
  forPrint?: boolean
  height?: CssDimValue // TODO: give to real ScrollGrid
}

export interface SimpleScrollGridSection extends SectionConfig {
  key?: string
  chunk?: ChunkConfig
}

interface SimpleScrollGridState {
  shrinkWidth: number | null
  forceYScrollbars: boolean | null
  scrollerClientWidths: { [index: string]: number }
  scrollerClientHeights: { [index: string]: number }
  sizingId: string
}


export default class SimpleScrollGrid extends BaseComponent<SimpleScrollGridProps, SimpleScrollGridState> {

  processCols = memoize((a) => a, isColPropsEqual) // so we get same `cols` props every time
  renderMicroColGroup = memoize(renderMicroColGroup) // yucky to memoize VNodes, but much more efficient for consumers
  scrollerRefs = new RefMap<Scroller>()
  scrollerElRefs = new RefMap<HTMLElement, [ChunkConfig]>(this._handleScrollerEl.bind(this))

  state: SimpleScrollGridState = {
    shrinkWidth: null,
    forceYScrollbars: null,
    scrollerClientWidths: {},
    scrollerClientHeights: {},
    sizingId: ''
  }


  render(props: SimpleScrollGridProps, state: SimpleScrollGridState, context: ComponentContext) {
    let sectionConfigs = props.sections || []
    let cols = this.processCols(props.cols)

    let microColGroupNode = props.forPrint ?
        <colgroup></colgroup> : // temporary
        this.renderMicroColGroup(cols, state.shrinkWidth)

    let classNames = getScrollGridClassNames(props.vGrow, context)
    if (props.forPrint) { // temporary
      classNames.push('scrollgrid--forprint')
    }

    return (
      <table class={classNames.join(' ')} style={{ height: props.height }}>
        {sectionConfigs.map((sectionConfig, sectionI) => this.renderSection(sectionConfig, sectionI, microColGroupNode))}
      </table>
    )
  }


  renderSection(sectionConfig: SimpleScrollGridSection, sectionI: number, microColGroupNode: VNode) {

    if ('outerContent' in sectionConfig) {
      return sectionConfig.outerContent
    }

    return (
      <tr key={sectionConfig.key} class={getSectionClassNames(sectionConfig, this.props.vGrow).join(' ')}>
        {this.renderChunkTd(sectionConfig, sectionI, microColGroupNode, sectionConfig.chunk)}
      </tr>
    )
  }


  renderChunkTd(sectionConfig: SimpleScrollGridSection, sectionI: number, microColGroupNode: VNode, chunkConfig: ChunkConfig) {

    if ('outerContent' in chunkConfig) {
      return chunkConfig.outerContent
    }

    let { state } = this

    let needsYScrolling = getAllowYScrolling(this.props, sectionConfig, chunkConfig) // TODO: do lazily
    let vGrow = getChunkVGrow(this.props, sectionConfig, chunkConfig)

    let overflowY: OverflowValue =
      state.forceYScrollbars === true ? 'scroll' :
      (state.forceYScrollbars === false || !needsYScrolling) ? 'hidden' :
      'auto'

    let content = renderChunkContent(sectionConfig, chunkConfig, {
      tableColGroupNode: microColGroupNode,
      tableMinWidth: '',
      clientWidth: state.scrollerClientWidths[sectionI] || '',
      clientHeight: state.scrollerClientHeights[sectionI] || '',
      vGrowRows: sectionConfig.vGrowRows || chunkConfig.vGrowRows,
      rowSyncHeights: []
    })

    return (
      <td class={getChunkClassNames(sectionConfig, chunkConfig, this.context)} ref={chunkConfig.elRef}>
        <div class={'scrollerharness' + (vGrow ? ' vgrow' : '')}>
          <Scroller
            ref={this.scrollerRefs.createRef(sectionI)}
            elRef={this.scrollerElRefs.createRef(sectionI, chunkConfig)}
            overflowY={overflowY}
            overflowX='hidden'
            maxHeight={sectionConfig.maxHeight}
            vGrow={vGrow}
          >{content}</Scroller>
        </div>
      </td>
    )
  }


  _handleScrollerEl(scrollerEl: HTMLElement | null, key: string, chunkConfig: ChunkConfig) {
    setRef(chunkConfig.scrollerElRef, scrollerEl)
  }


  componentDidMount() {
    this.handleSizing(true)
    this.context.addResizeHandler(this.handleSizing)
  }


  componentDidUpdate(prevProps: SimpleScrollGridProps) {
    // TODO: need better solution when state contains non-sizing things
    this.handleSizing(!isPropsEqual(this.props, prevProps))
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }


  handleSizing = (isExternalChange: boolean) => {
    if (isExternalChange && !this.props.forPrint) {
      let sizingId = guid()
      this.setState({
        sizingId,
        shrinkWidth: // will create each chunk's <colgroup>. TODO: precompute hasShrinkWidth
          hasShrinkWidth(this.props.cols)
            ? computeShrinkWidth(this.scrollerElRefs.getAll())
            : 0
      }, () => {
        if (sizingId === this.state.sizingId) {
          this.setState({
            forceYScrollbars: computeForceScrollbars(this.scrollerRefs.getAll(), 'Y')
          }, () => {
            if (sizingId === this.state.sizingId) {
              this.setState({ // will set each chunk's clientWidth
                scrollerClientWidths: computeScrollerClientWidths(this.scrollerElRefs),
                scrollerClientHeights: computeScrollerClientHeights(this.scrollerElRefs)
              })
            }
          })
        }
      })
    }
  }


  // TODO: can do a really simple print-view. dont need to join rows

}

SimpleScrollGrid.addStateEquality({
  scrollerClientWidths: isPropsEqual,
  scrollerClientHeights: isPropsEqual,
  sizingId: true // never update base on this
})
