var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha');

// Files
var files = ['./index.js', './src/*.js'];

// Linting
gulp.task('lint', function() {
  return gulp.src(files)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Testing
gulp.task('test', function() {
  return gulp.src('./test/unit.test.js')
    .pipe(mocha({reporter: 'spec'}));
});

// Default
gulp.task('default', ['lint', 'test']);
