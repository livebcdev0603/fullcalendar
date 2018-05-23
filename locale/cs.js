import { defineLocale } from 'fullcalendar';

defineLocale("cs", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: "Dříve",
    next: "Později",
    today: "Nyní",
    month: "Měsíc",
    week: "Týden",
    day: "Den",
    list: "Agenda"
  },
  weekHeader: "Týd",
  allDayText: "Celý den",
  eventLimitText: function(n) {
    return "+další: " + n;
  },
  noEventsMessage: "Žádné akce k zobrazení"
});
