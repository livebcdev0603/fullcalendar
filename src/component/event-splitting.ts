import { EventStore, createEmptyEventStore } from '../structs/event-store'
import { EventDef } from '../structs/event'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { mapHash } from '../util/object'
import { memoize } from '../util/memoize'
import { EventUiHash, EventUi, combineEventUis } from './event-ui'
import { DateSpan } from '../structs/date-span'

export interface SplittableProps {
  dateSelection: DateSpan | null
  eventStore: EventStore
  eventUiBases: EventUiHash
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
}

const EMPTY_EVENT_STORE = createEmptyEventStore() // for purecomponents. TODO: keep elsewhere

export const EMPTY_PROPS: SplittableProps = {
  dateSelection: null,
  eventStore: EMPTY_EVENT_STORE,
  eventUiBases: {},
  eventSelection: '',
  eventDrag: null,
  eventResize: null
}

export default abstract class Splitter<PropsType extends SplittableProps = SplittableProps> {

  private getKeysForEventDefs = memoize(this._getKeysForEventDefs)
  private splitDateSelection = memoize(this._splitDateSpan)
  private splitEventStore = memoize(this._splitEventStore)
  private splitEventUiBases = memoize(this._splitEventUiBases)
  private splitEventDrag = memoize(this._splitInteraction)
  private splitEventResize = memoize(this._splitInteraction)
  protected keyEventUiMergers: { [key: string]: typeof mergeKeyEventUi } = {}

  abstract getKeysForDateSpan(dateSpan: DateSpan): string[]
  abstract getKeysForEventDef(eventDef: EventDef): string[]

  getKeyEventUis(props: PropsType): EventUiHash {
    return {}
  }

  splitProps(props: PropsType): { [key: string]: SplittableProps } {
    let oldKeyEventUiMergers = this.keyEventUiMergers
    let keyEventUiMergers = this.keyEventUiMergers = {}

    let dateSelections = this.splitDateSelection(props.dateSelection)
    let keysByDefId = this.getKeysForEventDefs(props.eventStore)
    let keyEventUis = this.getKeyEventUis(props)
    let eventUiBases = this.splitEventUiBases(props.eventUiBases, keysByDefId)
    let eventStores = this.splitEventStore(props.eventStore, keysByDefId)
    let eventDrags = this.splitEventDrag(props.eventDrag, keysByDefId)
    let eventResizes = this.splitEventResize(props.eventResize, keysByDefId)
    let splitProps: { [key: string]: SplittableProps } = {}

    let populate = function(key: string) {
      if (!splitProps[key]) {
        let eventStore = eventStores[key] || EMPTY_PROPS.eventStore
        keyEventUiMergers[key] = oldKeyEventUiMergers[key] || memoize(mergeKeyEventUi)

        splitProps[key] = {
          dateSelection: dateSelections[key] || null,
          eventStore,
          eventUiBases: keyEventUiMergers[key](eventUiBases[key], keyEventUis[key]),
          eventSelection: eventStore.instances[props.eventSelection] ? props.eventSelection : '',
          eventDrag: eventDrags[key] || null,
          eventResize: eventResizes[key] || null
        }
      }
    }

    for (let key in dateSelections) { populate(key) }
    for (let key in eventStores) { populate(key) }
    for (let key in eventDrags) { populate(key) }
    for (let key in eventResizes) { populate(key) }

    return splitProps
  }

  private _splitDateSpan(dateSpan: DateSpan | null) {
    let dateSpans = {}

    if (dateSpan) {
      let keys = this.getKeysForDateSpan(dateSpan)

      for (let key of keys) {
        dateSpans[key] = dateSpan
      }
    }

    return dateSpans
  }

  private _getKeysForEventDefs(eventStore: EventStore) {
    return mapHash(eventStore.defs, (eventDef: EventDef) => {
      return this.getKeysForEventDef(eventDef)
    })
  }

  private _splitEventStore(eventStore: EventStore, keysByDefId): { [key: string]: EventStore } {
    let { defs, instances } = eventStore
    let splitStores = {}

    for (let defId in defs) {
      for (let key of keysByDefId[defId]) {

        if (!splitStores[key]) {
          splitStores[key] = createEmptyEventStore()
        }

        splitStores[key].defs[defId] = defs[defId]
      }
    }

    for (let instanceId in instances) {
      let instance = instances[instanceId]

      for (let key of keysByDefId[instance.defId]) {

        if (splitStores[key]) { // must have already been created
          splitStores[key].instances[instanceId] = instance
        }
      }
    }

    return splitStores
  }

  /*
  TODO: can we make EventConfigBase: { all: EventConfig, byDefId: EventConfigHash }
  */
  private _splitEventUiBases(eventUiBases: EventUiHash, keysByDefId): { [key: string]: EventUiHash } {
    let universalEventUiBase = eventUiBases['']
    let splitHashes: { [key: string]: EventUiHash } = {}

    for (let defId in eventUiBases) {
      if (defId) { // not the '' key
        for (let key of keysByDefId[defId]) {

          if (!splitHashes[key]) {
            splitHashes[key] = {}
          }

          splitHashes[key][defId] = eventUiBases[defId]
        }
      }
    }

    if (universalEventUiBase) {
      for (let key in splitHashes) {
        splitHashes[key][''] = universalEventUiBase
      }
    }

    return splitHashes
  }

  private _splitInteraction(interaction: EventInteractionState | null, keysByDefId): { [key: string]: EventInteractionState } {
    let splitStates: { [key: string]: EventInteractionState } = {}

    if (interaction) {
      let affectedStores = this._splitEventStore(interaction.affectedEvents, keysByDefId)

      // can't rely on keysByDefId because event data is mutated
      let mutatedKeysByDefId = this._getKeysForEventDefs(interaction.mutatedEvents)
      let mutatedStores = this._splitEventStore(interaction.mutatedEvents, mutatedKeysByDefId)

      let populate = function(key) {
        if (!splitStates[key]) {
          splitStates[key] = {
            affectedEvents: affectedStores[key] || EMPTY_EVENT_STORE,
            mutatedEvents: mutatedStores[key] || EMPTY_EVENT_STORE,
            isEvent: interaction.isEvent,
            origSeg: interaction.origSeg
          }
        }
      }

      for (let key in affectedStores) {
        populate(key)
      }

      for (let key in mutatedStores) {
        populate(key)
      }
    }

    return splitStates
  }

}

// TODO: move all above methods to be normal functions?


function mergeKeyEventUi(eventUiBase: EventUiHash, eventUiForKey?: EventUi): EventUiHash {
  let parts = []

  if (!eventUiBase) {
    eventUiBase = {}
  }

  if (eventUiBase['']) {
    parts.push(eventUiBase[''])
  }

  if (eventUiForKey) {
    parts.push(eventUiForKey)
  }

  return Object.assign(eventUiBase, {
    '': combineEventUis(parts)
  })
}
