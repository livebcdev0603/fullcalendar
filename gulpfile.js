const gulp = require('gulp')

require('./tasks/build')
require('./tasks/dts')
require('./tasks/package-meta')
require('./tasks/lint')
require('./tasks/archive') // depends on the dist task

gulp.task('dist', [ // will lint as well!
  'build',
  'dts',
  'package-meta',
  'lint'
])
