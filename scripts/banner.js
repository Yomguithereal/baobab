var banner = require('write-banner'),
    path = require('path');

var built = path.join(__dirname, '..', 'build', 'baobab.js'),
    minified = path.join(__dirname, '..', 'build', 'baobab.min.js');

var options = {
  banner: path.join(__dirname, 'banner.tmpl'),
  name: 'Baobab'
};

banner(built, built, options);
banner(minified, minified, options);
