
/*
Responsible for the scroller, and forwarding event-related actions into the "grid"
*/
var ListView = View.extend({

	grid: null,
	scroller: null,

	initialize: function() {
		this.grid = new ListViewGrid(this);
		this.scroller = new Scroller({
			overflowX: 'hidden',
			overflowY: 'auto'
		});
	},

	setRange: function(range) {
		View.prototype.setRange.call(this, range); // super

		this.grid.setRange(range); // needs to process range-related options
	},

	renderSkeleton: function() {
		this.el.addClass(
			'fc-list-view ' +
			this.widgetContentClass
		);

		this.scroller.render();
		this.scroller.el.appendTo(this.el);

		this.grid.setElement(this.scroller.scrollEl);
	},

	unrenderSkeleton: function() {
		this.scroller.destroy(); // will remove the Grid too
	},

	setHeight: function(totalHeight, isAuto) {
		this.scroller.setHeight(this.computeScrollerHeight(totalHeight));
	},

	computeScrollerHeight: function(totalHeight) {
		return totalHeight -
			subtractInnerElHeight(this.el, this.scroller.el); // everything that's NOT the scroller
	},

	renderEvents: function(events) {
		this.grid.renderEvents(events);
	},

	unrenderEvents: function() {
		this.grid.unrenderEvents();
	},

	isEventResizable: function(event) {
		return false;
	},

	isEventDraggable: function(event) {
		return false;
	}

});

/*
Responsible for event rendering and user-interaction.
Its "el" is the inner-content of the above view's scroller.
*/
var ListViewGrid = Grid.extend({

	segSelector: '.fc-list-item', // which elements accept event actions
	hasDayInteractions: false, // no day selection or day clicking

	// slices by day
	spanToSegs: function(span) {
		var view = this.view;
		var dayStart = view.start.clone();
		var dayEnd;
		var seg;
		var segs = [];

		while (dayStart < view.end) {
			dayEnd = dayStart.clone().add(1, 'day');
			seg = intersectRanges(span, {
				start: dayStart,
				end: dayEnd
			});
			if (seg) {
				segs.push(seg);
			}
			dayStart = dayEnd;
		}

		return segs;
	},

	// like "4:00am"
	computeEventTimeFormat: function() {
		return this.view.opt('mediumTimeFormat');
	},

	// for events with a url, the whole <tr> should be clickable,
	// but it's impossible to wrap with an <a> tag. simulate this.
	handleSegClick: function(seg, ev) {
		var url;

		Grid.prototype.handleSegClick.apply(this, arguments); // super. might prevent the default action

		// not clicking on or within an <a> with an href
		if (!$(ev.target).closest('a[href]').length) {
			url = seg.event.url;
			if (url && !ev.isDefaultPrevented()) { // jsEvent not cancelled in handler
				window.location.href = url; // simulate link click
			}
		}
	},

	// returns list of foreground segs that were actually rendered
	renderFgSegs: function(segs) {
		segs = this.renderFgSegEls(segs); // might filter away hidden events

		if (!segs.length) {
			this.renderEmptyMessage();
			return segs;
		}
		else {
			return this.renderSegList(segs);
		}
	},

	renderEmptyMessage: function() {
		this.el.html(
			'<div class="fc-list-empty-wrap2">' + // TODO: try less wraps
			'<div class="fc-list-empty-wrap1">' +
			'<div class="fc-list-empty">' +
				htmlEscape(this.view.opt('noEventsMessage')) +
			'</div>' +
			'</div>' +
			'</div>'
		);
	},

	// render the event segments in the view. returns the mutated array.
	renderSegList: function(segs) {
		var tableEl = $('<table class="fc-list-table"><tbody/></table>');
		var tbodyEl = tableEl.find('tbody');
		var i, seg;
		var dayDate;

		this.sortEventSegs(segs);

		for (i = 0; i < segs.length; i++) {
			seg = segs[i];

			// append a day header
			if (!dayDate || !seg.start.isSame(dayDate, 'day')) {
				dayDate = seg.start.clone().stripTime();
				tbodyEl.append(this.dayHeaderHtml(dayDate));
			}

			tbodyEl.append(seg.el); // append event row
		}

		this.el.empty().append(tableEl);

		return segs; // return the sorted list
	},

	// generates the HTML for the day headers that live amongst the event rows
	dayHeaderHtml: function(dayDate) {
		var mainFormat = this.view.opt('listDayFormat');
		var altFormat = this.view.opt('listDayAltFormat');

		return '<tr class="fc-list-heading">' +
			'<td class="' + this.view.widgetHeaderClass + '" colspan="3">' +
				(mainFormat ?
					'<span class="fc-list-heading-main">' +
						htmlEscape(dayDate.format(mainFormat)) +
					'</span>' :
					'') +
				(altFormat ?
					'<span class="fc-list-heading-alt">' +
						htmlEscape(dayDate.format(altFormat)) +
					'</span>' :
					'') +
			'</td>' +
		'</tr>';
	},

	// generates the HTML for a single event row
	fgSegHtml: function(seg) {
		var view = this.view;
		var classes = [ 'fc-list-item' ].concat(this.getSegCustomClasses(seg));
		var bgColor = this.getSegBackgroundColor(seg);
		var url = seg.event.url;
		var timeHtml;

		if (!seg.start.hasTime()) {
			timeHtml = view.getAllDayHtml();
		}
		else {
			timeHtml = htmlEscape(this.getEventTimeText(seg));
		}

		if (url) {
			classes.push('fc-has-url');
		}

		return '<tr class="' + classes.join(' ') + '">' +
			(view.opt('listTime') ?
				'<td class="fc-list-item-time ' + view.widgetContentClass + '">' +
					timeHtml +
				'</td>' :
				'') +
			'<td class="fc-list-item-marker ' + view.widgetContentClass + '">' +
				'<span class="fc-event-dot"' +
				(bgColor ?
					' style="background-color:' + bgColor + '"' :
					'') +
				'></span>' +
			'</td>' +
			'<td class="fc-list-item-title ' + view.widgetContentClass + '">' +
				'<a' + (url ? ' href="' + htmlEscape(url) + '"' : '') + '>' +
					htmlEscape(seg.event.title) +
				'</a>' +
			'</td>' +
		'</tr>';
	}

});
