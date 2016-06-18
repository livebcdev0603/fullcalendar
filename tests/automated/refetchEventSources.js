ddescribe('refetchEventSources', function() {
	var calendarEl;
	var options;

	// used by createEventGenerator
	var eventCount;
	var fetchId;

	beforeEach(function() {
		affix('#cal');
		calendarEl = $('#cal');
		eventCount = 1;
		fetchId = 7;
		options = {
			now: '2015-08-07',
			defaultView: 'agendaWeek',
			eventSources: [
				{
					events: createEventGenerator('source1-'),
					color: 'green'
				},
				{
					events: createEventGenerator('source2-'),
					color: 'blue'
				},
				{
					events: createEventGenerator('source3-'),
					rendering: 'background',
					color: 'green'
				}
			]
		};
	});

	describe('with a single event source passed in', function() {
		it('only refetches events for the specified event source', function(done) {
			calendarEl.fullCalendar(options);

			expect($('.source1-7').length).toEqual(1);
			expect($('.source2-7').length).toEqual(1);
			expect($('.source3-7').length).toEqual(1);

			var allEventSources = calendarEl.fullCalendar('getEventSources');
			var blueEventSource = $.grep(allEventSources, function(eventSource) {
				return eventSource.color === 'blue';
			})[0];

			// increase the number of events for the refetched source
			eventCount = 2;
			fetchId = 8;

			calendarEl.fullCalendar('refetchEventSources', blueEventSource);

			// events from unaffected sources remain
			expect($('.source1-7').length).toEqual(1);
			expect($('.source3-7').length).toEqual(1);

			// events from old fetch were cleared
			expect($('.source2-7').length).toEqual(0);

			// events from new fetch were rendered
			expect($('.source2-8').length).toEqual(2);

			done();
		});
	});

	describe('with an array of multiple event sources passed in', function() {
		it('only refetches events for the specified event sources', function(done) {
			calendarEl.fullCalendar(options);

			expect($('.source1-7').length).toEqual(1);
			expect($('.source2-7').length).toEqual(1);
			expect($('.source3-7').length).toEqual(1);

			var allEventSources = calendarEl.fullCalendar('getEventSources');
			var greenEventSources = $.grep(allEventSources, function(eventSource) {
				return eventSource.color === 'green';
			});

			// increase the number of events for the refetched sources
			eventCount = 2;
			fetchId = 8;

			calendarEl.fullCalendar('refetchEventSources', greenEventSources);

			// events from unaffected sources remain
			expect($('.source2-7').length).toEqual(1);

			// events from old fetch were cleared
			expect($('.source1-7').length).toEqual(0);
			expect($('.source3-7').length).toEqual(0);

			// events from new fetch were rendered
			expect($('.source1-8').length).toEqual(2);
			expect($('.source3-8').length).toEqual(2);

			done();
		});
	});

	function createEventGenerator(classNamePrefix) {
		return function(start, end, timezone, callback) {
			var events = [];

			for (var i = 0; i < eventCount; i++) {
				events.push({
					start: '2015-08-07T02:00:00',
					end: '2015-08-07T03:00:00',
					className: classNamePrefix + fetchId,
					title: classNamePrefix // also make it the title
				});
			}

			callback(events);
		};
	}
});