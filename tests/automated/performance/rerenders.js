
describe('rerender performance', function() {

  pushOptions({
    defaultDate: '2017-10-04',
    events: [
      { title: 'event 0', start: '2017-10-04' }
    ],
    windowResizeDelay: 0
  });

  [
    {
      classes: [ 'MonthView', 'DayGrid' ],
      defaultView: 'month',
      changeToView: 'list' // does not have DayGrid!
    },
    {
      classes: [ 'AgendaView', 'DayGrid', 'TimeGrid' ],
      defaultView: 'agendaWeek',
      changeToView: 'list' // does not have DayGrid!
    },
    {
      classes: [ 'ListView' ],
      defaultView: 'listWeek',
      changeToView: 'month'
    }
  ].forEach(function(settings) {
    settings.classes.forEach(function(className) {
      describe('for ' + className + ' in ' + settings.defaultView + ' view', function() {
        var Class = FullCalendar[className]

        it('calls methods a limited number of times', function(done) {
          var renderDates = spyOnMethod(Class, 'renderDates')
          var renderEvents = spyOnMethod(Class, 'renderEvents')
          var updateSize = spyOnMethod(Class, 'updateSize')

          initCalendar({
            defaultView: settings.defaultView
          })

          expect(renderDates.calls.count()).toBe(1)
          expect(renderEvents.calls.count()).toBe(1)
          expect(updateSize.calls.count()).toBe(1)

          currentCalendar.changeView(settings.changeToView)

          expect(renderDates.calls.count()).toBe(1)
          expect(renderEvents.calls.count()).toBe(1)
          expect(updateSize.calls.count()).toBe(1)

          currentCalendar.changeView(settings.defaultView)

          expect(renderDates.calls.count()).toBe(2) // +1
          expect(renderEvents.calls.count()).toBe(2) // +1
          expect(updateSize.calls.count()).toBe(2) // +1

          currentCalendar.rerenderEvents()

          expect(renderDates.calls.count()).toBe(2)
          expect(renderEvents.calls.count()).toBe(3) // +1
          expect(updateSize.calls.count()).toBe(3) // +1

          $(window).simulate('resize')

          setTimeout(function() {

            expect(renderDates.calls.count()).toBe(2)
            expect(renderEvents.calls.count()).toBe(3)
            expect(updateSize.calls.count()).toBe(4) // +1

            renderDates.restore()
            renderEvents.restore()
            updateSize.restore()

            done()
          }, 1) // more than windowResizeDelay
        })
      })
    })
  })
})
