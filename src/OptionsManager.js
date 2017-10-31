
var OptionsManager = Model.extend({

	_calendar: null, // avoid
	dirDefaults: null, // option defaults related to LTR or RTL
	localeDefaults: null, // option defaults related to current locale
	overrides: null, // option overrides given to the fullCalendar constructor
	dynamicOverrides: null, // options set with dynamic setter method. higher precedence than view overrides.


	constructor: function(_calendar, overrides) {
		Model.call(this); // super

		this._calendar = _calendar;
		this.overrides = $.extend({}, overrides); // make a copy
		this.dynamicOverrides = {};
		this.compute();
	},


	add: function(newOptionHash) { // was setOptions
		var optionCnt = 0;
		var optionName;

		this.recordOverrides(newOptionHash); // will trigger this model's watchers

		for (optionName in newOptionHash) {
			optionCnt++;
		}

		// special-case handling of single option change.
		// if only one option change, `optionName` will be its name.
		if (optionCnt === 1) {
			if (optionName === 'height' || optionName === 'contentHeight' || optionName === 'aspectRatio') {
				this._calendar.updateViewSize(true); // isResize=true
				return;
			}
			else if (optionName === 'defaultDate') {
				return; // can't change date this way. use gotoDate instead
			}
			else if (optionName === 'businessHours') {
				return; // this model already reacts to this
			}
			else if (optionName === 'timezone') {
				this._calendar.view.flash('initialEvents');
				return;
			}
		}

		// catch-all. rerender the header and footer and rebuild/rerender the current view
		this._calendar.renderHeader();
		this._calendar.renderFooter();

		// even non-current views will be affected by this option change. do before rerender
		// TODO: detangle
		this._calendar.viewsByType = {};

		this._calendar.reinitView();
	},


	// Computes the flattened options hash for the calendar and assigns to `this.options`.
	// Assumes this.overrides and this.dynamicOverrides have already been initialized.
	compute: function() {
		var locale, localeDefaults;
		var isRTL, dirDefaults;
		var rawOptions;

		locale = firstDefined( // explicit locale option given?
			this.dynamicOverrides.locale,
			this.overrides.locale
		);
		localeDefaults = localeOptionHash[locale];
		if (!localeDefaults) { // explicit locale option not given or invalid?
			locale = Calendar.defaults.locale;
			localeDefaults = localeOptionHash[locale] || {};
		}

		isRTL = firstDefined( // based on options computed so far, is direction RTL?
			this.dynamicOverrides.isRTL,
			this.overrides.isRTL,
			localeDefaults.isRTL,
			Calendar.defaults.isRTL
		);
		dirDefaults = isRTL ? Calendar.rtlDefaults : {};

		this.dirDefaults = dirDefaults;
		this.localeDefaults = localeDefaults;

		rawOptions = mergeOptions([ // merge defaults and overrides. lowest to highest precedence
			Calendar.defaults, // global defaults
			dirDefaults,
			localeDefaults,
			this.overrides,
			this.dynamicOverrides
		]);
		populateInstanceComputableOptions(rawOptions); // fill in gaps with computed options

		this.reset(rawOptions);
	},


	// stores the new options internally, but does not rerender anything.
	recordOverrides: function(newOptionHash) {
		var optionName;

		for (optionName in newOptionHash) {
			this.dynamicOverrides[optionName] = newOptionHash[optionName];
		}

		this._calendar.viewSpecManager.clearCache(); // the dynamic override invalidates the options in this cache, so just clear it
		this.compute(); // this.options needs to be recomputed after the dynamic override
	}


});
