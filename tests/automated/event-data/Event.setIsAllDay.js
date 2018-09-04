describe('Event::setIsAllDay', function() {

  describe('when setting from all-day to all-day', function() {
    it('causes no change', function() {
      initCalendar({
        events: [
          { id: '1', start: '2018-09-03', end: '2018-09-05', isAllDay: true }
        ]
      })
      let event = currentCalendar.getEventById('1')
      event.setIsAllDay(true)
      expect(event.start).toEqualDate('2018-09-03')
      expect(event.end).toEqualDate('2018-09-05')
      expect(event.isAllDay).toBe(true)
    })
  })

  describe('when setting from timed to timed', function() {
    it('causes no change', function() {
      initCalendar({
        events: [
          { id: '1', start: '2018-09-03T09:00:00', end: '2018-09-05T09:00:00', isAllDay: false }
        ]
      })
      let event = currentCalendar.getEventById('1')
      event.setIsAllDay(false)
      expect(event.start).toEqualDate('2018-09-03T09:00:00Z')
      expect(event.end).toEqualDate('2018-09-05T09:00:00Z')
      expect(event.isAllDay).toBe(false)
    })
  })

  describe('when setting from all-day to timed', function() {

    describe('when not maintaining duration', function() {
      it('removes the end', function() {
        initCalendar({
          events: [
            { id: '1', start: '2018-09-03', end: '2018-09-05', isAllDay: true }
          ]
        })
        let event = currentCalendar.getEventById('1')
        event.setIsAllDay(false)
        expect(event.start).toEqualDate('2018-09-03')
        expect(event.end).toBe(null)
        expect(event.isAllDay).toBe(false)
      })
    })

    describe('when maintaining duration', function() {
      it('keeps exact duration', function() {
        initCalendar({
          events: [
            { id: '1', start: '2018-09-03', end: '2018-09-05', isAllDay: true }
          ]
        })
        let event = currentCalendar.getEventById('1')
        event.setIsAllDay(false, { maintainDuration: true })
        expect(event.start).toEqualDate('2018-09-03')
        expect(event.end).toEqualDate('2018-09-05')
        expect(event.isAllDay).toBe(false)
      })
    })

  })

  describe('when setting from timed to all-day', function() {

    describe('when not maintaining duration', function() {
      it('removes the end', function() {
        initCalendar({
          events: [
            { id: '1', start: '2018-09-03T09:00:00', end: '2018-09-05T09:00:00', isAllDay: false }
          ]
        })
        let event = currentCalendar.getEventById('1')
        event.setIsAllDay(true)
        expect(event.start).toEqualDate('2018-09-03')
        expect(event.end).toBe(null)
        expect(event.isAllDay).toBe(true)
      })
    })

    describe('when maintaining duration', function() {
      it('rounds the end down to the prev whole day', function() {
        initCalendar({
          events: [
            { id: '1', start: '2018-09-03T09:00:00', end: '2018-09-05T10:00:00', isAllDay: false }
          ]
        })
        let event = currentCalendar.getEventById('1')
        event.setIsAllDay(true, { maintainDuration: true })
        expect(event.start).toEqualDate('2018-09-03')
        expect(event.end).toEqualDate('2018-09-05')
        expect(event.isAllDay).toBe(true)
      })
    })

    describe('when maintaining duration (from calendar setting)', function() {
      it('rounds the end to the next whole day', function() {
        initCalendar({
          isAllDayMaintainDuration: true,
          events: [
            { id: '1', start: '2018-09-03T09:00:00', end: '2018-09-05T10:00:00', isAllDay: false }
          ]
        })
        let event = currentCalendar.getEventById('1')
        event.setIsAllDay(true)
        expect(event.start).toEqualDate('2018-09-03')
        expect(event.end).toEqualDate('2018-09-05')
        expect(event.isAllDay).toBe(true)
      })
    })

  })

})
