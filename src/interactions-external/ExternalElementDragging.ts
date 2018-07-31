import ElementDragging from '../dnd/ElementDragging'
import HitDragging, { Hit } from '../interactions/HitDragging'
import globalContext from '../common/GlobalContext'
import { PointerDragEvent } from '../dnd/PointerDragging'
import { EventStore, parseDef, createInstance } from '../reducers/event-store'
import UnzonedRange from '../models/UnzonedRange'
import * as externalHooks from '../exports'
import { createDuration } from '../datelib/duration'
import { assignTo } from '../util/object'
import { DateSpan } from '../reducers/date-span'
import Calendar from '../Calendar'

export default class ExternalElementDragging {

  hitDragging: HitDragging
  addableEventStore: EventStore
  explicitEventCreationData: any
  eventCreationData: any

  constructor(dragging: ElementDragging, rawEventCreationData?) {
    let hitDragging = this.hitDragging = new HitDragging(dragging, globalContext.componentHash)
    hitDragging.dieIfNoInitial = false
    hitDragging.emitter.on('dragstart', this.onDragStart)
    hitDragging.emitter.on('hitover', this.onHitOver)
    hitDragging.emitter.on('hitout', this.onHitOut)
    hitDragging.emitter.on('dragend', this.onDragEnd)

    dragging.setMirrorIsVisible(true)

    this.explicitEventCreationData = rawEventCreationData ? processExplicitData(rawEventCreationData) : null
  }

  onDragStart = (ev: PointerDragEvent) => {

    // TODO: nicer accessors in GlobalContext for this?
    if (globalContext.eventSelectedComponent) {
      let selectedCalendar = globalContext.eventSelectedComponent.getCalendar()

      if (selectedCalendar) {
        selectedCalendar.dispatch({
          type: 'CLEAR_SELECTED_EVENT'
        })
        globalContext.eventSelectedComponent = null
      }
    }

    this.eventCreationData = this.explicitEventCreationData || getDraggedElMeta(ev.subjectEl)
  }

  onHitOver = (hit: Hit) => {
    let calendar = hit.component.getCalendar()

    this.addableEventStore = computeEventStoreForDateSpan(
      hit.dateSpan,
      hit.component.getCalendar(),
      this.eventCreationData
    )

    calendar.dispatch({
      type: 'SET_DRAG',
      dragState: {
        eventStore: this.addableEventStore,
        willCreateEvent: Boolean(this.eventCreationData.standardProps)
      }
    })

    let { dragging } = this.hitDragging

    dragging.setMirrorNeedsRevert(false)

    // show mirror if no already-rendered helper element
    // TODO: wish we could somehow wait for dispatch to guarantee render
    dragging.setMirrorIsVisible(
      !document.querySelector('.fc-helper')
    )
  }

  onHitOut = (hit) => { // TODO: onHitChange?

    // we still want to notify calendar about invalid drag
    // because we want related events to stay hidden
    hit.component.getCalendar().dispatch({
      type: 'SET_DRAG',
      dragState: {
        eventStore: { defs: {}, instances: {} } // TODO: better way to make empty event-store
      }
    })

    this.addableEventStore = null

    let { dragging } = this.hitDragging

    dragging.setMirrorIsVisible(true)
    dragging.setMirrorNeedsRevert(true)
  }

  onDragEnd = (pev: PointerDragEvent) => {
    this.hitDragging.dragging.setMirrorIsVisible(true) // always restore!

    if (this.addableEventStore) {
      let finalHit = this.hitDragging.finalHit
      let finalView = finalHit.component.view
      let finalCalendar = finalView.calendar

      finalCalendar.dispatch({
        type: 'CLEAR_DRAG'
      })

      // TODO: how to let Scheduler extend this?
      finalCalendar.publiclyTrigger('drop', [
        {
          draggedEl: pev.subjectEl,
          date: finalCalendar.dateEnv.toDate(finalHit.dateSpan.range.start),
          isAllDay: finalHit.dateSpan.isAllDay,
          jsEvent: pev.origEvent,
          view: finalView
        }
      ])

      if (this.eventCreationData.standardProps) { // TODO: bad way to test if event creation is good
        finalCalendar.dispatch({
          type: 'ADD_EVENTS',
          eventStore: this.addableEventStore,
          stick: this.eventCreationData.stick // TODO: use this param
        })

        // signal an external event landed
        finalCalendar.publiclyTrigger('eventReceive', [
          {
            draggedEl: pev.subjectEl,
            event: this.addableEventStore, // TODO: what to put here!?
            view: finalView
          }
        ])
      }

      this.addableEventStore = null
    }
  }

}


