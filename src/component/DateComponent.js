
var DateComponent = FC.DateComponent = Component.extend({

	uid: null,
	childrenByUid: null,
	isRTL: false, // frequently accessed options
	nextDayThreshold: null, // "

	eventRendererClass: null,
	helperRendererClass: null,
	businessHourRendererClass: null,
	fillRendererClass: null,

	eventRenderer: null,
	helperRenderer: null,
	businessHourRenderer: null,
	fillRenderer: null,

	hitsNeededDepth: 0, // necessary because multiple callers might need the same hits

	hasAllDayBusinessHours: false, // TODO: unify with largeUnit and isTimeScale?

	dateMessageAggregator: null,
	eventMessageAggregator: null,


	constructor: function() {
		Component.call(this);

		this.uid = String(DateComponent.guid++);
		this.childrenByUid = [];

		this.nextDayThreshold = moment.duration(this.opt('nextDayThreshold'));
		this.isRTL = this.opt('isRTL');

		if (this.fillRendererClass) {
			this.fillRenderer = new this.fillRendererClass(this);
		}

		if (this.eventRendererClass) { // fillRenderer is optional -----v
			this.eventRenderer = new this.eventRendererClass(this, this.fillRenderer);
		}

		if (this.helperRendererClass && this.eventRenderer) {
			this.helperRenderer = new this.helperRendererClass(this, this.eventRenderer);
		}

		if (this.businessHourRendererClass && this.fillRenderer) {
			this.businessHourRenderer = new this.businessHourRendererClass(this, this.fillRenderer);
		}
	},


	addChild: function(child) {
		if (!this.childrenByUid[child.uid]) {
			this.childrenByUid[child.uid] = child;
		}
	},


	removeChild: function(child) {
		if (this.childrenByUid[child.uid]) {
			delete this.childrenByUid[child.uid];
		}
	},


	removeChildren: function() { // all
		var children = Object.values(this.childrenByUid); // because childrenByUid will mutate while iterating
		var i;

		// aggregators can only do one at a time
		for (i = 0; i < children.length; i++) {
			this.removeChild(children[i]);
		}
	},


	requestRender: function(method, args, namespace, actionType) {
		var _this = this;

		this._getView().calendar.renderQueue.queue(function() {
			method.apply(_this, args);
		}, this.uid, namespace, actionType);
	},


	afterSizing: function(method, args) {
		var _this = this;

		this._getView().calendar.afterSizing(function() {
			method.apply(_this, args);
		});
	},


	startBatchRender: function() {
		this._getView().calendar.startBatchRender();
	},


	stopBatchRender: function() {
		this._getView().calendar.stopBatchRender();
	},


	updateSize: function(totalHeight, isAuto, isResize) {
		this.callChildren('updateSize', arguments);
	},


	// Options
	// -----------------------------------------------------------------------------------------------------------------


	opt: function(name) {
		return this._getView().opt(name); // default implementation
	},


	publiclyTrigger: function(/**/) {
		var calendar = this._getCalendar();

		return calendar.publiclyTrigger.apply(calendar, arguments);
	},


	hasPublicHandlers: function(/**/) {
		var calendar = this._getCalendar();

		return calendar.hasPublicHandlers.apply(calendar, arguments);
	},


	// Date
	// -----------------------------------------------------------------------------------------------------------------


	handleDateProfileSet: function(dateProfile) {
		this.setDateProfileInChildren(dateProfile);
	},


	handleDateProfileUnset: function() {
		this.unsetDateProfileInChildren();
	},


	setDateProfileInChildren: function(dateProfile) {
		this.setInChildren('dateProfile', dateProfile);
	},


	unsetDateProfileInChildren: function() {
		this.unsetInChildren('dateProfile');
	},


	executeDateRender: function(dateProfile, skipScroll) { // wrapper
		this.renderDates(dateProfile);
		this.trigger('after:date:render');
		this.isDatesRendered = true;
	},


	executeDateUnrender: function() { // wrapper
		this.trigger('before:date:unrender');
		this.unrenderDates();
		this.isDatesRendered = false;
	},


	// date-cell content only
	renderDates: function(dateProfile) {
		// subclasses should implement
	},


	// date-cell content only
	unrenderDates: function() {
		// subclasses should override
	},


	// Now-Indicator
	// -----------------------------------------------------------------------------------------------------------------


	// Returns a string unit, like 'second' or 'minute' that defined how often the current time indicator
	// should be refreshed. If something falsy is returned, no time indicator is rendered at all.
	getNowIndicatorUnit: function() {
		// subclasses should implement
	},


	// Renders a current time indicator at the given datetime
	renderNowIndicator: function(date) {
		this.callChildren('renderNowIndicator', arguments);
	},


	// Undoes the rendering actions from renderNowIndicator
	unrenderNowIndicator: function() {
		this.callChildren('unrenderNowIndicator', arguments);
	},


	// Business Hours
	// ---------------------------------------------------------------------------------------------------------------


	setBusinessHoursInChildren: function(businessHours) {
		this.setInChildren('businessHours', businessHours);
	},


	unsetBusinessHoursInChildren: function() {
		this.unsetInChildren('businessHours');
	},


	// Renders business-hours onto the view. Assumes updateSize has already been called.
	renderBusinessHours: function(businessHourPayload) {
		var unzonedRange = this.get('dateProfile').activeUnzonedRange;
		var eventInstanceGroup = businessHourPayload[this.hasAllDayBusinessHours ? 'allDay' : 'timed'];
		var eventFootprints;

		if (eventInstanceGroup) {
			eventFootprints = this.eventRangesToEventFootprints(
				eventInstanceGroup.sliceRenderRanges(unzonedRange)
			);
		}
		else {
			eventFootprints = [];
		}

		this.renderBusinessHourEventFootprints(eventFootprints);
	},


	renderBusinessHourEventFootprints: function(eventFootprints) {
		if (this.businessHourRenderer) {
			this.businessHourRenderer.renderEventFootprints(eventFootprints);
		}
	},


	// Unrenders previously-rendered business-hours
	unrenderBusinessHours: function() {
		if (this.businessHourRenderer) {
			this.businessHourRenderer.unrender();
		}
	},


	// Events
	// -----------------------------------------------------------------------------------------------------------------


	// initial handling (to be called by initial data receipt)


	setEvents: function(eventsPayload) {
		this.set('currentEvents', eventsPayload);
		this.set('hasEvents', true);
		this.setEventsInChildren(eventsPayload);
	},


	unsetEvents: function() {
		this.unset('hasEvents');
		this.unset('currentEvents');
		this.unsetEventsInChildren();
	},


	// dynamic handling (to be called by post-binding updates)


	resetEvents: function(eventsPayload) {
		this.startBatchRender();
		this.unsetEvents();
		this.setEvents(eventsPayload);
		this.stopBatchRender();
	},


	addOrUpdateEvent: function(id, eventInstanceGroup) {
		var currentEvents = this.get('currentEvents');

		currentEvents[id] = eventInstanceGroup;
		this.set('currentEvents', currentEvents);
		this.addOrUpdateEventInChildren(id, eventInstanceGroup);

		if (this.has('displayingEvents')) {
			this.requestRender(this.renderEventAddOrUpdate, arguments, 'event', 'add');
		}
	},


	removeEvent: function(id) {
		var currentEvents = this.get('currentEvents');

		if (id in currentEvents) {
			delete currentEvents[id];
			this.set('currentEvents', currentEvents);
			this.removeEventInChildren(id);
		}

		if (this.has('displayingEvents')) {
			this.requestRender(this.renderEventRemove, arguments, 'event', 'remove');
		}
	},


	// for children


	setEventsInChildren: function(eventsPayload) {
		this.callChildren('setEvents', arguments);
	},


	unsetEventsInChildren: function() {
		this.callChildren('unsetEvents', arguments);
	},


	addOrUpdateEventInChildren: function(id, eventInstanceGroup) {
		this.callChildren('addOrUpdateEvent', arguments);
	},


	removeEventInChildren: function(id) {
		this.callChildren('removeEvent', arguments);
	},


	// rendering


	executeEventsRender: function(eventsPayload) { // wrapper
		this.renderEventsPayload(eventsPayload);
		this.trigger('eventRender');
	},


	executeEventsUnrender: function() { // wrapper
		this.trigger('before:eventUnrender');
		this.unrenderEvents();
	},


	// TODO: eventually rename to `renderEvents` once legacy is gone.
	renderEventsPayload: function(eventsPayload) {
		var dateProfile = this.get('dateProfile');
		var id, eventInstanceGroup;
		var eventRenderRanges;
		var eventFootprints;
		var bgFootprints = [];
		var fgFootprints = [];

		for (id in eventsPayload) {
			eventInstanceGroup = eventsPayload[id];
			eventRenderRanges = eventInstanceGroup.sliceRenderRanges(dateProfile.activeUnzonedRange);
			eventFootprints = this.eventRangesToEventFootprints(eventRenderRanges);

			if (eventInstanceGroup.getEventDef().hasBgRendering()) {
				bgFootprints.push.apply(bgFootprints, eventFootprints);
			}
			else {
				fgFootprints.push.apply(fgFootprints, eventFootprints);
			}
		}

		this.renderBgEventFootprints(bgFootprints);
		this.renderFgEventFootprints(fgFootprints);
	},


	// Unrenders all events currently rendered on the grid
	unrenderEvents: function() {

		this.unrenderFgEventFootprints();
		this.unrenderBgEventFootprints();

		// we DON'T need to call updateHeight() because
		// a renderEventsPayload() call always happens after this, which will eventually call updateHeight()
	},


	renderEventAddOrUpdate: function(id, eventInstanceGroup) {
		// by default, rerender all
		this.unrenderEvents();
		this.renderEventsPayload(this.get('currentEvents'));
	},


	renderEventRemove: function() {
		// by default, rerender all
		this.unrenderEvents();
		this.renderEventsPayload(this.get('currentEvents'));
	},


	// fg & bg delegation
	// NOTE: parents should never call these
	// TODO: make EventRenderer responsible for routing FG vs BG?


	renderFgEventFootprints: function(eventFootprints) {
		if (this.eventRenderer) {
			this.eventRenderer.renderFgFootprints(eventFootprints);
		}
	},


	renderBgEventFootprints: function(eventFootprints) {
		if (this.eventRenderer) {
			this.eventRenderer.renderBgFootprints(eventFootprints);
		}
	},


	// Removes event elements from the view.
	unrenderFgEventFootprints: function() {
		if (this.eventRenderer) {
			this.eventRenderer.unrenderFgFootprints();
		}
	},


	// Removes event elements from the view.
	unrenderBgEventFootprints: function() {
		if (this.eventRenderer) {
			this.eventRenderer.unrenderBgFootprints();
		}
	},


	// Retrieves all segment objects that are rendered in the view
	getEventSegs: function() {
		var segs = this.eventRenderer ? this.eventRenderer.getSegs() : [];
		var childrenByUid = this.childrenByUid;
		var uid;

		for (uid in childrenByUid) {
			segs.push.apply( // append
				segs,
				childrenByUid[uid].getEventSegs()
			);
		}

		return segs;
	},


	// Drag-n-Drop Rendering (for both events and external elements)
	// ---------------------------------------------------------------------------------------------------------------


	// Renders a visual indication of a event or external-element drag over the given drop zone.
	// If an external-element, seg will be `null`.
	// Must return elements used for any mock events.
	renderDrag: function(eventFootprints, seg, isTouch) {
		var childrenByUid = this.childrenByUid;
		var uid;
		var renderedHelper = false;

		for (uid in childrenByUid) {
			if (childrenByUid[uid].renderDrag(eventFootprints, seg, isTouch)) {
				renderedHelper = true;
			}
		}

		return renderedHelper;
	},


	// Unrenders a visual indication of an event or external-element being dragged.
	unrenderDrag: function() {
		this.callChildren('unrenderDrag', arguments);
	},


	// Event Resizing
	// ---------------------------------------------------------------------------------------------------------------


	// Renders a visual indication of an event being resized.
	renderEventResize: function(eventFootprints, seg, isTouch) {
		// subclasses must implement
	},


	// Unrenders a visual indication of an event being resized.
	unrenderEventResize: function() {
		// subclasses must implement
	},


	// Selection
	// ---------------------------------------------------------------------------------------------------------------


	// Renders a visual indication of the selection
	// TODO: rename to `renderSelection` after legacy is gone
	renderSelectionFootprint: function(componentFootprint) {
		this.renderHighlight(componentFootprint);

		this.callChildren('renderSelectionFootprint', arguments);
	},


	// Unrenders a visual indication of selection
	unrenderSelection: function() {
		this.unrenderHighlight();

		this.callChildren('unrenderSelection', arguments);
	},


	// Highlight
	// ---------------------------------------------------------------------------------------------------------------


	// Renders an emphasis on the given date range. Given a span (unzoned start/end and other misc data)
	renderHighlight: function(componentFootprint) {
		if (this.fillRenderer) {
			this.fillRenderer.renderFootprint(
				'highlight',
				componentFootprint,
				{
					getClasses: function() {
						return [ 'fc-highlight' ];
					}
				}
			);
		}

		this.callChildren('renderHighlight', arguments);
	},


	// Unrenders the emphasis on a date range
	unrenderHighlight: function() {
		if (this.fillRenderer) {
			this.fillRenderer.unrender('highlight');
		}

		this.callChildren('unrenderHighlight', arguments);
	},


	// Hit Areas
	// ---------------------------------------------------------------------------------------------------------------
	// just because all DateComponents support this interface
	// doesn't mean they need to have their own internal coord system. they can defer to sub-components.


	hitsNeeded: function() {
		if (!(this.hitsNeededDepth++)) {
			this.prepareHits();
		}

		this.callChildren('hitsNeeded', arguments);
	},


	hitsNotNeeded: function() {
		if (this.hitsNeededDepth && !(--this.hitsNeededDepth)) {
			this.releaseHits();
		}

		this.callChildren('hitsNotNeeded', arguments);
	},


	prepareHits: function() {
		// subclasses can implement
	},


	releaseHits: function() {
		// subclasses can implement
	},


	// Given coordinates from the topleft of the document, return data about the date-related area underneath.
	// Can return an object with arbitrary properties (although top/right/left/bottom are encouraged).
	// Must have a `grid` property, a reference to this current grid. TODO: avoid this
	// The returned object will be processed by getHitFootprint and getHitEl.
	queryHit: function(leftOffset, topOffset) {
		var childrenByUid = this.childrenByUid;
		var uid;
		var hit;

		for (uid in childrenByUid) {
			hit = childrenByUid[uid].queryHit(leftOffset, topOffset);

			if (hit) {
				break;
			}
		}

		return hit;
	},


	getSafeHitFootprint: function(hit) {
		var dateProfile = this.get('dateProfile');
		var footprint = this.getHitFootprint(hit);

		if (!dateProfile.activeUnzonedRange.containsRange(footprint.unzonedRange)) {
			return null;
		}

		return footprint;
	},


	getHitFootprint: function(hit) {
	},


	// Given position-level information about a date-related area within the grid,
	// should return a jQuery element that best represents it. passed to dayClick callback.
	getHitEl: function(hit) {
	},


	/* Converting eventRange -> eventFootprint
	------------------------------------------------------------------------------------------------------------------*/


	eventRangesToEventFootprints: function(eventRanges) {
		var eventFootprints = [];
		var i;

		for (i = 0; i < eventRanges.length; i++) {
			eventFootprints.push.apply(eventFootprints,
				this.eventRangeToEventFootprints(eventRanges[i])
			);
		}

		return eventFootprints;
	},


	// Given an event's unzoned date range, return an array of eventSpan objects.
	// eventSpan - { start, end, isStart, isEnd, otherthings... }
	// Subclasses can override.
	// Subclasses are obligated to forward eventRange.isStart/isEnd to the resulting spans.
	// TODO: somehow more DRY with Calendar::eventRangeToEventFootprints
	eventRangeToEventFootprints: function(eventRange) {
		return [
			new EventFootprint(
				new ComponentFootprint(
					eventRange.unzonedRange,
					eventRange.eventDef.isAllDay()
				),
				eventRange.eventDef,
				eventRange.eventInstance // might not exist
			)
		];
	},


	/* Converting componentFootprint/eventFootprint -> segs
	------------------------------------------------------------------------------------------------------------------*/


	eventFootprintsToSegs: function(eventFootprints) {
		var segs = [];
		var i;

		for (i = 0; i < eventFootprints.length; i++) {
			segs.push.apply(segs,
				this.eventFootprintToSegs(eventFootprints[i])
			);
		}

		return segs;
	},


	// Given an event's span (unzoned start/end and other misc data), and the event itself,
	// slices into segments and attaches event-derived properties to them.
	// eventSpan - { start, end, isStart, isEnd, otherthings... }
	// constraintRange allow additional clipping. optional. eventually remove this.
	eventFootprintToSegs: function(eventFootprint, constraintRange) {
		var unzonedRange = eventFootprint.componentFootprint.unzonedRange;
		var segs;
		var i, seg;

		if (constraintRange) {
			unzonedRange = unzonedRange.intersect(constraintRange);
		}

		segs = this.componentFootprintToSegs(eventFootprint.componentFootprint);

		for (i = 0; i < segs.length; i++) {
			seg = segs[i];

			if (!unzonedRange.isStart) {
				seg.isStart = false;
			}
			if (!unzonedRange.isEnd) {
				seg.isEnd = false;
			}

			seg.footprint = eventFootprint;
			// TODO: rename to seg.eventFootprint
		}

		return segs;
	},


	componentFootprintToSegs: function(componentFootprint) {
		return [];
	},


	// Utils
	// ---------------------------------------------------------------------------------------------------------------


	callChildren: function(methodName, args) {
		var childrenByUid = this.childrenByUid;
		var uid;

		for (uid in childrenByUid) {
			childrenByUid[uid][methodName].apply(childrenByUid[uid], args);
		}
	},


	setInChildren: function(propName, propValue) {
		var childrenByUid = this.childrenByUid;
		var uid;

		for (uid in childrenByUid) {
			childrenByUid[uid].set(propName, propValue);
		}
	},


	unsetInChildren: function(propName) {
		var childrenByUid = this.childrenByUid;
		var uid;

		for (uid in childrenByUid) {
			childrenByUid[uid].unset(propName);
		}
	},


	_getCalendar: function() { // TODO: strip out. move to generic parent.
		return this.calendar || this.view.calendar;
	},


	_getView: function() { // TODO: strip out. move to generic parent.
		return this.view;
	}

});


