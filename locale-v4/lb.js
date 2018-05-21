import * as FullCalendar from 'fullcalendar';

FullCalendar.locale("lb", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: "Zréck",
    next: "Weider",
    today: "Haut",
    month: "Mount",
    week: "Woch",
    day: "Dag",
    list: "Terminiwwersiicht"
  },
  allDayText: "Ganzen Dag",
  eventLimitText: "méi",
  noEventsMessage: "Nee Evenementer ze affichéieren"
});
