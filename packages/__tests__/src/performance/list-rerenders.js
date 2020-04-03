
it('list view rerenders well', function(done) {
  let dayRenderCnt = 0
  let eventRenderCnt = 0
  let noEventsRenderCnt = 0

  let calendar = initCalendar({
    defaultView: 'listWeek',
    defaultDate: '2017-10-04',
    windowResizeDelay: 0,
    events: [
      { title: 'event 0', start: '2017-10-04' }
    ],
    dayHeaderContent() {
      dayRenderCnt++
    },
    eventContent() {
      eventRenderCnt++
    },
    noEventsContent() {
      noEventsRenderCnt++
    }
  })

  function resetCounts() {
    dayRenderCnt = 0
    eventRenderCnt = 0
    noEventsRenderCnt = 0
  }

  expect(dayRenderCnt).toBe(1)
  expect(eventRenderCnt).toBe(1)
  expect(noEventsRenderCnt).toBe(0)

  resetCounts()
  calendar.next()
  expect(dayRenderCnt).toBe(0) // no days
  expect(eventRenderCnt).toBe(0) // event will be out of view
  expect(noEventsRenderCnt).toBe(1)

  calendar.changeView('dayGridWeek') // switch away
  resetCounts()
  calendar.changeView('listWeek') // return to view
  expect(dayRenderCnt).toBe(0)
  expect(eventRenderCnt).toBe(0)
  expect(noEventsRenderCnt).toBe(1)

  resetCounts()
  $(window).simulate('resize')
  setTimeout(function() {

    expect(dayRenderCnt).toBe(0)
    expect(eventRenderCnt).toBe(0)
    expect(noEventsRenderCnt).toBe(0)

    done()
  }, 1) // more than windowResizeDelay
})
