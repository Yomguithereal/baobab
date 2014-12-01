/**
 * Precursors Public Interface
 * ============================
 *
 * Exposes the main library classes.
 */
var Atom = require('./src/atom.js');

// Non-writable version
Object.defineProperty(Atom, 'version', {
  value: '0.0.1'
});

// Exporting
module.exports = Atom;
