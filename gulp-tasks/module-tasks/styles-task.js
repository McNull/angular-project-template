var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var path = require('path');
var gulpIf = require('gulp-if');
var less = require('gulp-less');

var config = require('../../build-config.js');

var prefixer = require('../lib/gulp-autoprefixer-map.js');
var rename = require('../lib/gulp-rename-filename.js');
var filter = require('../lib/gulp-mini-filter.js');
var wrapper = require('../lib/gulp-wrap-src');

module.exports = function (gulp, module) {

  var inputFiles = [
    path.join(module.folders.src, module.name + '.less'),
    path.join(module.folders.src, module.name + '.css'),
    path.join(module.folders.src, '**/*.css'),
    '!**/*.ignore.css'
  ];

  module.watch('styles', function() {

    // Include all *.less files in the watch
    var files = inputFiles.concat([]);
    files.splice(1, 0, path.join(module.folders.src, '**/*.less'));

    return {
      glob: files,
      tasks: [ 'styles' ]
    };

  });

  module.task('styles-clean', function() {

    var outputFiles = [
      path.join(module.folders.dest, module.name + '.css'),
      path.join(module.folders.dest, module.name + '.css.map'),
      path.join(module.folders.dest, module.name + '.min.css'),
      path.join(module.folders.dest, module.name + '.min.css.map')
    ];

    var clean = require('gulp-rimraf');

    return gulp.src(outputFiles, { read: false })
      .pipe(clean({ force: true }));

  });

  module.task('styles', 'styles-clean', function () {

    // Gulp plugins with support for sourcemaps with css are minimal and buggy.
    // I couldn't get any minifier to output a valid sourcemap in all situations.
    // The task here generates two stylesheets.
    //
    //  1. unminified + concat + autoprefixed + sourcemaps
    //  2. minified
    //
    // The minified version is based on the output .gulp by the 1st but does
    // not have a sourcemap associated with it.

    return gulp.src(inputFiles)
      .pipe(wrapper({
        header: {
          path: module.name + '-header.css',
          contents: config.header
        }
      }))

      // Generate the unminified stylesheet

      .pipe(module.touch())
      .pipe(sourcemaps.init())
      .pipe(gulpIf(/\.less$/ , less()))
      .pipe(concat(module.name + '.css'))
      .pipe(prefixer(['last 2 versions', '> 1%', 'ie 8']))
      .pipe(filter(function(file) {

        // For gulp-sourcemaps to work with less import statements we'll need to rebase the file

        file.base = path.join(file.base, module.folders.src);
        file.path = path.join(file.base, module.name + '.css');

        return true;

      }))
      .pipe(sourcemaps.write('.', { sourceRoot: '../src/' + module.name }))
      .pipe(gulp.dest(module.folders.dest))

      // Generate the minified stylesheet

      .pipe(filter(function (file) {

        // delete the previous generated sourcemap so we don't trigger
        // sourcemap merging in csswring.

        delete file.sourceMap;

        // Filter out the previous map file.

        return path.extname(file.path) != '.map';

      }))
      .pipe(minifyCss({ keepSpecialComments: 1 }))
      .pipe(rename(module.name + '.min.css'))
      .pipe(gulp.dest(module.folders.dest));

  });

};
