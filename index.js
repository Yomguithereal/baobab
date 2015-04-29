/**
 * Baobab Public Interface
 * ========================
 *
 * Exposes the main library classes.
 */
var Baobab = require('./src/baobab.js'),
    Cursor = require('./src/cursor.js'),
    helpers = require('./src/helpers.js');

// Non-writable version
Object.defineProperty(Baobab, 'version', {
  value: '1.0.2'
});

// Exposing Cursor class
Baobab.Cursor = Cursor;

// Exposing helpers
Baobab.getIn = helpers.getIn;

// Exporting
module.exports = Baobab;
