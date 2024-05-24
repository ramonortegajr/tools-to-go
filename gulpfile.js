const gulp = require('gulp');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');

// Lint Task
gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Test Task
gulp.task('test', () => {
  return gulp.src('test/*.js', { read: false })
    .pipe(mocha({ reporter: 'spec' }));
});

// Default Task
gulp.task('default', gulp.series('lint', 'test'));
