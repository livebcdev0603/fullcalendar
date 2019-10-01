import ComponentContext from './ComponentContext'

let guid = 0


export type EqualityFuncHash = { [propName: string]: (obj0, obj1) => boolean }

export default class Component<PropsType> {

  equalityFuncs: EqualityFuncHash // can't initialize here. done below...

  uid: string
  props: PropsType | null
  context: ComponentContext

  constructor() {
    this.uid = String(guid++)
  }

  static addEqualityFuncs(newFuncs: EqualityFuncHash) {
    this.prototype.equalityFuncs = {
      ...this.prototype.equalityFuncs,
      ...newFuncs
    }
  }

  receiveProps(props: PropsType, context: ComponentContext) {
    let oldContext = this.context
    this.context = context

    if (!oldContext) {
      this.firstContext(context)
    }

    let { anyChanges, comboProps } = recycleProps(this.props || {}, props, this.equalityFuncs)

    this.props = comboProps

    if (anyChanges) {

      if (oldContext) {
        this.beforeUpdate()
      }

      this.render(comboProps, context)

      if (oldContext) {
        this.afterUpdate()
      }
    }
  }

  protected render(props: PropsType, context: ComponentContext) {
  }

  firstContext(context: ComponentContext) {
  }

  beforeUpdate() {
  }

  afterUpdate() {
  }

  // after destroy is called, this component won't ever be used again
  destroy() {
  }

}

Component.prototype.equalityFuncs = {}


/*
Reuses old values when equal. If anything is unequal, returns newProps as-is.
Great for PureComponent, but won't be feasible with React, so just eliminate and use React's DOM diffing.
*/
function recycleProps(oldProps, newProps, equalityFuncs: EqualityFuncHash) {
  let comboProps = {} as any // some old, some new
  let anyChanges = false

  for (let key in newProps) {
    if (
      key in oldProps && (
        oldProps[key] === newProps[key] ||
        (equalityFuncs[key] && equalityFuncs[key](oldProps[key], newProps[key]))
      )
    ) {
      // equal to old? use old prop
      comboProps[key] = oldProps[key]
    } else {
      comboProps[key] = newProps[key]
      anyChanges = true
    }
  }

  for (let key in oldProps) {
    if (!(key in newProps)) {
      anyChanges = true
      break
    }
  }

  return { anyChanges, comboProps }
}
