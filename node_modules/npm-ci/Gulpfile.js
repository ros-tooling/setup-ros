var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul'),
    coveralls = require('gulp-coveralls');

gulp.task('pre-coverage', function () {
	return gulp.src(['./src/**/*.js'])
		.pipe(istanbul())
		.pipe(istanbul.hookRequire());
});

gulp.task('coverage', ['pre-coverage'], function () {
	return gulp.src('./test/**/*.js')
		.pipe(mocha())
		.pipe(istanbul.writeReports())
		.pipe(istanbul.enforceThresholds({thresholds: {global: 80}}));
});

gulp.task('ci', ['coverage'], function () {
	return gulp.src('./coverage/**/lcov.info')
		.pipe(coveralls());
});
