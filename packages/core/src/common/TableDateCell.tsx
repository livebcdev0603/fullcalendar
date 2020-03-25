import { DateRange } from '../datelib/date-range'
import { getDayClassNames, getDateMeta, DateMeta } from '../component/date-rendering'
import { DateMarker, addDays } from '../datelib/marker'
import { DateProfile } from '../DateProfileGenerator'
import ComponentContext from '../component/ComponentContext'
import { h } from '../vdom'
import { __assign } from 'tslib'
import { DateFormatter, formatDayString } from '../datelib/formatting'
import { BaseComponent } from '../vdom-util'
import { RenderHook } from './render-hook'
import { buildNavLinkData } from './nav-link'
import ViewApi from '../ViewApi'


export interface TableDateCellProps {
  date: DateMarker
  dateProfile: DateProfile
  todayRange: DateRange
  colCnt: number
  dayLabelFormat: DateFormatter
  colSpan?: number
  extraHookProps?: object
  extraDataAttrs?: object
  extraClassNames?: string[]
}

interface HookProps extends DateMeta {
  date: Date
  view: ViewApi
  text: string
  navLinkData: string
  [otherProp: string]: any
}

const CLASS_NAME = 'fc-col-header-cell'


export default class TableDateCell extends BaseComponent<TableDateCellProps> { // BAD name for this class now. used in the Header

  render(props: TableDateCellProps, state: {}, context: ComponentContext) {
    let { dateEnv, options } = context
    let { date } = props
    let dayMeta = getDateMeta(date, props.todayRange, null, props.dateProfile)

    let classNames = [ CLASS_NAME ].concat(
      getDayClassNames(dayMeta, context.theme),
      props.extraClassNames || []
    )
    let text = dateEnv.format(date, props.dayLabelFormat)

    // if colCnt is 1, we are already in a day-view and don't need a navlink
    let navLinkData = (options.navLinks && !dayMeta.isDisabled && props.colCnt > 1)
      ? buildNavLinkData(date)
      : null

    let hookProps: HookProps = {
      date: dateEnv.toDate(date),
      view: context.view,
      ...props.extraHookProps,
      text,
      navLinkData,
      ...dayMeta
    }

    return (
      <RenderHook name='dayLabel' hookProps={hookProps} defaultContent={renderInner}>
        {(rootElRef, customClassNames, innerElRef, innerContent) => (
          <th
            ref={rootElRef}
            className={classNames.concat(customClassNames).join(' ')}
            data-date={!dayMeta.isDisabled ? formatDayString(date) : undefined}
            colSpan={props.colSpan > 1 ? props.colSpan : undefined}
            {...props.extraDataAttrs}
          >{innerContent}</th>
        )}
      </RenderHook>
    )
  }

}


export interface TableDowCellProps {
  dow: number
  dayLabelFormat: DateFormatter
  colSpan?: number
  extraHookProps?: object
  extraDataAttrs?: object
  extraClassNames?: string[]
}

export class TableDowCell extends BaseComponent<TableDowCellProps> {

  render(props: TableDowCellProps, state: {}, context: ComponentContext) {
    let { dow } = props
    let { dateEnv } = context

    let date = addDays(new Date(259200000), dow) // start with Sun, 04 Jan 1970 00:00:00 GMT

    let dateMeta: DateMeta = {
      dow,
      isDisabled: false,
      isFuture: false,
      isPast: false,
      isToday: false,
      isOther: false
    }

    let classNames = [ CLASS_NAME ].concat(
      getDayClassNames(dateMeta, context.theme),
      props.extraClassNames || []
    )

    let text = dateEnv.format(date, props.dayLabelFormat)

    let hookProps: HookProps = {
      date,
      ...dateMeta,
      view: context.view,
      ...props.extraHookProps,
      text,
      navLinkData: null,
    }

    return (
      <RenderHook name='dayLabel' hookProps={hookProps} defaultContent={renderInner}>
        {(rootElRef, customClassNames, innerElRef, innerContent) => (
          <th
            ref={rootElRef}
            className={classNames.concat(customClassNames).join(' ')}
            colSpan={props.colSpan > 1 ? props.colSpan : undefined}
            {...props.extraDataAttrs}
          >{innerContent}</th>
        )}
      </RenderHook>
    )
  }

}


function renderInner(hookProps: HookProps) {
  if (!hookProps.isDisabled) {
    return (
      <a data-navlink={hookProps.navLinkData}>
        {hookProps.text}
      </a>
    )
  }
}
