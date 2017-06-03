
var EventDefDateMutation = Class.extend({

	clearEnd: false,
	forceTimed: false,
	forceAllDay: false,
	dateDelta: null,
	startDelta: null,
	endDelta: null,


	/*
	eventDef assumed to be a SingleEventDef.
	returns an undo function.
	*/
	mutateSingle: function(eventDef) {

		var calendar = eventDef.source.calendar;
		var origStart = eventDef.start;
		var origEnd = eventDef.end;
		var start = origStart.clone();
		var end = null;
		var shouldRezone = false;

		if (!this.clearEnd && origEnd) {
			end = origEnd.clone();
		}

		if (this.forceTimed) {
			shouldRezone = true;

			if (!start.hasTime()) {
				start.time(0);
			}

			if (end && !end.hasTime()) {
				end.time(0);
			}
		}
		else if (this.forceAllDay) {

			if (start.hasTime()) {
				start.stripTime();
			}

			if (end && end.hasTime()) {
				end.stripTime();
			}
		}

		if (this.dateDelta) {
			shouldRezone = true;

			start.add(this.dateDelta);

			if (end) {
				end.add(this.dateDelta);
			}
		}

		// do this before adding startDelta to start, so we can work off of start
		if (this.endDelta) {
			shouldRezone = true;

			if (!end) {
				end = calendar.getDefaultEventEnd(eventDef.isAllDay(), start);
			}

			end.add(this.endDelta);
		}

		if (this.startDelta) {
			shouldRezone = true;

			start.add(this.startDelta);
		}

		// TODO: make more DRY
		if (shouldRezone) {
			if (calendar.opt('timezone') === 'UTC') {
				start.utc();
				if (end) {
					end.utc();
				}
			}
			else if (calendar.opt('timezone') === 'local') {
				start.local();
				if (end) {
					end.local();
				}
			}
			else {
				start.stripZone();
				if (end) {
					end.stripZone();
				}
			}
		}

		// TODO: okay to access calendar option?
		if (!end && calendar.opt('forceEventDuration')) {
			end = calendar.getDefaultEventEnd(eventDef.isAllDay(), start);
		}

		eventDef.start = start;
		eventDef.end = end;

		return function() {
			eventDef.start = origStart;
			eventDef.end = origEnd;
		};
	},


	isEmpty: function() {
		return !this.clearEnd &&
			!this.forceTimed &&
			!this.forceAllDay &&
			(!this.dateDelta || !this.dateDelta.valueOf()) &&
			(!this.startDelta || !this.startDelta.valueOf()) &&
			(!this.endDelta || !this.endDelta.valueOf());
	}

});


EventDefDateMutation.createFromDiff = function(dateProfile0, dateProfile1, largeUnit) {
	var clearEnd = dateProfile0.end && !dateProfile1.end;
	var forceTimed = dateProfile0.isAllDay() && !dateProfile1.isAllDay();
	var forceAllDay = !dateProfile0.isAllDay() && dateProfile1.isAllDay();
	var dateDelta;
	var endDiff;
	var endDelta;
	var mutation;

	// subtracts the dates in the appropriate way, returning a duration
	function subtractDates(date1, date0) { // date1 - date0
		if (largeUnit) {
			return diffByUnit(date1, date0, largeUnit); // poorly named
		}
		else if (dateProfile1.isAllDay()) {
			return diffDay(date1, date0); // poorly named
		}
		else {
			return diffDayTime(date1, date0); // poorly named
		}
	}

	dateDelta = subtractDates(dateProfile1.start, dateProfile0.start);

	if (dateProfile1.end) {
		endDiff = subtractDates(dateProfile1.end, dateProfile0.getEnd());
		endDelta = endDiff.subtract(dateDelta);
	}

	mutation = new EventDefDateMutation();
	mutation.clearEnd = clearEnd;
	mutation.forceTimed = forceTimed;
	mutation.forceAllDay = forceAllDay;
	mutation.dateDelta = dateDelta;
	mutation.endDelta = endDelta;

	return mutation;
};
