
/* An abstract class from which other views inherit from
----------------------------------------------------------------------------------------------------------------------*/

var View = FC.View = InteractiveDateComponent.extend({

	type: null, // subclass' view name (string)
	name: null, // deprecated. use `type` instead
	title: null, // the text that will be displayed in the header's title

	calendar: null, // owner Calendar object
	viewSpec: null,
	options: null, // hash containing all options. already merged with view-specific-options

	queuedScroll: null,

	isSelected: false, // boolean whether a range of time is user-selected or not
	selectedEventInstance: null,

	eventOrderSpecs: null, // criteria for ordering events when they have same date/time

	// for date utils, computed from options
	isHiddenDayHash: null,

	// now indicator
	isNowIndicatorRendered: null,
	initialNowDate: null, // result first getNow call
	initialNowQueriedMs: null, // ms time the getNow was called
	nowIndicatorTimeoutID: null, // for refresh timing of now indicator
	nowIndicatorIntervalID: null, // "

	renderedEventSegs: null,


	constructor: function(calendar, viewSpec) {
		this.calendar = calendar;
		this.viewSpec = viewSpec;

		// shortcuts
		this.type = viewSpec.type;
		this.options = viewSpec.options;

		// .name is deprecated
		this.name = this.type;

		InteractiveDateComponent.call(this);

		this.initHiddenDays();
		this.eventOrderSpecs = parseFieldSpecs(this.opt('eventOrder'));

		// legacy
		if (this.initialize) {
			this.initialize();
		}

		this.on('after:events:render', this.onAfterEventsRender);
	},


	_getView: function() {
		return this;
	},


	// Retrieves an option with the given name
	opt: function(name) {
		return this.options[name];
	},


	/* Title and Date Formatting
	------------------------------------------------------------------------------------------------------------------*/


	// Computes what the title at the top of the calendar should be for this view
	computeTitle: function(dateProfile) {
		var unzonedRange;

		// for views that span a large unit of time, show the proper interval, ignoring stray days before and after
		if (/^(year|month)$/.test(dateProfile.currentRangeUnit)) {
			unzonedRange = dateProfile.currentUnzonedRange;
		}
		else { // for day units or smaller, use the actual day range
			unzonedRange = dateProfile.activeUnzonedRange;
		}

		return this.formatRange(
			{
				start: this.calendar.msToMoment(unzonedRange.startMs, dateProfile.isRangeAllDay),
				end: this.calendar.msToMoment(unzonedRange.endMs, dateProfile.isRangeAllDay)
			},
			dateProfile.isRangeAllDay,
			this.opt('titleFormat') || this.computeTitleFormat(dateProfile),
			this.opt('titleRangeSeparator')
		);
	},


	// Generates the format string that should be used to generate the title for the current date range.
	// Attempts to compute the most appropriate format if not explicitly specified with `titleFormat`.
	computeTitleFormat: function(dateProfile) {
		var currentRangeUnit = dateProfile.currentRangeUnit;

		if (currentRangeUnit == 'year') {
			return 'YYYY';
		}
		else if (currentRangeUnit == 'month') {
			return this.opt('monthYearFormat'); // like "September 2014"
		}
		else if (this.currentRangeAs('days') > 1) {
			return 'll'; // multi-day range. shorter, like "Sep 9 - 10 2014"
		}
		else {
			return 'LL'; // one day. longer, like "September 9 2014"
		}
	},


	// Element
	// -----------------------------------------------------------------------------------------------------------------


	setElement: function(el) {
		var _this = this;

		InteractiveDateComponent.prototype.setElement.apply(this, arguments);

		// TODO: not best place for this
		// TODO: better way of forwarding options from calendar -> view
		this.calendar.optionsModel.watch('viewRawBusinessHours' + this.uid, [ 'businessHours' ], function(deps) {
			_this.set('rawBusinessHours', deps.businessHours);
		}, function() {
			_this.unset('rawBusinessHours');
		});
	},


	removeElement: function() {
		this.calendar.optionsModel.unwatch('viewRawBusinessHours' + this.uid);

		InteractiveDateComponent.prototype.removeElement.apply(this, arguments);
	},


	// Date Setting/Unsetting
	// -----------------------------------------------------------------------------------------------------------------


	setDate: function(date) {
		var currentDateProfile = this.get('dateProfile');
		var newDateProfile = this.buildDateProfile(date, null, true); // forceToValid=true

		if (
			!currentDateProfile ||
			!currentDateProfile.activeUnzonedRange.equals(newDateProfile.activeUnzonedRange)
		) {
			this.set('dateProfile', newDateProfile);
		}
	},


	unsetDate: function() {
		this.unset('dateProfile');
	},


	// Event Data
	// -----------------------------------------------------------------------------------------------------------------


	// returns an EventInstanceDataSource
	requestEvents: function(dateProfile) {
		var calendar = this.calendar;
		var forceAllDay = dateProfile.isRangeAllDay && !this.usesMinMaxTime;

		return calendar.requestEvents(
			calendar.msToMoment(dateProfile.activeUnzonedRange.startMs, forceAllDay),
			calendar.msToMoment(dateProfile.activeUnzonedRange.endMs, forceAllDay)
		);
	},


	// Date High-level Rendering
	// -----------------------------------------------------------------------------------------------------------------


	// if dateProfile not specified, uses current
	executeDateRender: function(dateProfile) {
		DateComponent.prototype.executeDateRender.apply(this, arguments);

		if (this.render) {
			this.render(); // TODO: deprecate
		}

		this.addScroll({ isDateInit: true });
		this.startNowIndicator(); // shouldn't render yet because updateSize will be called soon
	},


	executeDateUnrender: function() {
		if (this.isDatesRendered) {
			this.unselect();
			this.stopNowIndicator();

			if (this.destroy) {
				this.destroy(); // TODO: deprecate
			}
		}

		DateComponent.prototype.executeDateUnrender.apply(this, arguments);
	},


	// Misc view rendering utils
	// -----------------------------------------------------------------------------------------------------------------


	// Binds DOM handlers to elements that reside outside the view container, such as the document
	bindGlobalHandlers: function() {
		InteractiveDateComponent.prototype.bindGlobalHandlers.apply(this, arguments);

		this.listenTo(GlobalEmitter.get(), {
			touchstart: this.processUnselect,
			mousedown: this.handleDocumentMousedown
		});
	},


	// Unbinds DOM handlers from elements that reside outside the view container
	unbindGlobalHandlers: function() {
		InteractiveDateComponent.prototype.unbindGlobalHandlers.apply(this, arguments);

		this.stopListeningTo(GlobalEmitter.get());
	},


	/* Now Indicator
	------------------------------------------------------------------------------------------------------------------*/


	// Immediately render the current time indicator and begins re-rendering it at an interval,
	// which is defined by this.getNowIndicatorUnit().
	// TODO: somehow do this for the current whole day's background too
	startNowIndicator: function() {
		var _this = this;
		var unit;
		var update;
		var delay; // ms wait value

		if (this.opt('nowIndicator')) {
			unit = this.getNowIndicatorUnit();
			if (unit) {
				update = proxy(this, 'updateNowIndicator'); // bind to `this`

				this.initialNowDate = this.calendar.getNow();
				this.initialNowQueriedMs = +new Date();

				// wait until the beginning of the next interval
				delay = this.initialNowDate.clone().startOf(unit).add(1, unit) - this.initialNowDate;
				this.nowIndicatorTimeoutID = setTimeout(function() {
					_this.nowIndicatorTimeoutID = null;
					update();
					delay = +moment.duration(1, unit);
					delay = Math.max(100, delay); // prevent too frequent
					_this.nowIndicatorIntervalID = setInterval(update, delay); // update every interval
				}, delay);
			}

			// rendering will be initiated in updateSize
		}
	},


	// rerenders the now indicator, computing the new current time from the amount of time that has passed
	// since the initial getNow call.
	updateNowIndicator: function() {
		if (this.nowIndicatorTimeoutID) { // activated?
			this.unrenderNowIndicator(); // won't unrender if unnecessary
			this.renderNowIndicator(
				this.initialNowDate.clone().add(new Date() - this.initialNowQueriedMs) // add ms
			);
			this.isNowIndicatorRendered = true;
		}
	},


	// Immediately unrenders the view's current time indicator and stops any re-rendering timers.
	// Won't cause side effects if indicator isn't rendered.
	stopNowIndicator: function() {
		if (this.isNowIndicatorRendered) {

			if (this.nowIndicatorTimeoutID) {
				clearTimeout(this.nowIndicatorTimeoutID);
				this.nowIndicatorTimeoutID = null;
			}
			if (this.nowIndicatorIntervalID) {
				clearTimeout(this.nowIndicatorIntervalID);
				this.nowIndicatorIntervalID = null;
			}

			this.unrenderNowIndicator();
			this.isNowIndicatorRendered = false;
		}
	},


	/* Dimensions
	------------------------------------------------------------------------------------------------------------------*/


	updateSize: function(totalHeight, isAuto, isResize) {

		if (this.setHeight) { // for legacy API
			this.setHeight(totalHeight, isAuto);
		}
		else {
			InteractiveDateComponent.prototype.updateSize.apply(this, arguments);
		}

		this.updateNowIndicator();
	},


	/* Scroller
	------------------------------------------------------------------------------------------------------------------*/


	addScroll: function(scroll) {
		var queuedScroll = this.queuedScroll || (this.queuedScroll = {});

		if (!queuedScroll.isLocked) {
			$.extend(queuedScroll, scroll);
		}
	},


	popScroll: function() {
		this.applyQueuedScroll();
		this.queuedScroll = null;
	},


	applyQueuedScroll: function() {
		if (this.queuedScroll) {
			this.applyScroll(this.queuedScroll);
		}
	},


	queryScroll: function() {
		var scroll = {};

		if (this.isDatesRendered) {
			$.extend(scroll, this.queryDateScroll());
		}

		return scroll;
	},


	applyScroll: function(scroll) {
		if (scroll.isDateInit && !scroll.isLocked && this.isDatesRendered) {
			$.extend(scroll, this.computeInitialDateScroll());
		}

		if (this.isDatesRendered) {
			this.applyDateScroll(scroll);
		}
	},


	computeInitialDateScroll: function() {
		return {}; // subclasses must implement
	},


	queryDateScroll: function() {
		return {}; // subclasses must implement
	},


	applyDateScroll: function(scroll) {
		; // subclasses must implement
	},


	/* Event Drag-n-Drop
	------------------------------------------------------------------------------------------------------------------*/


	reportEventDrop: function(eventInstance, eventMutation, el, ev) {
		var eventManager = this.calendar.eventManager;
		var undoFunc = eventManager.mutateEventsWithId(
			eventInstance.def.id,
			eventMutation,
			this.calendar
		);
		var dateMutation = eventMutation.dateMutation;

		// update the EventInstance, for handlers
		if (dateMutation) {
			eventInstance.dateProfile = dateMutation.buildNewDateProfile(
				eventInstance.dateProfile,
				this.calendar
			);
		}

		this.triggerEventDrop(
			eventInstance,
			// a drop doesn't necessarily mean a date mutation (ex: resource change)
			(dateMutation && dateMutation.dateDelta) || moment.duration(),
			undoFunc,
			el, ev
		);
	},


	// Triggers event-drop handlers that have subscribed via the API
	triggerEventDrop: function(eventInstance, dateDelta, undoFunc, el, ev) {
		this.publiclyTrigger('eventDrop', {
			context: el[0],
			args: [
				eventInstance.toLegacy(),
				dateDelta,
				undoFunc,
				ev,
				{}, // {} = jqui dummy
				this
			]
		});
	},


	/* External Element Drag-n-Drop
	------------------------------------------------------------------------------------------------------------------*/


	// Must be called when an external element, via jQuery UI, has been dropped onto the calendar.
	// `meta` is the parsed data that has been embedded into the dragging event.
	// `dropLocation` is an object that contains the new zoned start/end/allDay values for the event.
	reportExternalDrop: function(singleEventDef, isEvent, isSticky, el, ev, ui) {

		if (isEvent) {
			this.calendar.eventManager.addEventDef(singleEventDef, isSticky);
		}

		this.triggerExternalDrop(singleEventDef, isEvent, el, ev, ui);
	},


	// Triggers external-drop handlers that have subscribed via the API
	triggerExternalDrop: function(singleEventDef, isEvent, el, ev, ui) {

		// trigger 'drop' regardless of whether element represents an event
		this.publiclyTrigger('drop', {
			context: el[0],
			args: [
				singleEventDef.dateProfile.start.clone(),
				ev,
				ui,
				this
			]
		});

		if (isEvent) {
			// signal an external event landed
			this.publiclyTrigger('eventReceive', {
				context: this,
				args: [
					singleEventDef.buildInstance().toLegacy(),
					this
				]
			});
		}
	},


	/* Event Resizing
	------------------------------------------------------------------------------------------------------------------*/


	// Must be called when an event in the view has been resized to a new length
	reportEventResize: function(eventInstance, eventMutation, el, ev) {
		var eventManager = this.calendar.eventManager;
		var undoFunc = eventManager.mutateEventsWithId(
			eventInstance.def.id,
			eventMutation,
			this.calendar
		);

		// update the EventInstance, for handlers
		eventInstance.dateProfile = eventMutation.dateMutation.buildNewDateProfile(
			eventInstance.dateProfile,
			this.calendar
		);

		this.triggerEventResize(
			eventInstance,
			eventMutation.dateMutation.endDelta,
			undoFunc,
			el, ev
		);
	},


	// Triggers event-resize handlers that have subscribed via the API
	triggerEventResize: function(eventInstance, durationDelta, undoFunc, el, ev) {
		this.publiclyTrigger('eventResize', {
			context: el[0],
			args: [
				eventInstance.toLegacy(),
				durationDelta,
				undoFunc,
				ev,
				{}, // {} = jqui dummy
				this
			]
		});
	},


	/* Selection (time range)
	------------------------------------------------------------------------------------------------------------------*/


	// Selects a date span on the view. `start` and `end` are both Moments.
	// `ev` is the native mouse event that begin the interaction.
	select: function(footprint, ev) {
		this.unselect(ev);
		this.renderSelectionFootprint(footprint);
		this.reportSelection(footprint, ev);
	},


	renderSelectionFootprint: function(footprint, ev) {
		if (this.renderSelection) { // legacy method in custom view classes
			this.renderSelection(
				footprint.toLegacy(this.calendar)
			);
		}
		else {
			InteractiveDateComponent.prototype.renderSelectionFootprint.apply(this, arguments);
		}
	},


	// Called when a new selection is made. Updates internal state and triggers handlers.
	reportSelection: function(footprint, ev) {
		this.isSelected = true;
		this.triggerSelect(footprint, ev);
	},


	// Triggers handlers to 'select'
	triggerSelect: function(footprint, ev) {
		var dateProfile = this.calendar.footprintToDateProfile(footprint); // abuse of "Event"DateProfile?

		this.publiclyTrigger('select', {
			context: this,
			args: [
				dateProfile.start,
				dateProfile.end,
				ev,
				this
			]
		});
	},


	// Undoes a selection. updates in the internal state and triggers handlers.
	// `ev` is the native mouse event that began the interaction.
	unselect: function(ev) {
		if (this.isSelected) {
			this.isSelected = false;
			if (this.destroySelection) {
				this.destroySelection(); // TODO: deprecate
			}
			this.unrenderSelection();
			this.publiclyTrigger('unselect', {
				context: this,
				args: [ ev, this ]
			});
		}
	},


	/* Event Selection
	------------------------------------------------------------------------------------------------------------------*/


	selectEventInstance: function(eventInstance) {
		if (
			!this.selectedEventInstance ||
			this.selectedEventInstance !== eventInstance
		) {
			this.unselectEventInstance();

			this.getRecursiveEventSegs().forEach(function(seg) {
				if (
					seg.footprint.eventInstance === eventInstance &&
					seg.el // necessary?
				) {
					seg.el.addClass('fc-selected');
				}
			});

			this.selectedEventInstance = eventInstance;
		}
	},


	unselectEventInstance: function() {
		if (this.selectedEventInstance) {

			this.getRecursiveEventSegs().forEach(function(seg) {
				if (seg.el) { // necessary?
					seg.el.removeClass('fc-selected');
				}
			});

			this.selectedEventInstance = null;
		}
	},


	isEventDefSelected: function(eventDef) {
		// event references might change on refetchEvents(), while selectedEventInstance doesn't,
		// so compare IDs
		return this.selectedEventInstance && this.selectedEventInstance.def.id === eventDef.id;
	},


	/* Mouse / Touch Unselecting (time range & event unselection)
	------------------------------------------------------------------------------------------------------------------*/
	// TODO: move consistently to down/start or up/end?
	// TODO: don't kill previous selection if touch scrolling


	handleDocumentMousedown: function(ev) {
		if (isPrimaryMouseButton(ev)) {
			this.processUnselect(ev);
		}
	},


	processUnselect: function(ev) {
		this.processRangeUnselect(ev);
		this.processEventUnselect(ev);
	},


	processRangeUnselect: function(ev) {
		var ignore;

		// is there a time-range selection?
		if (this.isSelected && this.opt('unselectAuto')) {
			// only unselect if the clicked element is not identical to or inside of an 'unselectCancel' element
			ignore = this.opt('unselectCancel');
			if (!ignore || !$(ev.target).closest(ignore).length) {
				this.unselect(ev);
			}
		}
	},


	processEventUnselect: function(ev) {
		if (this.selectedEventInstance) {
			if (!$(ev.target).closest('.fc-selected').length) {
				this.unselectEventInstance();
			}
		}
	},


	/* Triggers
	------------------------------------------------------------------------------------------------------------------*/


	onAfterEventsRender: function(segs) {
		var notYetQueued = !this.renderedEventSegs;
		var renderedEventSegs = notYetQueued ? (this.renderedEventSegs = []) : this.renderedEventSegs;

		renderedEventSegs.push.apply(renderedEventSegs, segs); // append

		if (notYetQueued) {
			this.whenSizeUpdated(this.triggerEventsRendered);
		}
	},


	triggerBaseRendered: function() {
		this.publiclyTrigger('viewRender', {
			context: this,
			args: [ this, this.el ]
		});
	},


	triggerBaseUnrendered: function() {
		this.publiclyTrigger('viewDestroy', {
			context: this,
			args: [ this, this.el ]
		});
	},


	triggerEventsRendered: function() {
		var _this = this;
		var renderedEventSegs = this.renderedEventSegs;

		this.renderedEventSegs = null;

		// an optimization, because getEventLegacy is expensive
		if (this.hasPublicHandlers('eventAfterRender')) {
			renderedEventSegs.forEach(function(seg) {
				var legacy;

				if (seg.el) { // necessary?
					legacy = seg.footprint.getEventLegacy();

					_this.publiclyTrigger('eventAfterRender', {
						context: legacy,
						args: [ legacy, seg.el, _this ]
					});
				}
			});
		}

		if (this.needsEventAfterAllRender) {
			delete this.needsEventAfterAllRender;

			this.publiclyTrigger('eventAfterAllRender', {
				context: this,
				args: [ this ]
			});
		}
	},


	// Triggers handlers to 'dayClick'
	// Span has start/end of the clicked area. Only the start is useful.
	triggerDayClick: function(footprint, dayEl, ev) {
		var dateProfile = this.calendar.footprintToDateProfile(footprint); // abuse of "Event"DateProfile?

		this.publiclyTrigger('dayClick', {
			context: dayEl,
			args: [ dateProfile.start, ev, this ]
		});
	}

});


