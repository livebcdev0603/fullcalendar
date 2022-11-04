import { createElement } from '../preact.js'
import { BaseComponent } from '../vdom-util.js'
import { Seg } from '../component/DateComponent.js'
import { EventApi } from '../api/EventApi.js'
import {
  computeSegDraggable,
  computeSegStartResizable,
  computeSegEndResizable,
  EventContentArg,
  getEventClassNames,
} from '../component/event-rendering.js'
import { ContentContainer, InnerContainerFunc } from '../content-inject/ContentContainer.js'
import { ElProps } from '../content-inject/ContentInjector.js'
import { CustomContentGenerator } from './render-hook.js'

export interface MinimalEventProps {
  seg: Seg
  isDragging: boolean // rename to isMirrorDragging? make optional?
  isResizing: boolean // rename to isMirrorResizing? make optional?
  isDateSelecting: boolean // rename to isMirrorDateSelecting? make optional?
  isSelected: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
}

export type EventContainerProps = ElProps & MinimalEventProps & {
  defaultGenerator: CustomContentGenerator<EventContentArg>
  disableDragging?: boolean
  disableResizing?: boolean
  timeText: string
  children?: InnerContainerFunc<EventContentArg>
}

export class EventContainer extends BaseComponent<EventContainerProps> {
  render() {
    const { props, context } = this
    const { options } = context
    const { seg } = props
    const { eventRange } = seg
    const { ui } = eventRange

    const renderProps: EventContentArg = {
      event: new EventApi(context, eventRange.def, eventRange.instance),
      view: context.viewApi,
      timeText: props.timeText,
      textColor: ui.textColor,
      backgroundColor: ui.backgroundColor,
      borderColor: ui.borderColor,
      isDraggable: !props.disableDragging && computeSegDraggable(seg, context),
      isStartResizable: !props.disableResizing && computeSegStartResizable(seg, context),
      isEndResizable: !props.disableResizing && computeSegEndResizable(seg, context),
      isMirror: Boolean(props.isDragging || props.isResizing || props.isDateSelecting),
      isStart: Boolean(seg.isStart),
      isEnd: Boolean(seg.isEnd),
      isPast: Boolean(props.isPast), // TODO: don't cast. getDateMeta does it
      isFuture: Boolean(props.isFuture), // TODO: don't cast. getDateMeta does it
      isToday: Boolean(props.isToday), // TODO: don't cast. getDateMeta does it
      isSelected: Boolean(props.isSelected),
      isDragging: Boolean(props.isDragging),
      isResizing: Boolean(props.isResizing),
    }

    const elClasses = getEventClassNames(renderProps)
      .concat(seg.eventRange.ui.classNames)
      .concat(props.elClasses || [])

    return (
      <ContentContainer
        {...props}
        elClasses={elClasses}
        renderProps={renderProps}
        generatorName="eventContent"
        generator={options.eventContent || props.defaultGenerator}
        classNameGenerator={options.eventClassNames}
        didMount={options.eventDidMount}
        willUnmount={options.eventWillUnmount}
      />
    )
  }
}
