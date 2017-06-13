
var ComponentFootprint = Class.extend({

	unzonedRange: null,
	isAllDay: false,


	constructor: function(unzonedRange, isAllDay) {
		this.unzonedRange = unzonedRange;
		this.isAllDay = isAllDay;
	},


	toLegacy: function() {
		return this.unzonedRange.getRange();
	}

});


function convertFootprintToLegacySelection(footprint, calendar) {
	var start = calendar.moment(footprint.unzonedRange.startMs);
	var end = calendar.moment(footprint.unzonedRange.endMs);

	if (footprint.isAllDay) {
		start.stripTime();
		end.stripTime();
	}

	return { start: start, end: end };
}
