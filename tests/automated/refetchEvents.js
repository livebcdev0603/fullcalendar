describe('refetchEvents', function() {
	describe('when agenda events are rerendered', function() {
		beforeEach(function() {
			affix('#cal');
		});

		it('keeps scroll after refetchEvents', function(done) {
			var renderCalls = 0;

			$('#cal').fullCalendar({
				now: '2015-08-07',
				scrollTime: '00:00',
				height: 400, // makes this test more consistent across viewports
				defaultView: 'agendaDay',
				events: function(start, end, timezone, callback) {
					setTimeout(function() {
						callback([
							{ id: '1', resourceId: 'b', start: '2015-08-07T02:00:00', end: '2015-08-07T07:00:00', title: 'event 1' },
							{ id: '2', resourceId: 'c', start: '2015-08-07T05:00:00', end: '2015-08-07T22:00:00', title: 'event 2' },
							{ id: '3', resourceId: 'd', start: '2015-08-06', end: '2015-08-08', title: 'event 3' },
							{ id: '4', resourceId: 'e', start: '2015-08-07T03:00:00', end: '2015-08-07T08:00:00', title: 'event 4' },
							{ id: '5', resourceId: 'f', start: '2015-08-07T00:30:00', end: '2015-08-07T02:30:00', title: 'event 5' }
						]);
					}, 100);
				},
				eventAfterAllRender: function() {
					var scrollEl = $('.fc-time-grid-container.fc-scroller');
					renderCalls++;
					if (renderCalls == 1) {
						setTimeout(function() {
							scrollEl.scrollTop(100);
							setTimeout(function() {
								$('#cal').fullCalendar('refetchEvents');
							}, 100);
						}, 100);
					}
					else if (renderCalls == 2) {
						expect(scrollEl.scrollTop()).toBe(100);
						done();
					}
				}
			});
		});
	});

	describe('when there are multiple event sources', function() {
		var options;
		var count;
		var currentCalendar;

		beforeEach(function() {
			affix('#cal');
			currentCalendar = $('#cal');
			options = {
				now: '2015-08-07',
				defaultView: 'agendaWeek',
				eventSources: [
					{
						events: createEvents(1),
						color: 'green',
						id: 'source1'
					},
					{
						events: createEvents(2),
						color: 'blue',
						id: 'source2'
					},
					{
						events: createEvents(3),
						color: 'red',
						id: 'source3'
					}
				]
			};
		});

		describe('and all events are fetched synchronously', function() {
			it('all events are immediately updated', function(done) {
				count = 0;
				currentCalendar.fullCalendar(options);
				count++;
				currentCalendar.fullCalendar('refetchEvents');
				checkAllEvents();
				done();
			});
		});

		describe('and one event source is asynchronous', function() {
			it('original events remain on the calendar until all events have been refetched', function(done) {
				count = 0;
				options.eventSources[0].events = createEvents(1, 100); // set a 100ms timeout on this event source
				options.eventAfterAllRender = function() {
					count++;
					if (count === 1) {
						// after the initial rendering of events, call refetchEvents
						currentCalendar.fullCalendar('refetchEvents');

						expect($('.fetch0').length).toEqual(3); // original events still on the calendar
						expect($('.fetch1').length).toEqual(0); // new events not yet refetched

						setTimeout(function() {
							checkAllEvents();
							done();
						}, 100);
					}
				};

				currentCalendar.fullCalendar(options);
			});
		});

		function createEvents(id, delay) {
			return function(start, end, timezone, callback) {
				var events = [
					{ id: 1, start: '2015-08-07T02:00:00', end: '2015-08-07T03:00:00', title: 'event A', className: 'fetch' + count }
				];

				if (delay) {
					setTimeout(function() {
						callback(events);
					}, delay);
				}
				else {
					callback(events);
				}
			};
		}

		// Checks to make sure all refetched events have been rendered
		function checkAllEvents() {
			expect($('.fetch0').length).toEqual(0);
			expect($('.fetch1').length).toEqual(3);
		}
	});
});
