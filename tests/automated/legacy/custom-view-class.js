describe('custom view class', function() {

  it('calls all standard methods with correct parameters', function() {
    var View = FullCalendar.View
    var CustomView

    var methods = {
      initialize: function() {
      },
      render: function() {
      },
      setHeight: function(height, isAuto) {
        expect(typeof height).toBe('number')
        expect(typeof isAuto).toBe('boolean')
      },
      renderEvents: function(events) {
        expect($.type(events)).toBe('array')
        expect(events.length).toBe(1)
        expect(events[0].start instanceof Date).toBe(true)
        expect(events[0].end instanceof Date).toBe(true)
      },
      destroyEvents: function() {
      },
      renderSelection: function(range) {
        expect($.type(range)).toBe('object')
        expect(range.start instanceof Date).toBe(true)
        expect(range.end instanceof Date).toBe(true)
      },
      destroySelection: function() {
      }
    }

    spyOn(methods, 'initialize').and.callThrough()
    spyOn(methods, 'render').and.callThrough()
    spyOn(methods, 'setHeight').and.callThrough()
    spyOn(methods, 'renderEvents').and.callThrough()
    spyOn(methods, 'destroyEvents').and.callThrough()
    spyOn(methods, 'renderSelection').and.callThrough()
    spyOn(methods, 'destroySelection').and.callThrough()

    CustomView = View.extend(methods)
    FullCalendar.views.custom = CustomView

    initCalendar({
      defaultView: 'custom',
      defaultDate: '2014-12-25',
      events: [
        {
          title: 'Holidays',
          start: '2014-12-25T09:00:00',
          end: '2014-12-25T11:00:00'
        }
      ]
    })

    expect(methods.initialize).toHaveBeenCalled()
    expect(methods.render).toHaveBeenCalled()
    expect(methods.setHeight).toHaveBeenCalled()
    expect(methods.renderEvents).toHaveBeenCalled()

    currentCalendar.rerenderEvents()

    expect(methods.destroyEvents).toHaveBeenCalled()

    currentCalendar.select('2014-12-25', '2014-01-01')

    expect(methods.renderSelection).toHaveBeenCalled()

    currentCalendar.unselect()

    expect(methods.destroySelection).toHaveBeenCalled()

    delete FullCalendar.views.custom
  })

})
