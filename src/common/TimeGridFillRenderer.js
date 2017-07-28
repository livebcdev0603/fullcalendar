
var TimeGridFillRenderer = FillRenderer.extend({

	timeGrid: null,


	constructor: function(timeGrid) {
		FillRenderer.call(this);

		this.timeGrid = timeGrid;
	},


	attachSegEls: function(type, segs) {
		var timeGrid = this.timeGrid;
		var containerEls;

		// TODO: more efficient lookup
		if (type === 'bgEvents') {
			containerEls = timeGrid.bgContainerEls;
		}
		else if (type === 'businessHours') {
			containerEls = timeGrid.businessContainerEls;
		}
		else if (type === 'highlight') {
			containerEls = timeGrid.highlightContainerEls;
		}

		timeGrid.updateSegVerticals(segs);
		timeGrid.attachSegsByCol(timeGrid.groupSegsByCol(segs), containerEls);

		return segs.map(function(seg) {
			return seg.el[0];
		});
	}

});
