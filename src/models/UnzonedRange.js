
var UnzonedRange = FC.UnzonedRange = Class.extend({

	startMs: null, // if null, no start constraint
	endMs: null, // if null, no end constraint

	// TODO: move these into footprint.
	// Especially, doesn't make sense for null startMs/endMs.
	isStart: true,
	isEnd: true,

	constructor: function(startInput, endInput) {

		if (moment.isMoment(startInput)) {
			startInput = startInput.clone().stripZone();
		}

		if (moment.isMoment(endInput)) {
			endInput = endInput.clone().stripZone();
		}

		if (startInput) {
			this.startMs = startInput.valueOf();
		}

		if (endInput) {
			this.endMs = endInput.valueOf();
		}
	},

	constrainTo: function(constraintRange) {
		var startMs = this.startMs;
		var endMs = this.endMs;
		var newRange = null;

		if (constraintRange.startMs !== null) {
			if (startMs === null) {
				startMs = constraintRange.startMs;
			}
			else {
				startMs = Math.max(startMs, constraintRange.startMs);
			}
		}

		if (constraintRange.endMs !== null) {
			if (endMs === null) {
				endMs = constraintRange.endMs;
			}
			else {
				endMs = Math.min(this.endMs, constraintRange.endMs);
			}
		}

		if (startMs === null || endMs === null || startMs < endMs) {
			newRange = new UnzonedRange(startMs, endMs);
			newRange.isStart = this.isStart && startMs === this.startMs;
			newRange.isEnd = this.isEnd && endMs === this.endMs;
		}

		return newRange;
	},


	contains: function(innerRange) {
		return (this.startMs === null || (innerRange.startMs !== null && innerRange.startMs >= this.startMs)) &&
			(this.endMs === null || (innerRange.endMs !== null && innerRange.endMs <= this.endMs));
	},


	containsDate: function(mom) { // TODO: rename
		var ms = mom.valueOf();

		return (this.startMs === null || ms >= this.startMs) &&
			(this.endMs === null || ms < this.endMs);
	},


	intersectsWith: function(otherRange) {
		return (this.endMs === null || otherRange.startMs === null || this.endMs > otherRange.startMs) &&
			(this.startMs === null || otherRange.endMs === null || this.startMs < otherRange.endMs);
	},


	equals: function(otherRange) {
		return this.startMs === otherRange.startMs && this.endMs === otherRange.endMs;
	},


	clone: function() {
		return new UnzonedRange(this.startMs, this.endMs);
	},


	// If the given date is not within the given range, move it inside.
	// (If it's past the end, make it one millisecond before the end).
	// expects a UTC or ambig-time/timezone moment, or MS-time.
	// returns a UTC moment.
	constrainDate: function(date) {
		var ms = date.valueOf();

		if (this.startMs !== null && ms < this.startMs) {
			ms = this.startMs;
		}

		if (this.endMs !== null && ms >= this.endMs) {
			ms = this.endMs - 1;
		}

		return FC.moment.utc(ms);
	},


	// hopefully we'll remove these...

	getStart: function() {
		if (this.startMs !== null) {
			return FC.moment.utc(this.startMs).stripZone();
		}
	},

	getEnd: function() {
		if (this.endMs !== null) {
			return FC.moment.utc(this.endMs).stripZone();
		}
	},

	getRange: function() {
		return { start: this.getStart(), end: this.getEnd() };
	},

	getZonedRange: function(calendar, isAllDay) {
		var start = FC.moment.utc(this.startMs);
		var end = FC.moment.utc(this.endMs);

		if (isAllDay) {
			start.stripTime();
			end.stripTime();
		}
		else if (calendar.getIsAmbigTimezone()) {
			start.stripZone();
			end.stripZone();
		}

		start = calendar.moment(start);
		end = calendar.moment(end);

		return { start: start, end: end };
	}

});


function massageMoment(inputDate, calendar, isAllDay) {
	var date = FC.moment.utc(inputDate.valueOf());

	if (isAllDay) {
		date.stripTime();
	}
	else if (calendar.getIsAmbigTimezone()) {
		date.stripZone();
	}

	date = calendar.moment(date);

	return date;
}


/*
SIDEEFFECT: will mutate eventRanges.
Will return a new array result.
Only works for non-open-ended ranges.
*/
function invertUnzonedRanges(ranges, constraintRange) {
	var invertedRanges = [];
	var startMs = constraintRange.startMs; // the end of the previous range. the start of the new range
	var i;
	var dateRange;

	// ranges need to be in order. required for our date-walking algorithm
	ranges.sort(compareUnzonedRanges);

	for (i = 0; i < ranges.length; i++) {
		dateRange = ranges[i];

		// add the span of time before the event (if there is any)
		if (dateRange.startMs > startMs) { // compare millisecond time (skip any ambig logic)
			invertedRanges.push(
				new UnzonedRange(startMs, dateRange.startMs)
			);
		}

		if (dateRange.endMs > startMs) {
			startMs = dateRange.endMs;
		}
	}

	// add the span of time after the last event (if there is any)
	if (startMs < constraintRange.endMs) { // compare millisecond time (skip any ambig logic)
		invertedRanges.push(
			new UnzonedRange(startMs, constraintRange.endMs)
		);
	}

	return invertedRanges;
}


/*
Only works for non-open-ended ranges.
*/
function compareUnzonedRanges(range1, range2) {
	return range1.startMs - range2.startMs; // earlier ranges go first
}
