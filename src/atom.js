/**
 * Atom Data Structure
 * ====================
 *
 * Encloses an immutable set of data exposing useful cursors to its user.
 */
var Immutable = require('immutable'),
    Map = Immutable.Map,
    Cursor = require('./cursor.js'),
    helpers = require('./helpers.js'),
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
  this._modifiedCursors = [];
  this._willUpdate = false;

  // Merging defaults
  // TODO: ...
  this.options = opts;
}

/**
 * Private prototype
 */
Atom.prototype._stack = function(cursor, spec) {

  // TODO: merge update as immutable object
  this._futureUpdate = this._futureUpdate.mergeDeep(spec);

  if (!~this._modifiedCursors.indexOf(cursor))
    this._modifiedCursors.push(cursor);

  if (!this._willUpdate) {
    this._willUpdate = true;
    helpers.later(this._commit.bind(this));
  }
};

Atom.prototype._commit = function() {

  // Applying modification
  this.data = helpers.update(this.data, this._futureUpdate);

  // Notifying
  // TODO: check for irrelevant cursors now
  // TODO: update every relevant cursors
  this._modifiedCursors.forEach(function(cursor) {
    cursor.emit('update');
  });

  // Resetting
  this._futureUpdate = new Map();
  this._modifiedCursors = [];
  this._willUpdate = false;
};

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

Atom.prototype.update = function(spec) {
  // TODO: patterns
};

/**
 * Export
 */
module.exports = Atom;
