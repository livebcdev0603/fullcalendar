
View.mixin({

	usesMinMaxTime: false, // whether minTime/maxTime will affect the activeUnzonedRange. Views must opt-in.


	/* Date Range Computation
	------------------------------------------------------------------------------------------------------------------*/


	// Builds a structure with info about what the dates/ranges will be for the "prev" view.
	buildPrevDateProfile: function(currentDateProfile) {
		var prevDate = currentDateProfile.date.clone()
			.startOf(currentDateProfile.currentRangeUnit)
			.subtract(currentDateProfile.dateIncrement);

		return this.buildDateProfile(prevDate, -1);
	},


	// Builds a structure with info about what the dates/ranges will be for the "next" view.
	buildNextDateProfile: function(currentDateProfile) {
		var nextDate = currentDateProfile.date.clone()
			.startOf(currentDateProfile.currentRangeUnit)
			.add(currentDateProfile.dateIncrement);

		return this.buildDateProfile(nextDate, 1);
	},


	// Builds a structure holding dates/ranges for rendering around the given date.
	// Optional direction param indicates whether the date is being incremented/decremented
	// from its previous value. decremented = -1, incremented = 1 (default).
	buildDateProfile: function(date, direction, forceToValid) {
		var isDateAllDay = !date.hasTime();
		var validUnzonedRange;
		var minTime = null;
		var maxTime = null;
		var currentInfo;
		var isRangeAllDay;
		var renderUnzonedRange;
		var activeUnzonedRange;
		var isValid;

		validUnzonedRange = this.buildValidRange();
		validUnzonedRange = this.trimHiddenDays(validUnzonedRange);

		if (forceToValid) {
			date = this.calendar.msToUtcMoment(
				validUnzonedRange.constrainDate(date), // returns MS
				isDateAllDay
			);
		}

		currentInfo = this.buildCurrentRangeInfo(date, direction);
		isRangeAllDay = /^(year|month|week|day)$/.test(currentInfo.unit);
		renderUnzonedRange = this.buildRenderRange(
			this.trimHiddenDays(currentInfo.unzonedRange),
			currentInfo.unit,
			isRangeAllDay
		);
		renderUnzonedRange = this.trimHiddenDays(renderUnzonedRange);
		activeUnzonedRange = renderUnzonedRange.clone();

		if (!this.opt('showNonCurrentDates')) {
			activeUnzonedRange = activeUnzonedRange.intersect(currentInfo.unzonedRange);
		}

		minTime = moment.duration(this.opt('minTime'));
		maxTime = moment.duration(this.opt('maxTime'));
		activeUnzonedRange = this.adjustActiveRange(activeUnzonedRange, minTime, maxTime);
		activeUnzonedRange = activeUnzonedRange.intersect(validUnzonedRange); // might return null

		if (activeUnzonedRange) {
			date = this.calendar.msToUtcMoment(
				activeUnzonedRange.constrainDate(date), // returns MS
				isDateAllDay
			);
		}

		// it's invalid if the originally requested date is not contained,
		// or if the range is completely outside of the valid range.
		isValid = currentInfo.unzonedRange.intersectsWith(validUnzonedRange);

		return {
			// constraint for where prev/next operations can go and where events can be dragged/resized to.
			// an object with optional start and end properties.
			validUnzonedRange: validUnzonedRange,

			// range the view is formally responsible for.
			// for example, a month view might have 1st-31st, excluding padded dates
			currentUnzonedRange: currentInfo.unzonedRange,

			// name of largest unit being displayed, like "month" or "week"
			currentRangeUnit: currentInfo.unit,

			isRangeAllDay: isRangeAllDay,

			// dates that display events and accept drag-n-drop
			// will be `null` if no dates accept events
			activeUnzonedRange: activeUnzonedRange,

			// date range with a rendered skeleton
			// includes not-active days that need some sort of DOM
			renderUnzonedRange: renderUnzonedRange,

			// Duration object that denotes the first visible time of any given day
			minTime: minTime,

			// Duration object that denotes the exclusive visible end time of any given day
			maxTime: maxTime,

			isValid: isValid,

			date: date,

			// how far the current date will move for a prev/next operation
			dateIncrement: this.buildDateIncrement(currentInfo.duration)
				// pass a fallback (might be null) ^
		};
	},


	// Builds an object with optional start/end properties.
	// Indicates the minimum/maximum dates to display.
	// not responsible for trimming hidden days.
	buildValidRange: function() {
		return this.getUnzonedRangeOption('validRange', this.calendar.getNow()) ||
			new UnzonedRange(); // completely open-ended
	},


	// Builds a structure with info about the "current" range, the range that is
	// highlighted as being the current month for example.
	// See buildDateProfile for a description of `direction`.
	// Guaranteed to have `range` and `unit` properties. `duration` is optional.
	// TODO: accept a MS-time instead of a moment `date`?
	buildCurrentRangeInfo: function(date, direction) {
		var duration = null;
		var unit = null;
		var unzonedRange = null;
		var dayCount;

		if (this.viewSpec.duration) {
			duration = this.viewSpec.duration;
			unit = this.viewSpec.durationUnit;
			unzonedRange = this.buildRangeFromDuration(date, direction, duration, unit);
		}
		else if ((dayCount = this.opt('dayCount'))) {
			unit = 'day';
			unzonedRange = this.buildRangeFromDayCount(date, direction, dayCount);
		}
		else if ((unzonedRange = this.buildCustomVisibleRange(date))) {
			unit = computeGreatestUnit(unzonedRange.getStart(), unzonedRange.getEnd());
		}
		else {
			duration = this.getFallbackDuration();
			unit = computeGreatestUnit(duration);
			unzonedRange = this.buildRangeFromDuration(date, direction, duration, unit);
		}

		return { duration: duration, unit: unit, unzonedRange: unzonedRange };
	},


	getFallbackDuration: function() {
		return moment.duration({ days: 1 });
	},


	// Returns a new activeUnzonedRange to have time values (un-ambiguate)
	// minTime or maxTime causes the range to expand.
	adjustActiveRange: function(unzonedRange, minTime, maxTime) {
		var start = unzonedRange.getStart();
		var end = unzonedRange.getEnd();

		if (this.usesMinMaxTime) {

			if (minTime < 0) {
				start.time(0).add(minTime);
			}

			if (maxTime > 24 * 60 * 60 * 1000) { // beyond 24 hours?
				end.time(maxTime - (24 * 60 * 60 * 1000));
			}
		}

		return new UnzonedRange(start, end);
	},


	// Builds the "current" range when it is specified as an explicit duration.
	// `unit` is the already-computed computeGreatestUnit value of duration.
	// TODO: accept a MS-time instead of a moment `date`?
	buildRangeFromDuration: function(date, direction, duration, unit) {
		var alignment = this.opt('dateAlignment');
		var start = date.clone();
		var end;
		var dateIncrementInput;
		var dateIncrementDuration;

		// if the view displays a single day or smaller
		if (duration.as('days') <= 1) {
			if (this.isHiddenDay(start)) {
				start = this.skipHiddenDays(start, direction);
				start.startOf('day');
			}
		}

		// compute what the alignment should be
		if (!alignment) {
			dateIncrementInput = this.opt('dateIncrement');

			if (dateIncrementInput) {
				dateIncrementDuration = moment.duration(dateIncrementInput);

				// use the smaller of the two units
				if (dateIncrementDuration < duration) {
					alignment = computeDurationGreatestUnit(dateIncrementDuration, dateIncrementInput);
				}
				else {
					alignment = unit;
				}
			}
			else {
				alignment = unit;
			}
		}

		start.startOf(alignment);
		end = start.clone().add(duration);

		return new UnzonedRange(start, end);
	},


	// Builds the "current" range when a dayCount is specified.
	// TODO: accept a MS-time instead of a moment `date`?
	buildRangeFromDayCount: function(date, direction, dayCount) {
		var customAlignment = this.opt('dateAlignment');
		var runningCount = 0;
		var start = date.clone();
		var end;

		if (customAlignment) {
			start.startOf(customAlignment);
		}

		start.startOf('day');
		start = this.skipHiddenDays(start, direction);

		end = start.clone();
		do {
			end.add(1, 'day');
			if (!this.isHiddenDay(end)) {
				runningCount++;
			}
		} while (runningCount < dayCount);

		return new UnzonedRange(start, end);
	},


	// Builds a normalized range object for the "visible" range,
	// which is a way to define the currentUnzonedRange and activeUnzonedRange at the same time.
	// TODO: accept a MS-time instead of a moment `date`?
	buildCustomVisibleRange: function(date) {
		var visibleUnzonedRange = this.getUnzonedRangeOption(
			'visibleRange',
			this.calendar.applyTimezone(date) // correct zone. also generates new obj that avoids mutations
		);

		if (visibleUnzonedRange && (visibleUnzonedRange.startMs === null || visibleUnzonedRange.endMs === null)) {
			return null;
		}

		return visibleUnzonedRange;
	},


	// Computes the range that will represent the element/cells for *rendering*,
	// but which may have voided days/times.
	// not responsible for trimming hidden days.
	buildRenderRange: function(currentUnzonedRange, currentRangeUnit, isRangeAllDay) {
		return currentUnzonedRange.clone();
	},


	// Compute the duration value that should be added/substracted to the current date
	// when a prev/next operation happens.
	buildDateIncrement: function(fallback) {
		var dateIncrementInput = this.opt('dateIncrement');
		var customAlignment;

		if (dateIncrementInput) {
			return moment.duration(dateIncrementInput);
		}
		else if ((customAlignment = this.opt('dateAlignment'))) {
			return moment.duration(1, customAlignment);
		}
		else if (fallback) {
			return fallback;
		}
		else {
			return moment.duration({ days: 1 });
		}
	}

});
