/**
 * Atom Data Structure
 * ====================
 *
 * Encloses an immutable set of data exposing useful cursors to its user.
 */
var Immutable = require('immutable'),
    Map = Immutable.Map,
    Cursor = require('./cursor.js'),
    defaults = require('../defaults.json');

/**
 * Main Class
 */
function Atom(initialData, opts) {

  if (!initialData)
    throw Error('precursors.Atom: invalid data.');

  // Properties
  this.data = Immutable.fromJS(initialData);

  // Privates
  this._updateStack = [];
  this._willUpdate = false;

  // Merging defaults
  // TODO: ...
  this.options = opts;
}

/**
 * Prototype
 */
Atom.prototype.select = function(path) {
  if (!path)
    throw Error('precursors.Atom.select: invalid path.');

  return new Cursor(this, path);
};

Atom.prototype.get = function(path) {

  if (path)
    return this.data.getIn(typeof path === 'string' ? [path] : path);
  else
    return this.data;
};

Atom.prototype.update = function(pattern) {

};

/**
 * Private prototype
 */
Atom.prototype._update = function(pattern) {

};

Atom.prototype._commit = function() {

};

/**
 * Export
 */
module.exports = Atom;
