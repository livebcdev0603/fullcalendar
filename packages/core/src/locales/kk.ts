import { LocaleInput } from '../main'

export default {
  code: 'kk',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: 'Алдыңғы',
    next: 'Келесі',
    today: 'Бүгін',
    month: 'Ай',
    week: 'Апта',
    day: 'Күн',
    list: 'Күн тәртібі',
  },
  weekText: 'Не',
  allDayText: 'Күні бойы',
  moreLinkText(n) {
    return '+ тағы ' + n
  },
  noEventsText: 'Көрсету үшін оқиғалар жоқ',
} as LocaleInput
