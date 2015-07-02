var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    pkg = require('./package.json');

// Files
var files = ['./index.js', './src/*.js', './test/**/*.js'],
    banner = '/* baobab.js - Version: ' + pkg.version + ' - Author: Yomguithereal (Guillaume Plique) */\n';

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

// Building
gulp.task('build', function() {
  return browserify({
    entries: './index.js',
    standalone: 'Baobab',
    fullPaths: false
  }).bundle()
    .pipe(source('baobab.js'))
    .pipe(buffer())
    .pipe(header(banner))
    .pipe(gulp.dest('./build'))
    .pipe(rename('baobab.min.js'))
    .pipe(uglify())
    .pipe(header(banner))
    .pipe(gulp.dest('./build'));
});

// Default
gulp.task('default', ['lint', 'build']);
