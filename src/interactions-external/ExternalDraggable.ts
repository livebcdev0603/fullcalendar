import FeaturefulElementDragging from '../dnd/FeaturefulElementDragging'
import ExternalElementDragging, { DragMetaGenerator } from './ExternalElementDragging'
import { globalDefaults } from '../options'
import { PointerDragEvent } from '../dnd/PointerDragging'

export interface ExternalDraggableSettings {
  eventData?: DragMetaGenerator
  itemSelector?: string
  delay?: number
  minDistance?: number
}

/*
Makes an element (that is *external* to any calendar) draggable.
Can pass in data that determines how an event will be created when dropped onto a calendar.
Leverages FullCalendar's internal drag-n-drop functionality WITHOUT a third-party drag system.
*/
export default class ExternalDraggable {

  dragging: FeaturefulElementDragging
  settings: ExternalDraggableSettings

  constructor(el: HTMLElement, settings: ExternalDraggableSettings = {}) {
    this.settings = settings

    let dragging = this.dragging = new FeaturefulElementDragging(el)
    dragging.touchScrollAllowed = false

    if (settings.itemSelector != null) {
      dragging.pointer.selector = settings.itemSelector
    }

    dragging.emitter.on('pointerdown', this.handlePointerDown)
    dragging.emitter.on('dragstart', this.handleDragStart)

    new ExternalElementDragging(dragging, settings.eventData)
  }

  handlePointerDown = (ev: PointerDragEvent) => {
    let { dragging } = this
    let { minDistance, delay } = this.settings

    dragging.minDistance =
      minDistance != null ?
        minDistance :
        (ev.isTouch ? 0 : globalDefaults.eventDragMinDistance)

    dragging.delay =
      delay != null ?
        delay :
        (ev.isTouch ? globalDefaults.longPressDelay : 0) // TODO: eventually read eventLongPressDelay
  }

  handleDragStart = (ev: PointerDragEvent) => {
    if (
      ev.isTouch &&
      this.dragging.delay &&
      (ev.subjectEl as HTMLElement).classList.contains('fc-event')
    ) {
      this.dragging.mirror.getMirrorEl().classList.add('fc-selected')
    }
  }

  destroy() {
    this.dragging.destroy()
  }

}
