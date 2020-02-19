import { getEventEls } from '../lib/EventRenderUtils'
import TimeGridViewWrapper from '../lib/wrappers/TimeGridViewWrapper'


describe('timegrid all-day slot', function() {
  pushOptions({
    defaultDate: '2019-04-23',
    defaultView: 'timeGridWeek',
    editable: true
  })

  // https://github.com/fullcalendar/fullcalendar/issues/4616
  it('allows dragging after dynamic event adding', function(done) {
    let calendar = initCalendar({
      eventDrop(arg) {
        expect(arg.event.start).toEqualDate('2019-04-24')
        done()
      }
    })

    calendar.batchRendering(function() {
      calendar.addEvent({ start: '2019-04-23' })
      calendar.addEvent({ start: '2019-04-23' })
      calendar.addEvent({ start: '2019-04-23' })
    })

    let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
    let dayWidth = $(timeGridWrapper.getDayEls('2019-04-23')).width()

    let lastEventEl = getEventEls()[2]
    $(lastEventEl).simulate('drag', {
      localPoint: { left: '50%', top: '99%' },
      dx: dayWidth
    })
  })
})
