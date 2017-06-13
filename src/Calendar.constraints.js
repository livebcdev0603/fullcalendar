
Calendar.prototype.isEventInstanceGroupAllowed = function(eventInstanceGroup) {
	var eventDef = eventInstanceGroup.getEventDef();
	var eventFootprints = this.eventRangesToEventFootprints(eventInstanceGroup.getAllEventRanges());
	var i;

	var peerEventInstances = this.eventManager.getEventInstancesWithoutId(eventDef.id);
	var peerEventRanges = eventInstancesToEventRanges(peerEventInstances);
	var peerEventFootprints = this.eventRangesToEventFootprints(peerEventRanges);

	var constraintVal = eventDef.getConstraint();
	var overlapVal = eventDef.getOverlap();

	var eventAllowFunc = this.opt('eventAllow');

	for (i = 0; i < eventFootprints.length; i++) {
		if (
			!this.isFootprintAllowed(
				eventFootprints[i].componentFootprint,
				peerEventFootprints,
				constraintVal,
				overlapVal,
				eventFootprints[i].eventInstance
			)
		) {
			return false;
		}
	}

	if (eventAllowFunc) {
		for (i = 0; i < eventFootprints.length; i++) {
			if (
				eventAllowFunc(
					convertFootprintToLegacySelection(eventFootprints[i].componentFootprint, this),
					eventFootprints[i].toLegacy()
				) === false
			) {
				return false;
			}
		}
	}

	return true;
};


Calendar.prototype.isSelectionFootprintAllowed = function(componentFootprint) {
	var peerEventInstances = this.eventManager.getEventInstances();
	var peerEventRanges = eventInstancesToEventRanges(peerEventInstances);
	var peerEventFootprints = this.eventRangesToEventFootprints(peerEventRanges);

	var selectAllowFunc;

	if (
		this.isFootprintAllowed(
			componentFootprint,
			peerEventFootprints,
			this.opt('selectConstraint'),
			this.opt('selectOverlap')
		)
	) {
		selectAllowFunc = this.opt('selectAllow');

		if (selectAllowFunc) {
			return selectAllowFunc(componentFootprint.toLegacy()) !== false;
		}
		else {
			return true;
		}
	}

	return false;
};


Calendar.prototype.isFootprintAllowed = function(
	componentFootprint,
	peerEventFootprints,
	constraintVal,
	overlapVal,
	subjectEventInstance // optional
) {
	var constraintFootprints; // ComponentFootprint[]
	var overlapEventFootprints; // EventFootprint[]

	if (constraintVal != null) {
		constraintFootprints = this.constraintValToFootprints(constraintVal, componentFootprint.isAllDay);

		if (!this.isFootprintWithinConstraints(componentFootprint, constraintFootprints)) {
			return false;
		}
	}

	overlapEventFootprints = this.collectOverlapEventFootprints(peerEventFootprints, componentFootprint);

	if (overlapVal === false) {
		if (overlapEventFootprints.length) {
			return false;
		}
	}
	else if (typeof overlapVal === 'function') {
		if (!isOverlapsAllowedByFunc(overlapEventFootprints, overlapVal, subjectEventInstance)) {
			return false;
		}
	}

	if (subjectEventInstance) {
		if (!isOverlapEventInstancesAllowed(overlapEventFootprints, subjectEventInstance)) {
			return false;
		}
	}

	return true;
};


// Constraint
// ------------------------------------------------------------------------------------------------


Calendar.prototype.isFootprintWithinConstraints = function(componentFootprint, constraintFootprints) {
	var i;

	for (i = 0; i < constraintFootprints.length; i++) {
		if (this.footprintContainsFootprint(constraintFootprints[i], componentFootprint)) {
			return true;
		}
	}

	return false;
};


Calendar.prototype.constraintValToFootprints = function(constraintVal, isAllDay) {
	var eventInstanceGroup;
	var eventRanges = [];

	if (constraintVal === 'businessHours') {
		eventInstanceGroup = this.buildCurrentBusinessInstanceGroup(isAllDay);

		if (eventInstanceGroup) {
			eventRanges = eventInstanceGroup.getAllEventRanges();
		}
	}
	else if (typeof constraintVal === 'object') {
		eventRanges = this.parseEventDefToEventRanges(constraintVal);
	}
	else if (constraintVal != null) { // an ID
		eventRanges = eventInstancesToEventRanges(
			this.eventManager.getEventInstancesWithId(constraintVal)
		);
	}

	return eventFootprintsToComponentFootprints(
		this.eventRangesToEventFootprints(eventRanges)
	);
};


