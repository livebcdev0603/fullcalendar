import { default as bootstrapPlugin } from '@fullcalendar/bootstrap'
import { default as dayGridPlugin } from '@fullcalendar/daygrid'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'

describe('theme switching', () => {
  pushOptions({
    plugins: [bootstrapPlugin, dayGridPlugin],
  })

  it('can switch from standard to bootstrap', () => {
    let calendar = initCalendar()
    verifyStandardTheme(calendar)
    currentCalendar.setOption('themeSystem', 'bootstrap')
    verifyBootstrapTheme(calendar)
  })

  it('can switch from bootstrap to standard', () => {
    let calendar = initCalendar({ themeSystem: 'bootstrap' })
    verifyBootstrapTheme(calendar)
    currentCalendar.setOption('themeSystem', 'standard')
    verifyStandardTheme(calendar)
  })

  function verifyStandardTheme(calendar) {
    expect(calendar.el).toHaveClass(CalendarWrapper.UNTHEMED_CLASSNAME)
  }

  function verifyBootstrapTheme(calendar) {
    expect(calendar.el).toHaveClass(CalendarWrapper.BOOTSTRAP_CLASSNAME)
  }
})
