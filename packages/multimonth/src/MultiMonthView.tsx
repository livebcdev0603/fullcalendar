import {
  DateComponent,
  ViewProps,
  ViewContainer,
  DateProfile,
  intersectRanges,
  DateMarker,
  DateEnv,
  createDuration,
  memoize,
  DateFormatter,
  createFormatter,
  isPropsEqual,
  rangeContainsMarker,
} from '@fullcalendar/core/internal'
import { buildDayTableRenderRange } from '@fullcalendar/daygrid/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { SingleMonth } from './SingleMonth.js'

interface MultiMonthViewState {
  clientWidth?: number
  clientHeight?: number
  monthHPadding?: number
}

const DEFAULT_COL_MIN_WIDTH = 350
const DEFAULT_COL_MAX_COUNT = 3

export class MultiMonthView extends DateComponent<ViewProps, MultiMonthViewState> {
  private splitDateProfileByMonth = memoize(splitDateProfileByMonth)
  private buildMonthFormat = memoize(buildMonthFormat)
  private scrollElRef = createRef<HTMLDivElement>()
  private firstMonthElRef = createRef<HTMLDivElement>()
  private needsScrollReset = false
  private anyScrollReset = false // scroll-reset happened at least once?

  render() {
    const { context, props, state } = this
    const { options } = context
    const { clientWidth, clientHeight } = state
    const monthHPadding = state.monthHPadding || 0

    const monthTableMinWidth = options.multiMonthMinWidth || DEFAULT_COL_MIN_WIDTH
    const colMaxCnt = options.multiMonthMaxColumns || DEFAULT_COL_MAX_COUNT
    const colCount = Math.min(
      clientWidth != null ?
        Math.floor(clientWidth / (monthTableMinWidth + monthHPadding)) :
        1,
      colMaxCnt,
    ) || 1

    const monthWidthPct = (100 / colCount) + '%'
    const monthTableWidth = clientWidth == null ? null :
      (clientWidth / colCount) - monthHPadding

    const isLegitSingleCol = clientWidth != null && colCount === 1
    const monthDateProfiles = this.splitDateProfileByMonth(
      props.dateProfile,
      context.dateEnv,
      isLegitSingleCol ? false : options.fixedWeekCount,
      options.showNonCurrentDates,
    )

    const monthTitleFormat = this.buildMonthFormat(options.multiMonthTitleFormat, monthDateProfiles)
    const rootClassNames = [
      'fc-multimonth',
      isLegitSingleCol ?
        'fc-multimonth-singlecol' :
        'fc-multimonth-multicol',
      (monthTableWidth != null && monthTableWidth < 400) ?
        'fc-multimonth-condensed' :
        '',
    ]

    return (
      <ViewContainer
        elRef={this.scrollElRef}
        elClasses={rootClassNames}
        viewSpec={context.viewSpec}
      >
        {monthDateProfiles.map((monthDateProfile, i) => {
          const monthStr = formatIsoMonthStr(monthDateProfile.currentRange.start)

          return (
            <SingleMonth
              {...props}
              key={monthStr}
              isoDateStr={monthStr}
              elRef={i === 0 ? this.firstMonthElRef : undefined}
              titleFormat={monthTitleFormat}
              dateProfile={monthDateProfile}
              width={monthWidthPct}
              tableWidth={monthTableWidth}
              clientWidth={clientWidth}
              clientHeight={clientHeight}
            />
          )
        })}
      </ViewContainer>
    )
  }

  componentDidMount(): void {
    this.updateSize()
    this.context.addResizeHandler(this.handleSizing)
    this.requestScrollReset()
  }

  componentDidUpdate(prevProps: ViewProps) {
    if (!isPropsEqual(prevProps, this.props)) { // an external change?
      this.handleSizing(false)
    }

    if (prevProps.dateProfile !== this.props.dateProfile) {
      this.requestScrollReset()
    } else {
      this.flushScrollReset()
    }
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }

  handleSizing = (isForced: boolean) => {
    if (isForced) {
      this.updateSize()
    }
  }

