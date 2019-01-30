describe('button text', function() {

  pushOptions({
    header: {
      left: 'prevYear,prev,today,next,nextYear',
      center: '',
      right: 'month,dayGridWeek,dayGridDay,week,day'
    }
  })

  describe('with default locale', function() {

    describe('with default buttonIcons', function() {

      it('should contain default text values', function() {
        initCalendar()

        // will have button icons, to text will be empty
        expect($('.fc-next-button')).toHaveText('')
        expect($('.fc-nextYear-button')).toHaveText('')
        expect($('.fc-prev-button')).toHaveText('')
        expect($('.fc-prevYear-button')).toHaveText('')

        expect($('.fc-today-button')).toHaveText('today')
        expect($('.fc-month-button')).toHaveText('month')
        expect($('.fc-dayGridWeek-button')).toHaveText('week')
        expect($('.fc-week-button')).toHaveText('week')
        expect($('.fc-dayGridDay-button')).toHaveText('day')
        expect($('.fc-day-button')).toHaveText('day')
      })

      it('should contain specified text values', function() {
        initCalendar({
          buttonText: {
            prev: '<-',
            next: '->',
            prevYear: '<--',
            nextYear: '-->',
            today: 'tidei',
            month: 'mun',
            week: 'wiki',
            day: 'dei'
          }
        })

        expect($('.fc-next-button')).toHaveText('->')
        expect($('.fc-nextYear-button')).toHaveText('-->')
        expect($('.fc-prev-button')).toHaveText('<-')
        expect($('.fc-prevYear-button')).toHaveText('<--')

        expect($('.fc-today-button')).toHaveText('tidei')
        expect($('.fc-month-button')).toHaveText('mun')
        expect($('.fc-day-button')).toHaveText('dei')
        expect($('.fc-week-button')).toHaveText('wiki')
        expect($('.fc-dayGridDay-button')).toHaveText('dei')
        expect($('.fc-dayGridWeek-button')).toHaveText('wiki')
      })

    })

    describe('with buttonIcons turned off', function() {

      pushOptions({
        buttonIcons: false
      })

      it('should contain default text values', function() {
        initCalendar()

        // will have actual text now
        expect($('.fc-next-button')).toHaveText('next')
        expect($('.fc-nextYear-button')).toHaveText('next year')
        expect($('.fc-prev-button')).toHaveText('prev')
        expect($('.fc-prevYear-button')).toHaveText('prev year')

        expect($('.fc-today-button')).toHaveText('today')
        expect($('.fc-month-button')).toHaveText('month')
        expect($('.fc-dayGridWeek-button')).toHaveText('week')
        expect($('.fc-week-button')).toHaveText('week')
        expect($('.fc-dayGridDay-button')).toHaveText('day')
        expect($('.fc-day-button')).toHaveText('day')
      })

      it('should contain specified text values', function() {
        initCalendar({
          buttonText: {
            prev: '<-',
            next: '->',
            prevYear: '<--',
            nextYear: '-->',
            today: 'tidei',
            month: 'mun',
            week: 'wiki',
            day: 'dei'
          }
        })

        expect($('.fc-next-button')).toHaveText('->')
        expect($('.fc-nextYear-button')).toHaveText('-->')
        expect($('.fc-prev-button')).toHaveText('<-')
        expect($('.fc-prevYear-button')).toHaveText('<--')

        expect($('.fc-today-button')).toHaveText('tidei')
        expect($('.fc-month-button')).toHaveText('mun')
        expect($('.fc-day-button')).toHaveText('dei')
        expect($('.fc-week-button')).toHaveText('wiki')
        expect($('.fc-dayGridDay-button')).toHaveText('dei')
        expect($('.fc-dayGridWeek-button')).toHaveText('wiki')
      })

    })

  })

  describe('when locale is not default', function() {

    pushOptions({
      locale: 'fr'
    })

    describe('with default buttonIcons', function() {

      it('should contain default text values', function() {
        initCalendar()

        // will contain icons, so will contain no text
        expect($('.fc-next-button')).toHaveText('')
        expect($('.fc-nextYear-button')).toHaveText('')
        expect($('.fc-prev-button')).toHaveText('')
        expect($('.fc-prevYear-button')).toHaveText('')

        expect($('.fc-today-button')).toHaveText('Aujourd\'hui')
        expect($('.fc-month-button')).toHaveText('Mois')
        expect($('.fc-dayGridWeek-button')).toHaveText('Semaine')
        expect($('.fc-week-button')).toHaveText('Semaine')
        expect($('.fc-dayGridDay-button')).toHaveText('Jour')
        expect($('.fc-day-button')).toHaveText('Jour')
      })

      it('should contain specified text values', function() {
        initCalendar({
          buttonText: {
            prev: '<-',
            next: '->',
            prevYear: '<--',
            nextYear: '-->',
            today: 'tidei',
            month: 'mun',
            week: 'wiki',
            day: 'dei'
          }
        })

        expect($('.fc-next-button')).toHaveText('->')
        expect($('.fc-nextYear-button')).toHaveText('-->')
        expect($('.fc-prev-button')).toHaveText('<-')
        expect($('.fc-prevYear-button')).toHaveText('<--')

        expect($('.fc-today-button')).toHaveText('tidei')
        expect($('.fc-month-button')).toHaveText('mun')
        expect($('.fc-day-button')).toHaveText('dei')
        expect($('.fc-week-button')).toHaveText('wiki')
        expect($('.fc-dayGridDay-button')).toHaveText('dei')
        expect($('.fc-dayGridWeek-button')).toHaveText('wiki')
      })

    })

    describe('with buttonIcons turned off', function() {

      pushOptions({
        buttonIcons: false
      })

      it('should contain default text values', function() {
        initCalendar()

        // will have the locale's actual text now
        expect($('.fc-next-button')).toHaveText('Suivant')
        expect($('.fc-prev-button')).toHaveText('Précédent')
        /// / locales files don't have data for prev/next *year*
        // expect($('.fc-nextYear-button')).toHaveText('Suivant');
        // expect($('.fc-prevYear-button')).toHaveText('Précédent');

        expect($('.fc-today-button')).toHaveText('Aujourd\'hui')
        expect($('.fc-month-button')).toHaveText('Mois')
        expect($('.fc-dayGridWeek-button')).toHaveText('Semaine')
        expect($('.fc-week-button')).toHaveText('Semaine')
        expect($('.fc-dayGridDay-button')).toHaveText('Jour')
        expect($('.fc-day-button')).toHaveText('Jour')
      })

      it('should contain specified text values', function() {
        initCalendar({
          buttonText: {
            prev: '<-',
            next: '->',
            prevYear: '<--',
            nextYear: '-->',
            today: 'tidei',
            month: 'mun',
            week: 'wiki',
            day: 'dei'
          }
        })

        expect($('.fc-next-button')).toHaveText('->')
        expect($('.fc-nextYear-button')).toHaveText('-->')
        expect($('.fc-prev-button')).toHaveText('<-')
        expect($('.fc-prevYear-button')).toHaveText('<--')

        expect($('.fc-today-button')).toHaveText('tidei')
        expect($('.fc-month-button')).toHaveText('mun')
        expect($('.fc-day-button')).toHaveText('dei')
        expect($('.fc-week-button')).toHaveText('wiki')
        expect($('.fc-dayGridDay-button')).toHaveText('dei')
        expect($('.fc-dayGridWeek-button')).toHaveText('wiki')
      })

    })

  })

})
