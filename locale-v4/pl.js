import * as FullCalendar from 'fullcalendar';

FullCalendar.locale("pl", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: "Poprzedni",
    next: "Następny",
    today: "Dziś",
    month: "Miesiąc",
    week: "Tydzień",
    day: "Dzień",
    list: "Plan dnia"
  },
  allDayText: "Cały dzień",
  eventLimitText: "więcej",
  noEventsMessage: "Brak wydarzeń do wyświetlenia"
});