DateComponent.guid = 0; // TODO: better system for this?


DateComponent.watch('handleDateProfile', [ 'dateProfile' ], function(deps) {
	this.handleDateProfileSet(deps.dateProfile);
}, function() {
	this.handleDateProfileUnset();
});


DateComponent.watch('businessHoursInChildren', [ 'businessHours' ], function(deps) {
	this.setBusinessHoursInChildren(deps.businessHours);
}, function() {
	this.unsetBusinessHoursInChildren();
});


DateComponent.watch('displayingDates', [ 'dateProfile' ], function(deps) {
	this.requestRender(this.executeDateRender, [ deps.dateProfile ], 'date', 'init');
}, function() {
	this.requestRender(this.executeDateUnrender, null, 'date', 'destroy');
});


DateComponent.watch('displayingBusinessHours', [ 'displayingDates', 'businessHours' ], function(deps) {
	this.requestRender(this.renderBusinessHours, [ deps.businessHours ], 'businessHours', 'init');
}, function() {
	this.requestRender(this.unrenderBusinessHours, null, 'businessHours', 'destroy');
});


DateComponent.watch('displayingEvents', [ 'displayingDates', 'hasEvents' ], function() {
	// pass currentEvents in case there were event mutations after initialEvents
	this.requestRender(this.executeEventsRender, [ this.get('currentEvents') ], 'event', 'init');
}, function() {
	this.requestRender(this.executeEventsUnrender, null, 'event', 'destroy');
});
