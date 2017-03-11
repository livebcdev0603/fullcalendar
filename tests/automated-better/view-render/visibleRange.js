
describe('visibleRange rendering', function() {

	describe('start constraint', function() {

		describe('when month view', function() {
			pushOptions({
				defaultView: 'month',
				defaultDate: '2017-06-01',
				visibleRange: { start: '2017-06-07' }
			});

			it('does not render days before', function() {
				initCalendar();
				ViewRenderUtils.expectDayRange('2017-06-07', '2017-07-09');
			});
		});

		describe('when in week view', function() {
			pushOptions({
				defaultView: 'agendaWeek',
				defaultDate: '2017-06-08',
				visibleRange: { start: '2017-06-06' }
			});

			it('does not render days before', function() {
				initCalendar();
				ViewRenderUtils.expectDayRange('2017-06-06', '2017-06-11');
			});
		});
	});

	describe('end constraint', function() {

		describe('when month view', function() {
			pushOptions({
				defaultView: 'month',
				defaultDate: '2017-06-01',
				visibleRange: { end: '2017-06-07' }
			});

			it('does not render days on or after', function() {
				initCalendar();
				ViewRenderUtils.expectDayRange('2017-05-28', '2017-06-07');
			});
		});

		describe('when in week view', function() {
			pushOptions({
				defaultView: 'agendaWeek',
				defaultDate: '2017-06-08',
				visibleRange: { end: '2017-06-06' }
			});

			it('does not render days on or after', function() {
				initCalendar();
				ViewRenderUtils.expectDayRange('2017-06-04', '2017-06-06');
			});
		});
	});
});