function computeEventStoreForDateSpan(dateSpan: DateSpan, calendar: Calendar, eventCreationData): EventStore {

  let def = parseDef(
    eventCreationData.standardProps || {},
    null,
    dateSpan.isAllDay,
    Boolean(eventCreationData.duration) // hasEnd
  )

  let start = dateSpan.range.start

  // only rely on time info if drop zone is all-day,
  // otherwise, we already know the time
  if (dateSpan.isAllDay && eventCreationData.time) {
    start = calendar.dateEnv.add(start, eventCreationData.time)
  }

  let end = eventCreationData.duration ?
    calendar.dateEnv.add(start, eventCreationData.duration) :
    calendar.getDefaultEventEnd(dateSpan.isAllDay, start)

  let instance = createInstance(def.defId, new UnzonedRange(start, end))

  return {
    defs: { [def.defId]: def },
    instances: { [instance.instanceId]: instance }
  }
}


// same return type as getDraggedElMeta
// TODO: merge a lot of code with getDraggedElMeta!
// TODO: use refineProps!!!!!!!!!!!!!!!!!!!!!!!!!!!
// ALSO: don't like how `stick` and others are in same namespace. impossible for them to go to extendedProps
function processExplicitData(data) {
  let standardProps = assignTo({}, data)
  let startTime // a Duration
  let duration
  let stick

  if (standardProps) {

    // something like 1 or true. still signal event creation
    if (typeof standardProps !== 'object') {
      standardProps = {}
    }

    // pluck special-cased date/time properties
    startTime = standardProps.start
    if (startTime == null) { startTime = standardProps.time } // accept 'time' as well
    duration = standardProps.duration
    stick = standardProps.stick
    delete standardProps.start
    delete standardProps.time
    delete standardProps.duration
    delete standardProps.stick
  }

  // massage into correct data types
  startTime = startTime != null ? createDuration(startTime) : null
  duration = duration != null ? createDuration(duration) : null
  stick = Boolean(stick) // wont be refining undefined?!?! - have a default

  return { standardProps, startTime, duration, stick }
}


// Extracting Event Data From Elements
// -----------------------------------
// TODO: create returned struct

(externalHooks as any).dataAttrPrefix = ''

// Given an element that might represent a dragged FullCalendar event, returns an intermediate data structure
// to be used for Event Object creation.
// A defined `.eventProps`, even when empty, indicates that an event should be created.
function getDraggedElMeta(el) {
  let standardProps // properties for creating the event, not related to date/time
  let startTime // a Duration
  let duration
  let stick

  standardProps = getEmbeddedElData(el, 'event', true)

  if (standardProps) {

    // something like 1 or true. still signal event creation
    if (typeof standardProps !== 'object') {
      standardProps = {}
    }

    // pluck special-cased date/time properties
    startTime = standardProps.start
    if (startTime == null) { startTime = standardProps.time } // accept 'time' as well
    duration = standardProps.duration
    stick = standardProps.stick
    delete standardProps.start
    delete standardProps.time
    delete standardProps.duration
    delete standardProps.stick
  }

  // fallback to standalone attribute values for each of the date/time properties
  if (startTime == null) { startTime = getEmbeddedElData(el, 'start') }
  if (startTime == null) { startTime = getEmbeddedElData(el, 'time') } // accept 'time' as well
  if (duration == null) { duration = getEmbeddedElData(el, 'duration') }
  if (stick == null) { stick = getEmbeddedElData(el, 'stick', true) }

  // massage into correct data types
  startTime = startTime != null ? createDuration(startTime) : null
  duration = duration != null ? createDuration(duration) : null
  stick = Boolean(stick)

  return { standardProps, startTime, duration, stick }
}

function getEmbeddedElData(el, name, shouldParseJson = false) {
  let prefix = (externalHooks as any).dataAttrPrefix
  let prefixedName = (prefix ? prefix + '-' : '') + name

  let data = el.getAttribute('data-' + prefixedName) || null
  if (data && shouldParseJson) {
    data = JSON.parse(data)
  }

  return data
}
