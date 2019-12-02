var fs = require('fs-extra'),
    path = require('path'),
    browserify = require('browserify'),
    compileTemplate = require('lodash/template'),
    Terser = require('terser');

var pkg = require('../package.json');

var TEMPLATE_PATH = path.join(__dirname, 'banner.tmpl');
var ENPOINT_PATH = path.join(__dirname, '..', 'src', 'baobab.js');

var BUILD_PATH = path.join(__dirname, '..', 'build');
var CONCAT_PATH = path.join(BUILD_PATH, 'baobab.js');
var MINIFIED_PATH = path.join(BUILD_PATH, 'baobab.min.js');

var BANNER_TEMPLATE = compileTemplate(fs.readFileSync(TEMPLATE_PATH, 'utf-8'));

browserify(ENPOINT_PATH, {standalone: 'Baobab'})
  .transform('babelify', {presets: [['@babel/preset-env', {loose: true}]]})
  .bundle(function(err, buffer) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    fs.ensureDirSync(BUILD_PATH);

    var commonTemplateData = {
      name: 'Baobab',
      homepage: pkg.homepage,
      version: pkg.version
    };

    var baobabCode = buffer.toString();

    var minifiedCode = Terser.minify(baobabCode).code;

    fs.writeFileSync(CONCAT_PATH, BANNER_TEMPLATE(Object.assign({code: baobabCode}, commonTemplateData)));
    fs.writeFileSync(MINIFIED_PATH, BANNER_TEMPLATE(Object.assign({code: minifiedCode}, commonTemplateData)));
  });