View.watch('title', [ 'dateProfile' ], function(deps) {
	return (this.title = this.computeTitle(deps.dateProfile)); // assign to View for legacy reasons
});


View.watch('legacyDateProps', [ 'dateProfile' ], function(deps) {
	var calendar = this.calendar;
	var dateProfile = deps.dateProfile;

	// DEPRECATED, but we need to keep it updated...
	this.start = calendar.msToMoment(dateProfile.activeUnzonedRange.startMs, dateProfile.isRangeAllDay);
	this.end = calendar.msToMoment(dateProfile.activeUnzonedRange.endMs, dateProfile.isRangeAllDay);
	this.intervalStart = calendar.msToMoment(dateProfile.currentUnzonedRange.startMs, dateProfile.isRangeAllDay);
	this.intervalEnd = calendar.msToMoment(dateProfile.currentUnzonedRange.endMs, dateProfile.isRangeAllDay);
});


View.watch('displayingBase', [ 'dateProfile' ], function(deps) {
	// consider the base rendered when it has received the date profile and an updateSize
	// (which happens after the rendering queue is drained) has happened.
	// it's hard to track when every subcomponent has rendered their dates.
	this.whenSizeUpdated(this.triggerBaseRendered);
}, function() {
	// as soon as the view looses it's dateComponent, we know it will soon after unrender its dates.
	this.triggerBaseUnrendered();
});


View.watch('reportingEventsResolved', [ 'eventDataSource' ], function(deps) {
	var eventDataSource = deps.eventDataSource;

	if (eventDataSource.isResolved) {
		this.reportEventsResolved();
	}

	this.listenTo(eventDataSource, 'resolved', this.reportEventsResolved);
}, function(deps) {
	this.stopListeningTo(deps.eventDataSource, 'resolved', this.reportEventsResolved);
});


View.prototype.reportEventsResolved = function() {
	this.set('eventsResolvedId', Math.random());
};


View.watch('displayingBaseEvents', [ 'displayingBase', 'eventsResolvedId' ], function() {
	this.needsEventAfterAllRender = true;
	this.onAfterEventsRender([]);
});


// responsible for populating data that DateComponent relies on


View.watch('businessHourGenerator', [ 'rawBusinessHours' ], function(deps) {
	return new BusinessHourGenerator(
		deps.rawBusinessHours,
		this.calendar // TODO: untangle
	);
});


View.watch('eventDataSource', [ 'dateProfile' ], function(deps) {
	return this.requestEvents(deps.dateProfile);
});
