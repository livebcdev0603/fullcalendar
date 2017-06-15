
var EventDef = Class.extend({

	source: null, // required

	id: null, // normalized supplied ID
	rawId: null, // unnormalized supplied ID
	uid: null, // internal ID. new ID for every definition

	title: null,
	url: null,
	rendering: null,
	constraint: null,
	overlap: null,
	editable: null,
	startEditable: null,
	durationEditable: null,
	resourceEditable: null,
	color: null,
	backgroundColor: null,
	borderColor: null,
	textColor: null,

	className: null, // an array. TODO: rename to className*s* (API breakage)
	miscProps: null,


	constructor: function(source) {
		this.uid = String(EventDef.uuid++);
		this.source = source;
		this.className = [];
		this.miscProps = {};
	},


	isAllDay: function() {
		// subclasses must implement
	},


	buildInstances: function(start, end) {
		// subclasses must implement
	},


	clone: function() {
		var copy = new this.constructor(this.source);

		copy.id = this.id;
		copy.rawId = this.rawId;
		copy.uid = this.uid; // not really unique anymore :(

		EventDef.copyVerbatimStandardProps(this, copy);

		copy.className = this.className; // should clone?
		copy.miscProps = $.extend({}, this.miscProps);

		return copy;
	},


	hasInverseRendering: function() {
		return this.getRendering() === 'inverse-background';
	},


	hasBgRendering: function() {
		var rendering = this.getRendering();

		return rendering === 'inverse-background' || rendering === 'background';
	},


	getRendering: function() {
		if (this.rendering != null) {
			return this.rendering;
		}

		return this.source.rendering;
	},


	getConstraint: function() {
		if (this.constraint != null) {
			return this.constraint;
		}

		if (this.source.constraint != null) {
			return this.source.constraint;
		}

		return this.source.calendar.opt('eventConstraint');
	},


	getOverlap: function() {
		if (this.overlap != null) {
			return this.overlap;
		}

		if (this.source.overlap != null) {
			return this.source.overlap;
		}

		return this.source.calendar.opt('eventOverlap');
	},


	toLegacy: function() {
		var obj = $.extend({}, this.miscProps);

		obj._id = this.uid;
		obj.source = this.source;
		obj.className = this.className; // should clone?
		obj.allDay = this.isAllDay();

		if (this.rawId != null) {
			obj.id = this.rawId;
		}

		EventDef.copyVerbatimStandardProps(this, obj);

		return obj;
	},


	// Standard Prop Parsing System, for the INSTANCE
	// -----------------------------------------------------------------------------------------------------------------

	standardPropMap: {}, // ::defineStandardProps will always clone


	/*
	returns false on failure
	*/
	applyRawProps: function(rawProps) {
		var standardPropMap = this.standardPropMap;
		var miscProps = {};
		var propName;

		if (rawProps.id == null) {
			this.id = EventDef.generateId();
		}
		else {
			this.id = EventDef.normalizeId((this.rawId = rawProps.id));
		}

		// can make DRY with EventSource
		if ($.isArray(rawProps.className)) {
			this.className = rawProps.className;
		}
		else if (typeof rawProps.className === 'string') {
			this.className = rawProps.className.split(/\s+/);
		}

		for (propName in rawProps) {
			if (propName in standardPropMap) {
				if (standardPropMap[propName] === true) { // copy verbatim?
					this[propName] = rawProps[propName];
				}
			}
			else {
				miscProps[propName] = rawProps[propName];
			}
		}

		this.miscProps = miscProps;

		return true;
	}

});


// ID
// ---------------------------------------------------------------------------------------------------------------------


EventDef.uuid = 0;


EventDef.normalizeId = function(id) {
	return String(id);
};


EventDef.generateId = function() {
	return '_fc' + (EventDef.uuid++);
};


// Standard Prop *Parsing* System, for class self-definition
// ---------------------------------------------------------------------------------------------------------------------


EventDef.defineStandardProps = function(propDefs) {
	var proto = this.prototype;

	proto.standardPropMap = Object.create(proto.standardPropMap);

	copyOwnProps(propDefs, proto.standardPropMap);
};


EventDef.copyVerbatimStandardProps = function(src, dest) {
	var map = this.prototype.standardPropMap;
	var propName;

	for (propName in map) {
		if (
			src[propName] != null && // in the src object?
			map[propName] === true // false means "copy verbatim"
		) {
			dest[propName] = src[propName];
		}
	}
};


// Parsing
// ---------------------------------------------------------------------------------------------------------------------


EventDef.parse = function(rawInput, source) {
	var def = new this(source);
	var calendarTransform = source.calendar.opt('eventDataTransform');
	var sourceTransform = source.eventDataTransform;

	if (calendarTransform) {
		rawInput = calendarTransform(rawInput);
	}
	if (sourceTransform) {
		rawInput = sourceTransform(rawInput);
	}

	if (def.applyRawProps(rawInput) === false) {
		return false;
	}

	return def;
};


// Definitions for this abstract EventDef class
// ---------------------------------------------------------------------------------------------------------------------


EventDef.defineStandardProps({
	// not automatically assigned (`false`)
	id: false,
	className: false,
	source: false, // will ignored

	// automatically assigned (`true`)
	title: true,
	url: true,
	rendering: true,
	constraint: true,
	overlap: true,
	editable: true,
	startEditable: true,
	durationEditable: true,
	resourceEditable: true,
	color: true,
	backgroundColor: true,
	borderColor: true,
	textColor: true,
});
