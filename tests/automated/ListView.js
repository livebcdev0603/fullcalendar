describe('ListView rendering', function() {
	var options;

	beforeEach(function() {
		affix('#cal');
		options = {
			defaultView: 'listWeek',
			now: '2016-08-20'
		};
	});

	describe('with all-day events', function() {

		describe('when single-day', function() {
			beforeEach(function() {
				options.events = [
					{
						title: 'event 1',
						start: '2016-08-15'
					},
					{
						title: 'event 2',
						start: '2016-08-17'
					}
				];
			});

			it('renders only days with events', function() {
				$('#cal').fullCalendar(options);

				var days = getDayInfo();
				var events = getEventInfo();

				expect(days.length).toBe(2);
				expect(days[0].date.format()).toEqual('2016-08-15');
				expect(days[1].date.format()).toEqual('2016-08-17');

				expect(events.length).toBe(2);
				expect(events[0].title).toBe('event 1');
				expect(events[0].timeText).toBe('all-day');
				expect(events[1].title).toBe('event 2');
				expect(events[1].timeText).toBe('all-day');
			});

			it('filters events through eventRender', function() {
				options.eventRender = function(event, el) {
					el.find('.fc-event-dot').replaceWith('<span class="custom-icon" />');
				};

				$('#cal').fullCalendar(options);

				expect($('.custom-icon').length).toBe(2);
			});
		});

		describe('when multi-day', function() {
			beforeEach(function() {
				options.events = [
					{
						title: 'event 1',
						start: '2016-08-15',
						end: '2016-08-18' // 3 days
					}
				];
			});

			it('renders all-day for every day', function() {
				$('#cal').fullCalendar(options);

				var events = getEventInfo();

				expect(events.length).toBe(3);
				expect(events[0].title).toBe('event 1');
				expect(events[0].timeText).toBe('all-day');
				expect(events[1].title).toBe('event 1');
				expect(events[1].timeText).toBe('all-day');
				expect(events[2].title).toBe('event 1');
				expect(events[2].timeText).toBe('all-day');
			});
		});
	});

	describe('with timed events', function() {

		describe('when single-day', function() {
			beforeEach(function() {
				options.events = [
					{
						title: 'event 1',
						start: '2016-08-15T07:00'
					},
					{
						title: 'event 2',
						start: '2016-08-17T09:00',
						end: '2016-08-17T11:00'
					}
				];
			});

			it('renders times', function() {
				$('#cal').fullCalendar(options);

				var events = getEventInfo();

				expect(events.length).toBe(2);
				expect(events[0].title).toBe('event 1');
				expect(events[0].timeText).toBe('7:00am');
				expect(events[1].title).toBe('event 2');
				expect(events[1].timeText).toBe('9:00am - 11:00am');
			});

			it('doesn\'t render times when displayEventTime is false', function() {
				options.displayEventTime = false;
				$('#cal').fullCalendar(options);

				var events = getEventInfo();

				expect(events.length).toBe(2);
				expect(events[0].title).toBe('event 1');
				expect(events[0].timeText).toBe('');
				expect(events[1].title).toBe('event 2');
				expect(events[1].timeText).toBe('');
			});

			it('doesn\'t render end times when displayEventEnd is false', function() {
				options.displayEventEnd = false;
				$('#cal').fullCalendar(options);

				var events = getEventInfo();

				expect(events.length).toBe(2);
				expect(events[0].title).toBe('event 1');
				expect(events[0].timeText).toBe('7:00am');
				expect(events[1].title).toBe('event 2');
				expect(events[1].timeText).toBe('9:00am');
			});

			// regression test for when localized event dates get unlocalized and leak into view rendering
			it('renders dates and times in locale', function() {
				options.locale = 'fr';
				$('#cal').fullCalendar(options);

				var days = getDayInfo();
				var events = getEventInfo();

				expect(days.length).toBe(2);
				expect(days[0].date.format()).toEqual('2016-08-15');
				expect(days[0].mainText).toEqual('lundi');
				expect(days[0].altText).toEqual('15 août 2016');
				expect(days[1].date.format()).toEqual('2016-08-17');
				expect(days[1].mainText).toEqual('mercredi');
				expect(days[1].altText).toEqual('17 août 2016');

				expect(events.length).toBe(2);
				expect(events[0].title).toBe('event 1');
				expect(events[0].timeText).toBe('07:00');
				expect(events[1].title).toBe('event 2');
				expect(events[1].timeText).toBe('09:00 - 11:00');
			});
		});

		describe('when multi-day', function() {
			beforeEach(function() {
				options.nextDayThreshold = '00:00';
				options.events = [
					{
						title: 'event 1',
						start: '2016-08-15T07:00',
						end: '2016-08-17T11:00'
					}
				];
			});

			it('renders partial and full days', function() {
				$('#cal').fullCalendar(options);

				var events = getEventInfo();

				expect(events.length).toBe(3);
				expect(events[0].title).toBe('event 1');
				expect(events[0].timeText).toBe('7:00am - 12:00am');
				expect(events[1].title).toBe('event 1');
				expect(events[1].timeText).toBe('all-day');
				expect(events[2].title).toBe('event 1');
				expect(events[2].timeText).toBe('12:00am - 11:00am');
			});
		});

		it('renders same days when equal to nextDayThreshold', function() {
			options.nextDayThreshold = '09:00';
			options.events = [
				{
					title: 'event 1',
					start: '2016-08-15T07:00',
					end: '2016-08-17T09:00'
				}
			];

			$('#cal').fullCalendar(options);

			var events = getEventInfo();

			expect(events.length).toBe(3);
			expect(events[0].title).toBe('event 1');
			expect(events[0].timeText).toBe('7:00am - 12:00am');
			expect(events[1].title).toBe('event 1');
			expect(events[1].timeText).toBe('all-day');
			expect(events[2].title).toBe('event 1');
			expect(events[2].timeText).toBe('12:00am - 9:00am');
		});

		it('renders fewer days when before nextDayThreshold', function() {
			options.nextDayThreshold = '09:00';
			options.events = [
				{
					title: 'event 1',
					start: '2016-08-15T07:00',
					end: '2016-08-17T08:00'
				}
			];

			$('#cal').fullCalendar(options);

			var events = getEventInfo();

			expect(events.length).toBe(2);
			expect(events[0].title).toBe('event 1');
			expect(events[0].timeText).toBe('7:00am - 12:00am');
			expect(events[1].title).toBe('event 1');
			expect(events[1].timeText).toBe('12:00am - 8:00am');
		});
	});

	describe('when an event has no title', function() {
		it('renders no text for its title', function() {
			options.events = [
				{
					start: '2016-08-15'
				}
			];
			$('#cal').fullCalendar(options);

			var events = getEventInfo();

			expect(events.length).toBe(1);
			expect(events[0].title).toBe('');
			expect(events[0].timeText).toBe('all-day');
		});
	});

	describe('when no events', function() {
		it('renders an empty message', function() {
			$('#cal').fullCalendar(options);
			expect(getIsEmptyMessage()).toBe(true);
		});
	});

	function getDayInfo() {
		return $('.fc-list-heading').map(function(i, el) {
			el = $(el);
			return {
				mainText: el.find('.fc-list-heading-main').text() || '',
				altText: el.find('.fc-list-heading-alt').text() || '',
				date: $.fullCalendar.moment(el.data('date'))
			};
		}).get();
	}

	function getEventInfo() { // gets all *segments*
		return $('.fc-list-item').map(function(i, el) {
			el = $(el);
			return {
				title: el.find('.fc-list-item-title').text() || '', // text!
				timeText: el.find('.fc-list-item-time').text() || '' // text!
			};
		}).get();
	}

	function getIsEmptyMessage() {
		return Boolean($('.fc-list-empty').length);
	}
});
