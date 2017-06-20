
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


	contains: function(innerFootprint) {
		return (this.startMs === null || (innerFootprint.startMs !== null && innerFootprint.startMs >= this.startMs)) &&
			(this.endMs === null || (innerFootprint.endMs !== null && innerFootprint.endMs <= this.endMs));
	},


	intersectsWith: function(otherFootprint) {
		return (this.endMs === null || otherFootprint.startMs === null || this.endMs > otherFootprint.startMS) &&
			(this.startMs === null || otherFootprint.endMs === null || this.startMs < otherFootprint.endMs);
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
	}

});


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
