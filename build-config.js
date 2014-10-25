// - - - - - 8-< - - - - - - - - - - - - - -

var _ = require('lodash');

// - - - - - 8-< - - - - - - - - - - - - - -

var pkg = require('./package.json');
pkg.year = pkg.year || new Date().getFullYear();

// - - - - - 8-< - - - - - - - - - - - - - -

var config = {

  /* 'production' || 'development' */
  env: process.env.NODE_ENV,

  folders: {
    dest: 'dest/',
    src: 'src/'
  },

  modules: [
    {
      name: 'angular-logo',
      /* use alias if your module name differs from the folder */
      alias: 'ngLogo'
    },
    {
      name: 'app',
      /* optional: provide a list of globals which the module uses.
      * this optimizes minification */
      globals: ['angular']
    }
  ],

  bower: {
    includeDev: true
  },

  header: _.template([
    '/*!',
    '   <%= pkg.name %> v<%= pkg.version %>',
    '   (c) <%= pkg.year %> <%= pkg.author %> <%= pkg.homepage %>',
    '   License: <%= pkg.license %>',
    '*/\n'
  ].join('\n'), { pkg: pkg })

};

// - - - - - 8-< - - - - - - - - - - - - - -

module.exports = config;