import { createPlugin } from './plugin-system'
import { Calendar } from './main'
import { hashValuesToArray } from './util/object'
import { EventSource } from './structs/event-source'

export const changeHandlerPlugin = createPlugin({
  optionChangeHandlers: {
    events(events, calendar) {
      handleEventSources([ events ], calendar)
    },
    eventSources: handleEventSources
  }
})

/*
BUG: if `event` was supplied, all previously-given `eventSources` will be wiped out
*/
function handleEventSources(inputs, calendar: Calendar) {
  let unfoundSources: EventSource[] = hashValuesToArray(calendar.state.eventSources)
  let newInputs = []

  for (let input of inputs) {
    let inputFound = false

    for (let i = 0; i < unfoundSources.length; i++) {
      if (unfoundSources[i]._raw === input) {
        unfoundSources.splice(i, 1) // delete
        inputFound = true
        break
      }
    }

    if (!inputFound) {
      newInputs.push(input)
    }
  }

  for (let unfoundSource of unfoundSources) {
    calendar.dispatch({
      type: 'REMOVE_EVENT_SOURCE',
      sourceId: unfoundSource.sourceId
    })
  }

  for (let newInput of newInputs) {
    calendar.addEventSource(newInput)
  }
}
