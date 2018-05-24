
describe('recurring events', function() {

  describe('when timed events in local timezone', function() {
    pushOptions({
      defaultView: 'agendaWeek',
      defaultDate: '2017-07-03',
      timezone: 'local',
      events: [
        { start: '09:00', end: '11:00', dow: [ 2, 4 ] }
      ]
    })

    it('expands events with local time', function() {
      initCalendar()

      var events = currentCalendar.clientEvents()

      expect(events[0].start).toEqualDate('2017-07-04T09:00:00') // local
      expect(events[0].end).toEqualDate('2017-07-04T11:00:00') // local

      expect(events[1].start).toEqualDate('2017-07-06T09:00:00') // local
      expect(events[1].end).toEqualDate('2017-07-06T11:00:00') // local
    })
  })

})
