import * as FullCalendar from 'fullcalendar';

FullCalendar.locale("nn", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: "Førre",
    next: "Neste",
    today: "I dag",
    month: "Månad",
    week: "Veke",
    day: "Dag",
    list: "Agenda"
  },
  allDayText: "Heile dagen",
  eventLimitText: "til",
  noEventsMessage: "Ingen hendelser å vise"
});
