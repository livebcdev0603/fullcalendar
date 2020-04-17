import {
  Seg, Hit,
  EventMutation, applyMutationToEventStore,
  elementClosest,
  PointerDragEvent,
  EventStore, getRelevantEvents, createEmptyEventStore,
  diffDates, enableCursor, disableCursor,
  DateRange,
  EventApi,
  EventRenderRange, getElSeg,
  createDuration,
  EventInteractionState,
  EventResizeJoinTransforms,
  Interaction, InteractionSettings, interactionSettingsToStore
} from '@fullcalendar/core'
import { HitDragging, isHitsEqual } from './HitDragging'
import { FeaturefulElementDragging } from '../dnd/FeaturefulElementDragging'
import { __assign } from 'tslib'


export class EventResizing extends Interaction {

  dragging: FeaturefulElementDragging
  hitDragging: HitDragging

  // internal state
  draggingSegEl: HTMLElement | null = null
  draggingSeg: Seg | null = null // TODO: rename to resizingSeg? subjectSeg?
  eventRange: EventRenderRange | null = null
  relevantEvents: EventStore | null = null
  validMutation: EventMutation | null = null
  mutatedRelevantEvents: EventStore | null = null

  constructor(settings: InteractionSettings) {
    super(settings)
    let { component } = settings

    let dragging = this.dragging = new FeaturefulElementDragging(settings.el)
    dragging.pointer.selector = '.fc-event-resizer'
    dragging.touchScrollAllowed = false
    dragging.autoScroller.isEnabled = component.context.options.dragScroll

    let hitDragging = this.hitDragging = new HitDragging(this.dragging, interactionSettingsToStore(settings))
    hitDragging.emitter.on('pointerdown', this.handlePointerDown)
    hitDragging.emitter.on('dragstart', this.handleDragStart)
    hitDragging.emitter.on('hitupdate', this.handleHitUpdate)
    hitDragging.emitter.on('dragend', this.handleDragEnd)
  }

  destroy() {
    this.dragging.destroy()
  }

  handlePointerDown = (ev: PointerDragEvent) => {
    let { component } = this
    let segEl = this.querySegEl(ev)
    let seg = getElSeg(segEl)
    let eventRange = this.eventRange = seg.eventRange!

    this.dragging.minDistance = component.context.options.eventDragMinDistance

    // if touch, need to be working with a selected event
    this.dragging.setIgnoreMove(
      !this.component.isValidSegDownEl(ev.origEvent.target as HTMLElement) ||
      (ev.isTouch && this.component.props.eventSelection !== eventRange.instance!.instanceId)
    )
  }

  handleDragStart = (ev: PointerDragEvent) => {
    let { calendar, viewApi } = this.component.context
    let eventRange = this.eventRange!

    this.relevantEvents = getRelevantEvents(
      calendar.state.eventStore,
      this.eventRange.instance!.instanceId
    )

    let segEl = this.querySegEl(ev)
    this.draggingSegEl = segEl
    this.draggingSeg = getElSeg(segEl)

    calendar.unselect()
    calendar.emitter.trigger('eventResizeStart', {
      el: segEl,
      event: new EventApi(calendar, eventRange.def, eventRange.instance),
      jsEvent: ev.origEvent as MouseEvent, // Is this always a mouse event? See #4655
      view: viewApi
    })
  }

