var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    header = require('gulp-header'),
    replace = require('gulp-replace'),
    transform = require('vinyl-transform'),
    browserify = require('browserify'),
    pkg = require('./package.json');

// Files
var files = ['./index.js', './src/*.js', './test/**/*.js'];

// Gremlins
gulp.task('gremlins', function() {
  return gulp.src(files[1])
    .pipe(replace(' ', ' '))
    .pipe(gulp.dest('./src'));
});

// Linting
gulp.task('lint', function() {
  return gulp.src(files)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Testing
gulp.task('test', ['gremlins'], function() {
  return gulp.src('./test/endpoint.js')
    .pipe(mocha({reporter: 'spec'}));
});

// Building
gulp.task('build', function() {
  var bundle = transform(function(filename) {
    return browserify({
      entries: filename,
      standalone: 'Baobab',
      fullPaths: false
    }).bundle();
  });

  return gulp.src('./index.js')
    .pipe(bundle)
    .pipe(uglify())
    .pipe(header('/* baobab.js - Version: ' + pkg.version + ' - Author: Yomguithereal (Guillaume Plique) */\n'))
    .pipe(rename('baobab.min.js'))
    .pipe(gulp.dest('./build'));
});

// Default
gulp.task('default', ['lint', 'test', 'build']);
