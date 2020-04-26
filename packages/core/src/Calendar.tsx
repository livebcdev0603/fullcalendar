import { __assign } from 'tslib'
import {
  OptionsInput, Action, CalendarState, CalendarContent, render, h, DelayedRunner, guid, CssDimValue, applyStyleProp,
  CalendarStateReducer, CalendarApi, computeCalendarClassNames, computeCalendarHeight, isArraysEqual
 } from '@fullcalendar/common'
import { flushToDom } from './utils'


export class Calendar extends CalendarApi {

  el: HTMLElement
  isRendering = false
  isRendered = false
  renderRunner: DelayedRunner
  currentClassNames: string[] = []
  currentState: CalendarState

  get view() { return this.currentState.viewApi } // for public API


  constructor(el: HTMLElement, optionOverrides: OptionsInput = {}) {
    super(new CalendarStateReducer())

    this.el = el
    this.renderRunner = new DelayedRunner(this.handleRenderRequest)

    this.reducer.init(
      optionOverrides,
      this,
      this.handleAction,
      this.handleState
    )
  }


  handleAction = (action: Action) => {
    // actions we know we want to render immediately
    switch (action.type) {
      case 'SET_EVENT_DRAG':
      case 'SET_EVENT_RESIZE':
        this.renderRunner.tryDrain()
    }
  }


  handleState = (state: CalendarState) => {
    this.currentState = state
    this.renderRunner.request(state.options.rerenderDelay)
  }


  handleRenderRequest = () => {

    if (this.isRendering) {
      this.isRendered = true

      let state = this.currentState
      this.setClassNames(computeCalendarClassNames(state))
      this.setHeight(computeCalendarHeight(state))

      render(
        <CalendarContent {...state} />,
        this.el
      )

    } else if (this.isRendered) {
      this.isRendered = false
      this.setClassNames([])
      this.setHeight('')
      render(null, this.el)
    }

    flushToDom()
  }


  render() {
    if (!this.isRendering) {
      this.isRendering = true
      this.renderRunner.request()
    } else {
      // hack for RERENDERING
      this.setOption('renderId', guid())
    }
  }


  destroy() {
    if (this.isRendering) {
      this.isRendering = false
      this.renderRunner.request()
    }
  }


  updateSize() {
    super.updateSize()
    flushToDom()
  }


  batchRendering(func) {
    this.renderRunner.pause('batchRendering')
    func()
    this.renderRunner.resume('batchRendering')
  }


  pauseRendering() { // available to plugins
    this.renderRunner.pause('pauseRendering')
  }


  resumeRendering() { // available to plugins
    this.renderRunner.resume('pauseRendering', true)
  }


  setClassNames(classNames: string[]) {
    if (!isArraysEqual(classNames, this.currentClassNames)) {
      let { classList } = this.el

      for (let className of this.currentClassNames) {
        classList.remove(className)
      }

      for (let className of classNames) {
        classList.add(className)
      }

      this.currentClassNames = classNames
    }
  }


  setHeight(height: CssDimValue) {
    applyStyleProp(this.el, 'height', height)
  }

}
