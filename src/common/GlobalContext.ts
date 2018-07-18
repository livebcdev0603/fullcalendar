import DateComponent from '../component/DateComponent'
import DateClicking from '../interactions/DateClicking'
import DateSelecting from '../interactions/DateSelecting'
import EventClicking from '../interactions/EventClicking'

let componentCnt = 0
let componentHash = {}
let listenerHash = {}

export default {

  // TODO: event hovering

  registerComponent(component: DateComponent) {
    componentHash[component.uid] = component
    componentCnt++

    if (componentCnt === 1) {
      this.bind()
    }

    this.bindComponent(component)
  },

  unregisterComponent(component: DateComponent) {
    delete componentHash[component.uid]
    componentCnt--

    if (componentCnt === 0) {
      this.unbind()
    }

    this.unbindComponent(component)
  },

  bind() {
    this.dateSelecting = new DateSelecting(componentHash)
  },

  unbind() {
    this.dateSelecting.destroy()
  },

  bindComponent(component: DateComponent) {
    listenerHash[component.uid] = {
      dateClicking: new DateClicking(component),
      eventClicking: new EventClicking(component)
    }
  },

  unbindComponent(component: DateComponent) {
    let listeners = listenerHash[component.uid]
    listeners.dateClicking.destroy()
    listeners.eventClicking.destroy()
    delete listenerHash[component.uid]
  }

}
