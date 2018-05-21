import * as FullCalendar from 'fullcalendar';

FullCalendar.locale("sl", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7  // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: "Prejšnji",
    next: "Naslednji",
    today: "Trenutni",
    month: "Mesec",
    week: "Teden",
    day: "Dan",
    list: "Dnevni red"
  },
  allDayText: "Ves dan",
  eventLimitText: "več",
  noEventsMessage: "Ni dogodkov za prikaz"
});
