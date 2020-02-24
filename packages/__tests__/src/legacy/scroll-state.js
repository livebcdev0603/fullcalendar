import DayGridViewWrapper from '../lib/wrappers/DayGridViewWrapper'
import TimeGridViewWrapper from '../lib/wrappers/TimeGridViewWrapper'
import CalendarWrapper from '../lib/wrappers/CalendarWrapper'

describe('scroll state', function() {
  let calendarEl

  beforeEach(function() {
    calendarEl = $('<div id="calendar">').width(800).appendTo('body')
  })
  afterEach(function() {
    calendarEl.remove()
    calendarEl = null
  })

  pushOptions({
    defaultDate: '2015-02-20',
    contentHeight: 200,
    scrollTime: '00:00' // for timeGrid
  })

  describeOptions('defaultView', {
    'when in month view': 'dayGridMonth',
    'when in week view': 'timeGridWeek'
  }, function(viewName) {
    let ViewWrapper = viewName.match(/^dayGrid/) ? DayGridViewWrapper : TimeGridViewWrapper

    it('should be maintained when resizing window', function(done) {
      let calendar = initCalendar({
        windowResize: function() {
          setTimeout(function() { // wait until all other tasks are finished
            expect(scrollEl.scrollTop).toBe(scroll0)
            done()
          }, 0)
        }
      }, calendarEl)
      let scrollEl = new ViewWrapper(calendar).getScrollerEl()
      let scroll0

      setTimeout(function() { // wait until after browser's scroll state is applied
        scrollEl.scrollTop = 9999 // all the way
        scroll0 = scrollEl.scrollTop
        $(window).simulate('resize')
      }, 0)
    })

    it('should be maintained when after rerendering events', function() {
      let calendar = initCalendar({
        events: [ {
          start: '2015-02-20'
        } ]
      }, calendarEl)

      let scrollEl = new ViewWrapper(calendar).getScrollerEl()
      let eventEl0 = new CalendarWrapper(calendar).getEventEls()
      expect(eventEl0.length).toBe(1)

      scrollEl.scrollTop = 9999 // all the way
      let scroll0 = scrollEl.scrollTop
      currentCalendar.render()

      let eventEl1 = new CalendarWrapper(calendar).getEventEls()
      expect(eventEl1.length).toBe(1)
      expect(eventEl1[0]).not.toBe(eventEl0[0]) // ensure it a rerender
      expect(scrollEl.scrollTop).toBe(scroll0)
    })
  })
})
