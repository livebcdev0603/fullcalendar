import {
  createElement, createRef,
  diffDays,
  SimpleScrollGridSection,
  VNode,
  SimpleScrollGrid,
  ChunkContentCallbackArgs,
  ScrollGridSectionConfig,
  BaseComponent,
  buildNavLinkData,
  ViewRoot,
  WeekNumberRoot,
  RenderHook,
  DateComponent,
  ViewProps,
  RefObject,
  renderScrollShim,
  getStickyHeaderDates,
  getStickyFooterScrollbar,
  createFormatter,
  AllDayHookProps
} from '@fullcalendar/common'
import { AllDaySplitter } from './AllDaySplitter'
import { TimeSlatMeta, TimeColsAxisCell } from './TimeColsSlats'


const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'short' })
const AUTO_ALL_DAY_MAX_EVENT_ROWS = 5


/* An abstract class for all timegrid-related views. Displays one more columns with time slots running vertically.
----------------------------------------------------------------------------------------------------------------------*/
// Is a manager for the TimeCols subcomponent and possibly the DayGrid subcomponent (if allDaySlot is on).
// Responsible for managing width/height.

export abstract class TimeColsView extends DateComponent<ViewProps> {

  protected allDaySplitter = new AllDaySplitter() // for use by subclasses

  protected headerElRef: RefObject<HTMLTableCellElement> = createRef<HTMLTableCellElement>()
  private rootElRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()
  private scrollerElRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()


  // rendering
  // ----------------------------------------------------------------------------------------------------


  renderSimpleLayout(
    headerRowContent: VNode | null,
    allDayContent: ((contentArg: ChunkContentCallbackArgs) => VNode) | null,
    timeContent: ((contentArg: ChunkContentCallbackArgs) => VNode) | null
  ) {
    let { context, props } = this
    let sections: SimpleScrollGridSection[] = []
    let stickyHeaderDates = getStickyHeaderDates(context.options)

    if (headerRowContent) {
      sections.push({
        type: 'header',
        key: 'header',
        isSticky: stickyHeaderDates,
        chunk: {
          elRef: this.headerElRef,
          tableClassName: 'fc-col-header',
          rowContent: headerRowContent
        }
      })
    }

    if (allDayContent) {
      sections.push({
        type: 'body',
        key: 'all-day',
        chunk: { content: allDayContent }
      })
      sections.push({
        key: 'all-day-divider',
        outerContent: (
          <tr className='fc-scrollgrid-section fc-scrollgrid-section-body'>
            <td
              className={'fc-timegrid-divider fc-divider ' + context.theme.getClass('tableCellShaded')}
            />
          </tr>
        )
      })
    }

    sections.push({
      type: 'body',
      key: 'body',
      liquid: true,
      expandRows: Boolean(context.options.expandRows),
      chunk: {
        scrollerElRef: this.scrollerElRef,
        content: timeContent
      }
    })

    return (
      <ViewRoot viewSpec={context.viewSpec} elRef={this.rootElRef}>
        {(rootElRef, classNames) => (
          <div className={[ 'fc-timegrid' ].concat(classNames).join(' ')} ref={rootElRef}>
            <SimpleScrollGrid
              liquid={!props.isHeightAuto && !props.forPrint}
              cols={[ { width: 'shrink' } ]}
              sections={sections}
            />
          </div>
        )}
      </ViewRoot>
    )
  }


  renderHScrollLayout(
    headerRowContent: VNode | null,
    allDayContent: ((contentArg: ChunkContentCallbackArgs) => VNode) | null,
    timeContent: ((contentArg: ChunkContentCallbackArgs) => VNode) | null,
    colCnt: number,
    dayMinWidth: number,
    slatMetas: TimeSlatMeta[]
  ) {
    let ScrollGrid = this.context.pluginHooks.scrollGridImpl

    if (!ScrollGrid) {
      throw new Error('No ScrollGrid implementation')
    }

    let { context, props } = this
    let stickyHeaderDates = getStickyHeaderDates(context.options)
    let stickyFooterScrollbar = getStickyFooterScrollbar(context.options)
    let sections: ScrollGridSectionConfig[] = []

    if (headerRowContent) {
      sections.push({
        type: 'header',
        key: 'header',
        isSticky: stickyHeaderDates,
        chunks: [
          {
            key: 'axis',
            rowContent: <tr>{this.renderHeadAxis()}</tr>
          },
          {
            key: 'cols',
            elRef: this.headerElRef,
            tableClassName: 'fc-col-header',
            rowContent: headerRowContent
          }
        ]
      })
    }

    if (allDayContent) {
      sections.push({
        type: 'body',
        key: 'all-day',
        syncRowHeights: true,
        chunks: [
          {
            key: 'axis',
            rowContent: (contentArg: ChunkContentCallbackArgs) => (
              <tr>{this.renderTableRowAxis(contentArg.rowSyncHeights[0])}</tr>
            ),
          },
          {
            key: 'cols',
            content: allDayContent
          }
        ]
      })
      sections.push({
        key: 'all-day-divider',
        outerContent: (
          <tr className='fc-scrollgrid-section fc-scrollgrid-section-body'>
            <td
              colSpan={2}
              className={'fc-timegrid-divider fc-divider ' + context.theme.getClass('tableCellShaded')}
            />
          </tr>
        )
      })
    }

    sections.push({
      type: 'body',
      key: 'body',
      liquid: true,
      expandRows: Boolean(context.options.expandRows),
      chunks: [
        {
          key: 'axis',
          rowContent: <TimeBodyAxis slatMetas={slatMetas} />
        },
        {
          key: 'cols',
          scrollerElRef: this.scrollerElRef,
          content: timeContent
        }
      ]
    })

    if (stickyFooterScrollbar) {
      sections.push({
        key: 'footer',
        type: 'footer',
        isSticky: true,
        chunks: [
          {
            key: 'axis',
            content: renderScrollShim
          },
          {
            key: 'cols',
            content: renderScrollShim
          }
        ]
      })
    }

    return (
      <ViewRoot viewSpec={context.viewSpec} elRef={this.rootElRef}>
        {(rootElRef, classNames) => (
          <div className={[ 'fc-timegrid' ].concat(classNames).join(' ')} ref={rootElRef}>
            <ScrollGrid
              liquid={!props.isHeightAuto && !props.forPrint}
              colGroups={[
                { width: 'shrink', cols: [ { width: 'shrink' } ] }, // TODO: allow no specify cols
                { cols: [ { span: colCnt, minWidth: dayMinWidth } ] }
              ]}
              sections={sections}
            />
          </div>
        )}
      </ViewRoot>
    )
  }


