var gulp = require('gulp');
var generateDts = require('dts-generator').default;

gulp.task('ts-types', function() {
	return generateDts({
		name: 'fullcalendar',
		project: '.',
		out: 'dist/fullcalendar.d.ts',
		main: 'fullcalendar/src/main'
	});
});

gulp.task('ts-types:watch', [ 'ts-types' ], function() {
	return gulp.watch('src/**/*.ts', [ 'ts-types' ]);
});
