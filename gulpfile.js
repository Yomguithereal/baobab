var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    babelify = require('babelify'),
    header = require('gulp-header'),
    rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    pkg = require('./package.json');

// Files
var banner = '/* baobab.js - Version: ' + pkg.version + ' - Author: Yomguithereal (Guillaume Plique) */\n';

// Building
gulp.task('build', function() {
  return browserify({
    entries: './src/baobab.js',
    standalone: 'Baobab',
    fullPaths: false
  }).transform(babelify.configure({loose: true}))
    .bundle()
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
gulp.task('default', ['build']);
