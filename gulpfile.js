const gulp = require('gulp')

require('./tasks/ts-types')
require('./tasks/minify')
require('./tasks/archive')
require('./tasks/lint')
require('./tasks/bump')
require('./tasks/example-repos')

// group these somewhat unrelated tasks together for CI
gulp.task('lint-and-example-repos', [ 'lint', 'example-repos:build' ])
