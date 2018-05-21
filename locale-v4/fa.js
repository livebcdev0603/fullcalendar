import * as FullCalendar from 'fullcalendar';

FullCalendar.locale("fa", {
  week: {
    dow: 6, // Saturday is the first day of the week.
    doy: 12 // The week that contains Jan 1st is the first week of the year.
  },
  isRTL: true,
  buttonText: {
    prev: "قبلی",
    nex: "بعدی",
    today: "امروز",
    month: "ماه",
    week: "هفته",
    day: "روز",
    list: "برنامه"
  },
  allDayText: "تمام روز",
  eventLimitText: function(n) {
    return "بیش از " + n;
  },
  noEventsMessage: "هیچ رویدادی به نمایش"
});