  handleHitUpdate = (hit: Hit | null, isFinal: boolean, ev: PointerDragEvent) => {
    let { context } = this.component
    let relevantEvents = this.relevantEvents!
    let initialHit = this.hitDragging.initialHit!
    let eventInstance = this.eventRange.instance!
    let mutation: EventMutation | null = null
    let mutatedRelevantEvents: EventStore | null = null
    let isInvalid = false
    let interaction: EventInteractionState = {
      affectedEvents: relevantEvents,
      mutatedEvents: createEmptyEventStore(),
      isEvent: true
    }

    if (hit) {
      mutation = computeMutation(
        initialHit,
        hit,
        (ev.subjectEl as HTMLElement).classList.contains('fc-event-resizer-start'),
        eventInstance.range,
        context.pluginHooks.eventResizeJoinTransforms
      )
    }

    if (mutation) {
      mutatedRelevantEvents = applyMutationToEventStore(relevantEvents, context.calendar.state.eventUiBases, mutation, context)
      interaction.mutatedEvents = mutatedRelevantEvents

      if (!this.component.isInteractionValid(interaction)) {
        isInvalid = true
        mutation = null

        mutatedRelevantEvents = null
        interaction.mutatedEvents = null
      }
    }

    if (mutatedRelevantEvents) {
      context.dispatch({
        type: 'SET_EVENT_RESIZE',
        state: interaction
      })
    } else {
      context.dispatch({ type: 'UNSET_EVENT_RESIZE' })
    }

    if (!isInvalid) {
      enableCursor()
    } else {
      disableCursor()
    }

    if (!isFinal) {

      if (mutation && isHitsEqual(initialHit, hit)) {
        mutation = null
      }

      this.validMutation = mutation
      this.mutatedRelevantEvents = mutatedRelevantEvents
    }
  }

  handleDragEnd = (ev: PointerDragEvent) => {
    let { calendar, viewApi } = this.component.context
    let eventDef = this.eventRange!.def
    let eventInstance = this.eventRange!.instance
    let eventApi = new EventApi(calendar, eventDef, eventInstance)
    let relevantEvents = this.relevantEvents!
    let mutatedRelevantEvents = this.mutatedRelevantEvents!

    calendar.emitter.trigger('eventResizeStop', {
      el: this.draggingSegEl,
      event: eventApi,
      jsEvent: ev.origEvent as MouseEvent, // Is this always a mouse event? See #4655
      view: viewApi
    })

    if (this.validMutation) {
      calendar.dispatch({
        type: 'MERGE_EVENTS',
        eventStore: mutatedRelevantEvents
      })

      calendar.emitter.trigger('eventResize', {
        el: this.draggingSegEl,
        startDelta: this.validMutation.startDelta || createDuration(0),
        endDelta: this.validMutation.endDelta || createDuration(0),
        prevEvent: eventApi,
        event: new EventApi( // the data AFTER the mutation
          calendar,
          mutatedRelevantEvents.defs[eventDef.defId],
          eventInstance ? mutatedRelevantEvents.instances[eventInstance.instanceId] : null
        ),
        revert: function() {
          calendar.dispatch({
            type: 'MERGE_EVENTS',
            eventStore: relevantEvents
          })
        },
        jsEvent: ev.origEvent,
        view: viewApi
      })

    } else {
      calendar.emitter.trigger('_noEventResize')
    }

    // reset all internal state
    this.draggingSeg = null
    this.relevantEvents = null
    this.validMutation = null

    // okay to keep eventInstance around. useful to set it in handlePointerDown
  }

  querySegEl(ev: PointerDragEvent) {
    return elementClosest(ev.subjectEl as HTMLElement, '.fc-event')
  }

}

function computeMutation(hit0: Hit, hit1: Hit, isFromStart: boolean, instanceRange: DateRange, transforms: EventResizeJoinTransforms[]): EventMutation | null {
  let dateEnv = hit0.component.context.dateEnv
  let date0 = hit0.dateSpan.range.start
  let date1 = hit1.dateSpan.range.start

  let delta = diffDates(
    date0, date1,
    dateEnv,
    hit0.component.largeUnit
  )

  let props = {} as EventMutation

  for (let transform of transforms) {
    let res = transform(hit0, hit1)

    if (res === false) {
      return null
    } else if (res) {
      __assign(props, res)
    }
  }

  if (isFromStart) {
    if (dateEnv.add(instanceRange.start, delta) < instanceRange.end) {
      props.startDelta = delta
      return props
    }
  } else {
    if (dateEnv.add(instanceRange.end, delta) > instanceRange.start) {
      props.endDelta = delta
      return props
    }
  }

  return null
}
