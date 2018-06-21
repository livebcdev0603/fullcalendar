import { removeElement } from '../util/dom-manip'


export default class Component {

  el: HTMLElement


  setElement(el: HTMLElement) {
    this.el = el
  }


  removeElement() {
    removeElement(this.el)
    // NOTE: don't null-out this.el in case the View was destroyed within an API callback.
    // We don't null-out the View's other element references upon destroy,
    //  so we shouldn't kill this.el either.
  }

}
