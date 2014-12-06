var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    transform = require('vinyl-transform'),
    browserify = require('browserify');

// Files
var files = ['./index.js', './src/*.js', './test/*.js'];

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

// Building
gulp.task('build', function() {
  var bundle = transform(function(filename) {
    return browserify({entries: filename, standalone: 'Baobab'}).bundle();
  });

  return gulp.src('./index.js')
    .pipe(bundle)
    .pipe(uglify())
    .pipe(rename('baobab.min.js'))
    .pipe(gulp.dest('./build'));
});

// Default
gulp.task('default', ['lint', 'test', 'build']);
