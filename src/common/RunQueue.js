
function RunQueue() {
	var q = []; // array of runFuncs


	this.clear = function() {
		q = []; // TODO: reject all promises?
	};

	this.push = function(taskFunc) {
		return new Promise(function(resolve) {

			// should run this function when it's taskFunc's turn to run.
			// responsible for popping itself off the queue.
			var runFunc = function() {
				Promise.resolve(taskFunc()) // result might be async, coerce to promise
					.then(resolve) // resolve RunQueue::push's promise, for the caller. will receive result of taskFunc.
					.then(function() {
						q.shift(); // pop itself off

						// run the next task, if any
						if (q.length) {
							q[0]();
						}
					});
			};

			// always put the task at the end of the queue, BEFORE running the task
			q.push(runFunc);

			// if it's the only task in the queue, run immediately
			if (q.length === 1) {
				runFunc();
			}
		});
	};
}

FC.RunQueue = RunQueue;

/*
q = new RunQueue();

function work(i) {
	return q.push(function() {
		trigger();
		console.log('work' + i);
	});
}

var cnt = 0;

function trigger() {
	if (cnt < 5) {
		cnt++;
		work(cnt);
	}
}

work(9);
*/
