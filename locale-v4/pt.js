import * as FullCalendar from 'fullcalendar';

FullCalendar.locale("pt", {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prevText: "Anterior",
    nextText: "Seguinte",
    currentText: "Hoje",
    month: "Mês",
    week: "Semana",
    day: "Dia",
    list: "Agenda"
  },
  allDayText: "Todo o dia",
  eventLimitText: "mais",
  noEventsMessage: "Não há eventos para mostrar"
});
