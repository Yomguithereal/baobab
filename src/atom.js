/**
 * Atom Data Structure
 * ====================
 *
 * Encloses an immutable set of data exposing useful cursors to its user.
 */
var Immutable = require('immutable'),
    Map = Immutable.Map,
    Cursor = require('./cursor.js'),
    helper = require('./helpers.js'),
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
  this._futureUpdate = new Map();
  this._willUpdate = true;

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

Atom.prototype.update = function(def) {
  // TODO: patterns
};

/**
 * Private prototype
 */
Atom.prototype._addUpdateToStack = function(def) {

  // TODO: merge update as immutable object
  this.futureUpdate = this.futureUpdate.mergeDeep(def);

  if (!this._willUpdate) {
    this._willUpdate = true;
    helpers.later(this._commit.bind(this));
  }
};

Atom.prototype._commit = function() {

  // Applying modification

  // Resetting
  this._futureUpdate = new Map();
  this._willUpdate = false;
};

/**
 * Export
 */
module.exports = Atom;
