const gulp = require('gulp');
const webpack = require('webpack-stream');
const gulpIgnore = require('gulp-ignore');
const createPluginsConfig = require('./webpack/createPluginsConfig');


gulp.task('plugins', [ 'core:types' ], function() {
	return createStream();
});

gulp.task('plugins:dev', [ 'core:types' ], function() {
	return createStream({ debug: true });
});

gulp.task('plugins:watch', [ 'core:types' ], function() {
	return createStream({ debug: true, watch: true });
});


function createStream(settings) {
	const config = createPluginsConfig(settings);
	return gulp.src([]) // don't pass in any files. webpack handles that
		.pipe(webpack(config))
		.pipe(gulpIgnore.exclude('*.css.js*'))
			// ^ don't write bogus .css.js(.map) files webpack creates for standlone css outputs
		.pipe(gulp.dest(config.output.path));
}
