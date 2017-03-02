
describe('defaultRange', function() {

	describe('when custom view with a flexible range', function() {
		pushOptions({
			defaultView: 'agenda'
		});

		describe('when given moment objects', function() {
			pushOptions({
				defaultRange: {
					start: $.fullCalendar.moment('2017-06-26'),
					end: $.fullCalendar.moment('2017-06-29')
				}
			});
			xit('displays the range', function() {
				initCalendar();
				ViewUtils.expectRange('2017-06-26', '2017-06-29');
			});
		});

		describe('when given strings', function() {
			pushOptions({
				defaultRange: {
					start: '2017-06-26',
					end: '2017-06-29'
				}
			});

			xit('displays the range', function() {
				initCalendar();
				ViewUtils.expectRange('2017-06-26', '2017-06-29');
			});
		});

		describe('when given an invalid range', function() {
			pushOptions({
				defaultRange: {
					start: '2017-06-18',
					end: '2017-06-15'
				}
			});

			xit('reports an error and defaults to the now date', function() {
				initCalendar({
					now: '2017-08-01'
				})
				ViewUtils.expectRange('2017-08-01', '2017-08-02');
				// TODO: detect error reporting
			});
		});

		xit('causes rangeComputation to be ignored', function() {
			var rangeComputationCalled = false;

			initCalendar({
				defaultRange: {
					start: '2017-06-26',
					end: '2017-06-29'
				},
				rangeComputation: function() {
					rangeComputationCalled = true;
				}
			});
			expect(rangeComputationCalled).toBe(false);
		});

		describe('when later switching to a one-day view', function() {
			xit('shows the view at the range\'s start', function() {
				initCalendar({
					defaultRange: {
						start: '2017-06-26',
						end: '2017-06-29'
					}
				});
				calendar.changeView('agendaDay');
				ViewUtils.expectRange('2017-06-26', '2017-06-27');
			});
		});

		describe('when range is partially before minDate', function() {
			pushOptions({
				defaultRange: {
					start: '2017-05-30',
					end: '2017-06-03'
				},
				minDate: '2017-06-01'
			});

			xit('navigates to specified range', function() {
				initCalendar();
				ViewUtils.expectRange('2017-05-30', '2017-06-03');
			});

			describe('when later switching to a one-day view', function() {
				xit('shows the view at minDate', function() {
					initCalendar();
					calendar.changeView('agendaDay');
					ViewUtils.expectRange('2017-06-01', '2017-06-02');
				});
			});
		});

		describe('when range is partially after maxDate', function() {
			pushOptions({
				defaultRange: {
					start: '2017-06-29',
					end: '2017-07-04',
				},
				maxDate: '2017-07-01'
			});

			xit('navigates to specified range', function() {
				initCalendar();
				ViewUtils.expectRange('2017-06-29', '2017-07-04');
			});

			describe('when later switching to a one-day view', function() {
				xit('shows the view at the ms before maxDate', function() {
					initCalendar();
					calendar.changeView('agendaDay');
					ViewUtils.expectRange('2017-06-30', '2017-07-01');
				});
			});
		});

		describe('when range is completely before minDate', function() {
			pushOptions({
				defaultRange: {
					start: '2017-05-25',
					end: '2017-05-28',
				},
				maxDate: '2017-07-01'
			});

			xit('navigates to minDate', function() {
				initCalendar();
				ViewUtils.expectRange('2017-06-01', '2017-06-02');
			});

			describe('when later switching to a one-day view', function() {
				xit('shows the view at minDate', function() {
					initCalendar();
					calendar.changeView('agendaDay');
					ViewUtils.expectRange('2017-06-01', '2017-06-02');
				});
			});
		});

		describe('when range is completely after minDate', function() {
			pushOptions({
				defaultRange: {
					start: '2017-07-01',
					end: '2017-07-04'
				},
				minDate: '2017-06-01'
			});

			xit('navigates to maxDate', function() {
				initCalendar();
				ViewUtils.expectRange('2017-06-30', '2017-07-01');
			});

			describe('when later switching to a one-day view', function() {
				xit('shows the view at maxDate', function() {
					initCalendar();
					calendar.changeView('agendaDay');
					ViewUtils.expectRange('2017-06-30', '2017-07-01');
				});
			});
		});
	});

	describe('when custom view with fixed duration', function() {
		pushOptions({
			defaultView: 'agenda',
			duration: { days: 3 }
		});

		xit('uses the start date but does not respect the range', function() {
			initCalendar({
				defaultRange: {
					start: '2017-06-29',
					end: '2017-07-04'
				}
			});
			ViewUtils.expectRange('2017-06-29', '2017-07-01');
		});
	});

	describe('when standard view', function() {
		pushOptions({
			defaultView: 'agendaWeek'
		});

		xit('uses the start date but does not respect the range', function() {
			initCalendar({
				defaultRange: {
					start: '2017-06-29',
					end: '2017-07-04'
				}
			});
			ViewUtils.expectRange('2017-06-29', '2017-06-30');
		});
	});
});