  updateSize() {
    const scrollEl = this.scrollElRef.current
    const firstMonthEl = this.firstMonthElRef.current

    if (scrollEl) {
      this.setState({
        clientWidth: scrollEl.clientWidth,
        clientHeight: scrollEl.clientHeight,
      })
    }

    if (firstMonthEl && scrollEl) {
      if (this.state.monthHPadding == null) { // always remember initial non-zero value
        this.setState({
          monthHPadding:
            scrollEl.clientWidth - // go within padding
            (firstMonthEl.firstChild as HTMLElement).offsetWidth,
        })
      }
    }
  }

  requestScrollReset() {
    this.needsScrollReset = true
    this.flushScrollReset()
  }

  flushScrollReset() {
    if (
      this.needsScrollReset &&
      this.state.monthHPadding != null // indicates sizing already happened
    ) {
      if (
        this.context.options.multiMonthScrollReset !== false || // scroll-reset enabled?
        !this.anyScrollReset // OR first time rendering?
      ) {
        const { nowDate } = this.context.dateProfileGenerator // TODO: make dynamic
        const scrollEl = this.scrollElRef.current
        let scrollTop = 0

        if (rangeContainsMarker(this.props.dateProfile.currentRange, nowDate)) {
          const monthEl = scrollEl.querySelector(`[data-date="${formatIsoMonthStr(nowDate)}"]`)

          if (monthEl) {
            scrollTop = monthEl.getBoundingClientRect().top -
              scrollEl.getBoundingClientRect().top
          }
        }

        scrollEl.scrollTop = scrollTop
      }

      this.needsScrollReset = false
      this.anyScrollReset = true
    }
  }

  // workaround for when queued setState render (w/ clientWidth) gets cancelled because
  // subsequent update and shouldComponentUpdate says not to render :(
  shouldComponentUpdate() {
    return true
  }
}

const oneMonthDuration = createDuration(1, 'month')

function splitDateProfileByMonth(
  dateProfile: DateProfile,
  dateEnv: DateEnv,
  fixedWeekCount?: boolean,
  showNonCurrentDates?: boolean,
): DateProfile[] {
  const { start, end } = dateProfile.currentRange
  let monthStart: DateMarker = start
  const monthDateProfiles: DateProfile[] = []

  while (monthStart.valueOf() < end.valueOf()) {
    const monthEnd = dateEnv.add(monthStart, oneMonthDuration)
    const currentRange = { start: monthStart, end: monthEnd }
    const renderRange = buildDayTableRenderRange({
      currentRange,
      snapToWeek: true,
      fixedWeekCount,
      dateEnv,
    })
    const activeRange = dateProfile.activeRange ?
      intersectRanges(
        dateProfile.activeRange,
        showNonCurrentDates ? renderRange : currentRange,
      ) :
      null

    monthDateProfiles.push({
      isValid: dateProfile.isValid,
      validRange: dateProfile.validRange,
      renderRange,
      activeRange,
      currentRange,
      currentRangeUnit: 'month',
      isRangeAllDay: true,
      dateIncrement: dateProfile.dateIncrement,
      slotMinTime: dateProfile.slotMaxTime,
      slotMaxTime: dateProfile.slotMinTime,
    })

    monthStart = monthEnd
  }

  return monthDateProfiles
}

const YEAR_MONTH_FORMATTER = createFormatter({ year: 'numeric', month: 'long' })
const YEAR_FORMATTER = createFormatter({ month: 'long' })

function buildMonthFormat(
  formatOverride: DateFormatter | undefined,
  monthDateProfiles: DateProfile[],
): DateFormatter {
  return formatOverride ||
    ((monthDateProfiles[0].currentRange.start.getUTCFullYear() !==
      monthDateProfiles[monthDateProfiles.length - 1].currentRange.start.getUTCFullYear())
      ? YEAR_MONTH_FORMATTER
      : YEAR_FORMATTER)
}

// TODO: move to general utils
function formatIsoMonthStr(marker: DateMarker) {
  return marker.toISOString().match(/^\d{4}-\d{2}/)[0]
}
