var gulp = require('gulp');
var babel = require('gulp-babel');
var karma = require('karma').server;
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');

gulp.task('build', function() {
  gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('out/'))
});

gulp.task('test', ['build'],function() {
  return gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('test_out/'))
    .pipe(mocha({reporter: 'nyan'}))
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['build', 'test']);
  gulp.watch('test/**/*.js', ['build', 'test']);
});
