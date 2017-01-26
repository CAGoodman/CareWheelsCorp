/* eslint-env angular */
/*++
 CareWheels Corporation 2017
 Filename: gulpfile.js
 Description: This file provides functions for gulp operation which helps in source resource control and management.

 Authors: Capstone students PSU Aug 2016
 Revision: Added gulp-bump. gulp-lint and many more gulps- AV 01/04/17
--*/

var gulp = require('gulp')
var bower = require('bower')
var bump = require('gulp-bump')
var replace = require('gulp-replace')
var argv = require('yargs').argv;
var runSequence = require('run-sequence');
var concat = require('gulp-concat')
var eslint = require('gulp-eslint')
var gutil = require('gulp-util')
var minifyCss = require('gulp-minify-css')
var ngConstant = require('gulp-ng-constant')
var rename = require('gulp-rename')
var sass = require('gulp-sass')
var sh = require('shelljs')

var debug = require('gulp-debug')

var paths = {
  sass: ['./scss/**/*.scss']
}

gulp.task('default', ['sass'])

gulp.task('sass', function (done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done)
})

//
// This function just bumps the version string only by default
//

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

//
// This function just bumps the apkVersion string only by default.
// Gulp functions operate async hence you will find the retun's in the middle.
// line 78: It reads package.json pipes the read info to bump() and returns
// Bump() does its work and pipes it to dest() which will copy it to package.json in the current folder.
// If you were to run it under different folder it senses it and changes it to the folder pf the json file
// Version format is Major.Minor.Patch BuildApl.bat need to call them as needed.
// gulp constants have to be called every time to update ngConstatnts.js
// Usage: gulp bumpMajor | gulp bumpMinor | gulp bumpPatch
//

gulp.task('bumpMajor', function() {
  return gulp.src('./package.json')
    .pipe(bump({type:'major'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bumpDispMajVer', function(callback) {
    runSequence('bumpMajor', 'getVersion', callback);
});

gulp.task('bumpMinor', function() {
  return gulp.src('./package.json')
    .pipe(bump({type:'minor'}))
    .pipe(gulp.dest('./'));
});

gulp.task('bumpDispMinVer', function(callback) {
    runSequence('bumpMinor', 'getVersion', callback);
});

gulp.task('bumpPatch', function() {
  return gulp.src('./package.json')
    .pipe(bump({type:'patch'}))       // This happens by default just for clarity I have added the word patch
    .pipe(gulp.dest('./'));
});

gulp.task('bumpDispPatchVer', function(callback) {
    runSequence('bumpPatch', 'getVersion', callback);
});

//
// For resetting Version gulp-replace will be used.
// Usage: gulp resetVersion --version "1.0.0"
//

gulp.task('resetVersion', function () {
  return gulp.src('./package.json')
    .pipe(replace(/"version*.*/, "\"version\": "  + "\"" + argv.version + "\","))
    .pipe(gulp.dest('./'));
});

gulp.task('resetDispVer', function(callback) {
    runSequence('resetVersion --version "2.0.0"', 'getVersion', callback);
});

//
// Just reads package.json and dumps it to screen.
// Usage: gulp getProperty
//

gulp.task('getProperty', function () {
  var data = require('./package.json')
  console.log('Name = ' + data.apkDependencies.apkName)
  console.log('Company = ' + data.apkDependencies.apkCompany)
  console.log('Version = ' + data.apkDependencies.apkVersion)
  console.log('APK = ' + data.apkDependencies.apkPackage)
  console.log('Date = ' + data.apkDependencies.apkDate);
});

//
// Just reads package.json and dumps it to screen.
// Usage: gulp getProperty
//

gulp.task('getVersion', function () {
  var data = require('./package.json')
  console.log('Version = ' + data.apkDependencies.apkVersion)
});

//
// This is left here as an example to run multiple tasks in sequential
//

gulp.task('fourGulps', function(callback) {
    runSequence('bumpMajor', ['bumpMinor'], ['bumpPatch'], 'getVersion', callback);
});

//
// As such bumping date is not a supported functionality in gulp so we use gulp-replace.
// Usage: gulp bumpDate
// How this works: In package.json it greps for thw word "apkDate" followed by anything and replaces
// it with the word "apkDate" + the actual date returned by Date()
//

gulp.task('bumpDate', function () {
  return gulp.src('./package.json')
    .pipe(replace(/"apkDate*.*/, "\"apkDate\": " + "\"" + Date() + "\","))
    .pipe(gulp.dest('./'));
});

//
// For bumping APK name we use gulp-replace.
// Usage: gulp bumpApk --apk "CareBank-armv7-04Jan17.apk"
// How this works: In package.json it greps for the word "apkPackage" followed by anything and replaces
// it with the word "apkPackage" + the actual apk name being passed as an argument
//

gulp.task('bumpApk', function () {
  return gulp.src('./package.json')
    .pipe(replace(/"apkPackage*.*/, "\"apkPackage\": "  + "\"" + argv.apk + "\""))
    .pipe(gulp.dest('./'));
});

//
// This is being used in BuildApk.bat. First bump the patch then date. Then
// push all info to the ngconstants.js from where getProperty will get
// bumpApk will have run far earlier.
//

gulp.task('bumpAll', function(callback) {
    runSequence('bumpPatch', ['bumpDate'], ['bumpConstants'], 'getProperty', callback);
});

//
// This will read package.json and update the file ngConstants.js. This will
// run as part of BuildApk.bat
// Usage: gulp bumpNgConstants
//

gulp.task('bumpConstants', function() {
  var packageJSON = require('./package');
  return ngConstant({
    constants: packageJSON,
    stream: true,
    name: 'ng.constants',
    wrap: false
  })
  .pipe(debug())
  .pipe(gulp.dest('./www/js'));
});

//
// This is for debugging gulp files
//

gulp.task('lint', function () {
  return gulp.src(['www/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
})