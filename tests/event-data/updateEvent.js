
describe('updateEvent', function() {

	describe('when changing an event\'s ID', function() {
		pushOptions({
			defaultView: 'month',
			now: '2017-07-14',
			events: [
				{ id: '2', start: '2017-07-14', end: '2017-07-19' }
			]
		});

		it('reflects the ID change on the event object', function(done) {
			var allRenderCnt = 0;

			initCalendar({
				eventAfterAllRender: function() {
					var eventObjs;
					var eventObj;

					allRenderCnt++;

					if (allRenderCnt === 1) {
						eventObjs = currentCalendar.clientEvents();
						expect(eventObjs.length).toBe(1);

						eventObj = eventObjs[0];
						eventObj.id = '3';
						currentCalendar.updateEvent(eventObj);

						eventObjs = currentCalendar.clientEvents();
						expect(eventObjs.length).toBe(1);
						eventObj = eventObjs[0];
						expect(eventObj.id).toBe('3');

						done();
					}
				}
			});
		});

		it('reflects the ID change during event rendering', function(done) {
			var allRenderCnt = 0;
			var renderCnt = 0;

			initCalendar({
				eventRender: function(eventObj) {
					if (allRenderCnt === 1) {
						expect(eventObj.id).toBe('3');
						renderCnt++;
					}
				},
				eventAfterAllRender: function() {
					var eventObjs;
					var eventObj;

					allRenderCnt++;

					if (allRenderCnt === 1) {
						eventObjs = currentCalendar.clientEvents();
						expect(eventObjs.length).toBe(1);

						eventObj = eventObjs[0];
						eventObj.id = '3';
						currentCalendar.updateEvent(eventObj);
					}
					else if (allRenderCnt === 2) {
						expect(renderCnt).toBe(2);
						done();
					}
				}
			});
		});
	});
});
