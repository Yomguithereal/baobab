/**
 * Baobab Public Interface
 * ========================
 *
 * Exposes the main library classes.
 */
var Baobab = require('./src/baobab'),
    Cursor = require('./src/cursor'),
    Facet = require('./src/facet'),
    helpers = require('./src/helpers');

// Non-writable version
Object.defineProperty(Baobab, 'version', {
  value: '1.1.0'
});

// Exposing Cursor and Facet classes
Baobab.Cursor = Cursor;
Baobab.Facet = Facet;

// Exposing helpers
Baobab.getIn = helpers.getIn;

// Exporting
module.exports = Baobab;
