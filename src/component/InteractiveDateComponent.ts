import { elementClosest } from '../util/dom-manip'
import DateComponent from './DateComponent'
import { Selection } from '../reducers/selection'
import GlobalContext from '../common/GlobalContext'

export type InteractiveDateComponentHash = {
  [uid: string]: InteractiveDateComponent
}

export default abstract class InteractiveDateComponent extends DateComponent {

  // self-config, overridable by subclasses
  segSelector: string = '.fc-event-container > *' // what constitutes an event element?

  // if defined, holds the unit identified (ex: "year" or "month") that determines the level of granularity
  // of the date areas. if not defined, assumes to be day and time granularity.
  // TODO: port isTimeScale into same system?
  largeUnit: any


  queryHit(leftOffset, topOffset): Selection {
    return null // this should be abstract
  }


  buildCoordCaches() {
  }


  bindGlobalHandlers() {
    GlobalContext.registerComponent(this)
  }


  unbindGlobalHandlers() {
    GlobalContext.unregisterComponent(this)
  }


  isValidSegInteraction(evTarget: HTMLElement) {
    return !elementClosest(evTarget, '.fc-helper') &&
      !this.dragState &&
      !this.eventResizeState
  }


  isValidDateInteraction(evTarget: HTMLElement) {
    return !elementClosest(evTarget, this.segSelector) &&
      !elementClosest(evTarget, '.fc-more') && // a "more.." link
      !elementClosest(evTarget, 'a[data-goto]') // a clickable nav link
  }


  // Event Drag-n-Drop
  // ---------------------------------------------------------------------------------------------------------------


  // Computes if the given event is allowed to be dragged by the user
  isEventDefDraggable(eventDef) {
    return this.isEventDefStartEditable(eventDef)
  }


  isEventDefStartEditable(eventDef) {
    return false // TODO
  }


  isEventDefGenerallyEditable(eventDef) {
    return false // TODO
  }



  // Event Resizing
  // ---------------------------------------------------------------------------------------------------------------


  // Computes if the given event is allowed to be resized from its starting edge
  isEventDefResizableFromStart(eventDef) {
    return this.opt('eventResizableFromStart') && this.isEventDefResizable(eventDef)
  }


  // Computes if the given event is allowed to be resized from its ending edge
  isEventDefResizableFromEnd(eventDef) {
    return this.isEventDefResizable(eventDef)
  }


  // Computes if the given event is allowed to be resized by the user at all
  isEventDefResizable(eventDef) {
    return false // TODO
  }

}
