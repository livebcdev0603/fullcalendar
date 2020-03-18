
export default {
  code: "sq",
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: "mbrapa",
    next: "Përpara",
    today: "sot",
    month: "Muaj",
    week: "Javë",
    day: "Ditë",
    list: "Listë"
  },
  weekText: "Ja",
  allDayContent: "Gjithë ditën",
  moreLinkText: function(n) {
    return "+më tepër " + n;
  },
  noEventsContent: "Nuk ka evente për të shfaqur"
};
