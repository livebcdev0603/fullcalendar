
var EventFootprint = Class.extend({

	componentFootprint: null,
	eventDef: null,
	eventInstance: null, // optional


	constructor: function(componentFootprint, eventDef, eventInstance) {
		this.componentFootprint = componentFootprint;
		this.eventDef = eventDef;

		if (eventInstance) {
			this.eventInstance = eventInstance;
		}
	},


	toLegacy: function() {
		return (this.eventInstance || this.eventDef).toLegacy();
	}

});
