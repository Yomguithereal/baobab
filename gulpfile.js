var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    replace = require('gulp-replace'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
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
  return browserify({
    entries: './index.js',
    standalone: 'Baobab',
    fullPaths: false
  }).bundle()
    .pipe(source('baobab.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(header('/* baobab.js - Version: ' + pkg.version + ' - Author: Yomguithereal (Guillaume Plique) */\n'))
    .pipe(gulp.dest('./build'));
});

// Default
gulp.task('default', ['lint', 'test', 'build']);
