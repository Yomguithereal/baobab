/**
 * Baobab Public Interface
 * ========================
 *
 * Exposes the main library classes.
 */
var Baobab = require('./src/baobab.js'),
    Cursor = require('./src/cursor.js'),
    Facet = require('./src/facet.js'),
    helpers = require('./src/helpers.js');

// Non-writable version
Object.defineProperty(Baobab, 'version', {
  value: '1.1.2'
});

// Exposing Cursor and Facet classes
Baobab.Cursor = Cursor;
Baobab.Facet = Facet;

// Exposing helpers
Baobab.getIn = helpers.getIn;

// Exporting
module.exports = Baobab;
