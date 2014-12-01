/**
 * Atom Data Structure
 * ====================
 *
 * Encloses an immutable set of data exposing useful cursors to its user.
 */
var Immutable = require('immutable'),
    Cursor = require('./cursor.js'),
    EventEmitter = require('emmett'),
    helpers = require('./helpers.js'),
    defaults = require('../defaults.json');

/**
 * Main Class
 */
function Atom(initialData, opts) {

  // New keyword optional
  if (!(this instanceof Atom))
    return new Atom(initialData, opts);

  if (!initialData)
    throw Error('precursors.Atom: invalid data.');

  // Extending
  EventEmitter.call(this);

  // Properties
  this.data = Immutable.fromJS(initialData);

  // Privates
  this._futureUpdate = new Immutable.Map();
  this._willUpdate = false;

  // Merging defaults
  // TODO: ...
  this.options = opts;
}

helpers.inherits(Atom, EventEmitter);

/**
 * Private prototype
 */
Atom.prototype._stack = function(spec) {

  // TODO: handle conflicts and act on given command
  this._futureUpdate = this._futureUpdate.mergeDeep(spec);

  if (!this._willUpdate) {
    this._willUpdate = true;
    helpers.later(this._commit.bind(this));
  }
};

Atom.prototype._commit = function() {
  var self = this;

  // Applying modification
  var update = helpers.update(this.data, this._futureUpdate);

  // Replacing data
  var oldData = this.data;
  this.data = update.data;

  // Atom-level update event
  this.emit('update', {
    oldData: oldData,
    newData: this.data,
    log: update.log
  });

  // Resetting
  this._futureUpdate = new Immutable.Map();
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

  // TODO: type checking
  this._stack(spec);
};

/**
 * Output
 */
Atom.prototype.toJS = function() {
  return this.data.toJS();
};
Atom.prototype.toJSON = Atom.prototype.toJS;
Atom.prototype.toString = function() {
  return 'Atom ' + this.data.toString().replace(/^[^{]+\{/, '{');
};
Atom.prototype.inspect = Atom.prototype.toString;
Atom.prototype.toSource = Atom.prototype.toString;

/**
 * Export
 */
module.exports = Atom;