  handleScrollTopRequest = (scrollTop: number) => {
    this.scrollerElRef.current.scrollTop = scrollTop
  }


  /* Dimensions
  ------------------------------------------------------------------------------------------------------------------*/


  getAllDayMaxEventProps() {
    let { dayMaxEvents, dayMaxEventRows } = this.context.options

    if (dayMaxEvents === true || dayMaxEventRows === true) { // is auto?
      dayMaxEvents = undefined
      dayMaxEventRows = AUTO_ALL_DAY_MAX_EVENT_ROWS // make sure "auto" goes to a real number
    }

    return { dayMaxEvents, dayMaxEventRows }
  }



  /* Header Render Methods
  ------------------------------------------------------------------------------------------------------------------*/


  renderHeadAxis = () => {
    let { options } = this.context
    let { dateProfile } = this.props
    let range = dateProfile.renderRange
    let dayCnt = diffDays(range.start, range.end)
    let navLinkData = (options.navLinks && dayCnt === 1) // only do in day views (to avoid doing in week views that dont need it)
      ? buildNavLinkData(range.start, 'week')
      : null

    if (options.weekNumbers) {
      return (
        <WeekNumberRoot date={range.start} defaultFormat={DEFAULT_WEEK_NUM_FORMAT}>
          {(rootElRef, classNames, innerElRef, innerContent) => (
            <th ref={rootElRef} className={[
              'fc-timegrid-axis',
              'fc-scrollgrid-shrink'
            ].concat(classNames).join(' ')}>
              <div className='fc-timegrid-axis-frame fc-scrollgrid-shrink-frame fc-timegrid-axis-frame-liquid'>
                <a className='fc-timegrid-axis-cushion fc-scrollgrid-shrink-cushion' data-navlink={navLinkData} ref={innerElRef}>
                  {innerContent}
                </a>
              </div>
            </th>
          )}
        </WeekNumberRoot>
      )
    }

    return (
      <th className='fc-timegrid-axis'></th>
    )
  }


  /* Table Component Render Methods
  ------------------------------------------------------------------------------------------------------------------*/


  // only a one-way height sync. we don't send the axis inner-content height to the DayGrid,
  // but DayGrid still needs to have classNames on inner elements in order to measure.
  renderTableRowAxis = (rowHeight?: number) => {
    let { options, viewApi } = this.context
    let hookProps: AllDayHookProps = {
      text: options.allDayText,
      view: viewApi
    }

    return (
      // TODO: make reusable hook. used in list view too
      <RenderHook<AllDayHookProps>
        hookProps={hookProps}
        classNames={options.allDayClassNames}
        content={options.allDayContent}
        defaultContent={renderAllDayInner}
        didMount={options.allDayDidMount}
        willUnmount={options.allDayWillUnmount}
      >
        {(rootElRef, classNames, innerElRef, innerContent) => (
          <td ref={rootElRef} className={[
            'fc-timegrid-axis',
            'fc-scrollgrid-shrink'
          ].concat(classNames).join(' ')}>
            <div className={'fc-timegrid-axis-frame fc-scrollgrid-shrink-frame' + (rowHeight == null ? ' fc-timegrid-axis-frame-liquid' : '')} style={{ height: rowHeight }}>
              <span className='fc-timegrid-axis-cushion fc-scrollgrid-shrink-cushion' ref={innerElRef}>
                {innerContent}
              </span>
            </div>
          </td>
        )}
      </RenderHook>
    )
  }

}

function renderAllDayInner(hookProps) {
  return hookProps.text
}


/* Thin Axis
------------------------------------------------------------------------------------------------------------------*/

interface TimeBodyAxisProps {
  slatMetas: TimeSlatMeta[]
}

class TimeBodyAxis extends BaseComponent<TimeBodyAxisProps> {

  render() {
    return this.props.slatMetas.map((slatMeta: TimeSlatMeta) => (
      <tr key={slatMeta.key}>
        <TimeColsAxisCell {...slatMeta} />
      </tr>
    ))
  }

}
