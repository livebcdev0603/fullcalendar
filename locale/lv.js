import { defineLocale } from 'fullcalendar';

defineLocale("lv", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: "Iepr.",
    next: "Nāk.",
    today: "Šodien",
    month: "Mēnesis",
    week: "Nedēļa",
    day: "Diena",
    list: "Dienas kārtība"
  },
  weekLabel: "Ned.",
  allDayText: "Visu dienu",
  eventLimitText: function(n) {
    return "+vēl " + n;
  },
  noEventsMessage: "Nav notikumu"
});
