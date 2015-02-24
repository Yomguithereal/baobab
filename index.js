/**
 * Baobab Public Interface
 * ========================
 *
 * Exposes the main library classes.
 */
var Baobab = require('./src/baobab.js'),
    helpers = require('./src/helpers.js');

// Non-writable version
Object.defineProperty(Baobab, 'version', {
  value: '0.3.2'
});

// Exposing helpers
Baobab.getIn = helpers.getIn;

// Exporting
module.exports = Baobab;
