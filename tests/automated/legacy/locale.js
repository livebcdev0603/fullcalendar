
describe('locale', function() {

  afterEach(function() {
    moment.locale('en')
  })

  it('is not affected by global moment locale when unset', function() {
    moment.locale('fr')
    initCalendar()
    var mom = window.currentCalendar.moment('2014-05-01')
    var s = mom.format('dddd MMMM Do YYYY')
    expect(s).toEqual('Thursday May 1st 2014')
  })

  it('is not affected by global moment locale when unset', function() {
    moment.locale('fr')
    initCalendar({
      locale: 'es'
    })
    var mom = window.currentCalendar.moment('2014-05-01')
    var s = mom.format('dddd MMMM Do YYYY')
    expect(s).toEqual('jueves mayo 1º 2014')
  })

  it('doesn\'t side-effect the global moment locale when customized', function() {
    moment.locale('fr')
    initCalendar({
      locale: 'es'
    })
    var mom = moment.utc('2014-05-01')
    var s = mom.format('dddd MMMM Do YYYY')
    expect(s).toEqual('jeudi mai 1er 2014')
    expect(moment.locale()).toEqual('fr')
  })

  // the most recent version of moment will actually throw a cryptic exception,
  // and instead of papering over this, just let it be thrown. will indicate that something
  // needs to be fixed to the developer.
  /*
  xit('defaults to English when configured to locale that isn\'t loaded', function() {
    pushOptions({
      locale: 'zz'
    });
    var calendar = initCalendar();
    var mom = calendar.moment('2014-05-01');
    var s = mom.format('dddd MMMM Do YYYY');
    expect(s).toEqual('Thursday May 1st 2014');
  });
  */

  it('works when certain locale has no FC settings defined', function() {
    initCalendar({
      locale: 'en-ca',
      defaultView: 'agendaWeek',
      defaultDate: '2014-12-25',
      events: [
        { title: 'Christmas', start: '2014-12-25T10:00:00' }
      ]
    })
    expect($('.fc-day-header:first')).toHaveText('Sun 12-21')
    expect($('.fc-event .fc-time')).toHaveText('10:00')
  })

  // @todo dynamic setting of locale not working
  xit('allows dynamic setting', function() {

    initCalendar({
      locale: 'es',
      defaultDate: '2016-07-10',
      defaultView: 'month'
    })

    var calendar_el = window.currentCalendar.el

    expect($('h2', calendar_el)).toHaveText('julio 2016')
    expect($(calendar_el)).not.toHaveClass('fc-rtl')

    calendar_el.fullCalendar('option', 'locale', 'fr')
    expect($('h2', calendar_el)).toHaveText('juillet 2016')

    calendar_el.fullCalendar('option', 'locale', 'ar')
    expect($(calendar_el).toHaveClass('fc-rtl')

  })

})
