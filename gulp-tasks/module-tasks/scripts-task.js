var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var path = require('path');
var File = require('vinyl');

var wrap = require('../lib/gulp-wrap-src.js');
var config = require('../../build-config.js');
var rename = require('../lib/gulp-rename-filename.js');
var filter = require('../lib/gulp-mini-filter.js');

module.exports = function (gulp, module) {

  module.watch('scripts', function () {

    var inputFiles = [
      module.name + '.js',
      '*.js',
      '!(.gulp)/**/*.js' // <- All subdirs except '.gulp'
    ];

    inputFiles.forEach(function(x, i) {
      inputFiles[i] = path.join(module.folders.src, x);
    });

    inputFiles.push('!**/*.test.js');
    inputFiles.push('!**/*.ignore.js');

    // Input files differ from the actual script task:
    // We're not watching the templates.js output file, since this gives problems
    // when a manual build occurs.
    // The template (ng.html) watch task fires the script task.

    //var inputFiles = [
    //  path.join(module.folders.src, module.name + '.js'),
    //  path.join(module.folders.src, '!(.gulp)/**/*.js'),
    //  //'!' + path.join(module.folders.src, '.gulp/*.js'),
    //  '!**/*.test.js',
    //  '!**/*.ignore.js'
    //];

    return {
      glob: inputFiles,
      tasks: ['scripts']
    };

  });

  module.task('scripts-clean', function () {
    var outputFiles = [
      path.join(module.folders.dest, module.name + '.js'),
      path.join(module.folders.dest, module.name + '.js.map'),
      path.join(module.folders.dest, module.name + '.min.js'),
      path.join(module.folders.dest, module.name + '.min.js.map')
    ];

    var clean = require('gulp-rimraf');

    return gulp.src(outputFiles, {read: false})
      .pipe(clean({force: true}));

  });

  module.task('scripts-header-footer', function () {

    var globals = module.globals || ['angular'];

    var header = new File({
      path: '.gulp/header.js',
      contents: new Buffer(config.header + '(function(' + globals.join(',') + ') {\n')
    });

    var footer = new File({
      path: '.gulp/footer.js',
      contents: new Buffer('})(' + globals.join(',') + ');')
    });

    var ret = gulp.dest(module.folders.src);

    ret.write(header);
    ret.write(footer);
    ret.end();

    return ret;
  });

  function scriptsTask() {

    // The input files differ from the watch task: we're including the templates.js file here.

    var inputFiles = [
      '.gulp/header.js',
      module.name + '.js',
      '**/*.js',
      '.gulp/templates.js',
      '.gulp/footer.js'
    ];

    inputFiles.forEach(function(x, i) {

      inputFiles[i] = path.join(module.folders.src, x);

    });

    inputFiles.push('!**/*.test.js');
    inputFiles.push('!**/*.ignore/*.js');
    inputFiles.push('!**/*.ignore.js');



    //var inputFiles = [
    //  path.join(module.folders.src, '.gulp/header.js'),
    //  path.join(module.folders.src, module.name + '.js'),
    //  //path.join(module.folders.src, '**/*.js'),
    //  path.join(module.folders.src, '*.js'),
    //  path.join(module.folders.src, '!(.gulp)**/*.js'),
    //  path.join(module.folders.src, '.gulp/templates.js'),
    //  path.join(module.folders.src, '.gulp/footer.js'),
    //  '!**/*.test.js',
    //  '!**/*.ignore.js'
    //];

    // Build the self invoking function header & footer

    var globals = module.globals || ['angular'];


    // At the moment of writing, generating and consuming source maps isn't optimal. Compile tools merge previous
    // maps incorrectly, browsers aren't 100% certain about breakpoint locations and are unable to unmangle
    // argument names. The most stable seems to be to uglify and map in two stages:

    //    1. concat all js in one file and persist to the filesystem
    //    2. uglify the previous file and point point the content of the source map to the original file.

    return gulp.src(inputFiles)
      .pipe(module.touch())
      .pipe(filter(function (file) {
        console.log(file.path);
        return true;
      }))
      //.pipe(wrap({
      //  header: {
      //    path: module.name + '-header.js',
      //    contents: config.header + '(function(' + globals.join(',') + ') {\n'
      //  },
      //  footer: {
      //    path: module.name + '-footer.js',
      //    contents: '})(' + globals.join(',') + ');'
      //  }
      //}))
      .pipe(sourcemaps.init())
      .pipe(concat(module.name + '.js'))
      .pipe(ngAnnotate())
      .pipe(sourcemaps.write('.', {sourceRoot: '../src/' + module.name}))
      .pipe(gulp.dest(module.folders.dest))

      // Create the minified version

      .pipe(sourcemaps.init())
      .pipe(filter(function (file) {

        // Filter out the previous map file.
        return path.extname(file.path) != '.map';

      }))
      .pipe(rename(module.name + '.min.js'))
      .pipe(uglify({preserveComments: 'some'}))
      .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: './'}))
      .pipe(gulp.dest(module.folders.dest));
  }

  module.task('scripts-no-templates-rebuild', ['scripts-clean', 'scripts-header-footer'], scriptsTask, true);
  module.task('scripts', ['scripts-clean', 'templates', 'scripts-header-footer'], scriptsTask);
};