// Overlap
// ------------------------------------------------------------------------------------------------


Calendar.prototype.collectOverlapEventFootprints = function(peerEventFootprints, targetFootprint) {
	var overlapEventFootprints = [];
	var i;

	for (i = 0; i < peerEventFootprints.length; i++) {
		if (
			this.footprintsIntersect(
				targetFootprint,
				peerEventFootprints[i].componentFootprint
			)
		) {
			overlapEventFootprints.push(peerEventFootprints[i]);
		}
	}

	return overlapEventFootprints;
};


// optional subjectEventInstance
function isOverlapsAllowedByFunc(overlapEventFootprints, overlapFunc, subjectEventInstance) {
	var i;

	for (i = 0; i < overlapEventFootprints.length; i++) {
		if (
			!overlapFunc(
				overlapEventFootprints[i].eventInstance.toLegacy(),
				subjectEventInstance ? subjectEventInstance.toLegacy() : null
			)
		) {
			return false;
		}
	}

	return true;
}


function isOverlapEventInstancesAllowed(overlapEventFootprints, subjectEventInstance) {
	var i;
	var overlapEventInstance;
	var overlapEventDef;
	var overlapVal;

	for (i = 0; i < overlapEventFootprints.length; i++) {
		overlapEventInstance = overlapEventFootprints[i].eventInstance;
		overlapEventDef = overlapEventInstance.def;

		// don't need to pass in calendar, because don't want to consider global eventOverlap property,
		// because we already considered that earlier in the process.
		overlapVal = overlapEventDef.getOverlap();

		if (overlapVal === false) {
			return false;
		}
		else if (typeof overlapVal === 'function') {
			if (
				!overlapVal(
					overlapEventInstance.toLegacy(),
					subjectEventInstance.toLegacy()
				)
			) {
				return false;
			}
		}
	}

	return true;
}


// Conversion: eventDefs -> eventInstances -> eventRanges -> eventFootprints -> componentFootprints
// ------------------------------------------------------------------------------------------------
// NOTE: this might seem like repetitive code with the Grid class, however, this code is related to
// constraints whereas the Grid code is related to rendering. Each approach might want to convert
// eventRanges -> eventFootprints in a different way. Regardless, there are opportunities to make
// this more DRY.


Calendar.prototype.parseEventDefToEventRanges = function(eventInput) {
	var eventPeriod = this.eventManager.currentPeriod;
	var eventDef = EventDefParser.parse(eventInput, this.eventManager.stickySource);

	if (eventPeriod && eventDef) {
		return eventInstancesToEventRanges(
			eventDef.buildInstances(eventPeriod.start, eventPeriod.end)
		);
	}
	else {
		return [];
	}
};


Calendar.prototype.eventRangesToEventFootprints = function(eventRanges) {
	var i;
	var eventFootprints = [];

	for (i = 0; i < eventRanges.length; i++) {
		eventFootprints.push.apply(eventFootprints, // append
			this.eventRangeToEventFootprints(eventRanges[i])
		);
	}

	return eventFootprints;
};


Calendar.prototype.eventRangeToEventFootprints = function(eventRange) {
	return [
		new EventFootprint(
			new ComponentFootprint(
				eventRange.unzonedRange,
				eventRange.eventDef.isAllDay()
			),
			eventRange.eventDef,
			eventRange.eventInstance
		)
	];
};


// Footprint Utils
// ----------------------------------------------------------------------------------------


Calendar.prototype.footprintContainsFootprint = function(outerFootprint, innerFootprint) {
	// TODO: use date range utils
	return innerFootprint.unzonedRange.startMs >= outerFootprint.unzonedRange.startMs &&
		innerFootprint.unzonedRange.endMs <= outerFootprint.unzonedRange.endMs;
};


Calendar.prototype.footprintsIntersect = function(footprint0, footprint1) {
	// TODO: use date range utils
	return footprint0.unzonedRange.startMs < footprint1.unzonedRange.endMs &&
		footprint0.unzonedRange.endMs > footprint1.unzonedRange.startMs;
};
