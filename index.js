/**
 * Baobab Public Interface
 * ========================
 *
 * Exposes the main library classes.
 */
var Baobab = require('./src/baobab.js');

// Non-writable version
Object.defineProperty(Baobab, 'version', {
  value: '0.0.1'
});

// Exporting
module.exports = Baobab;
