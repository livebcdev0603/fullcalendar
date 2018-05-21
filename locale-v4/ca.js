import * as FullCalendar from 'fullcalendar';

FullCalendar.locale("ca", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: "Anterior",
    next: "Següent",
    today: "Avui",
    month: "Mes",
    week: "Setmana",
    day: "Dia",
    list: "Agenda"
  },
  allDayText: "Tot el dia",
  eventLimitText: "més",
  noEventsMessage: "No hi ha esdeveniments per mostrar"
});
