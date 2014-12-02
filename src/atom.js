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
    update = require('./update.js'),
    types = require('./typology.js'),
    defaults = require('../defaults.json');

/**
 * Main Class
 */
function Atom(initialData, opts) {

  // New keyword optional
  if (!(this instanceof Atom))
    return new Atom(initialData, opts);

  if (!types.check(initialData, 'maplike'))
    throw Error('precursors.Atom: invalid data.');

  // Extending
  EventEmitter.call(this);

  // Properties
  this.data = Immutable.fromJS(initialData);

  // Privates
  this._futureUpdate = {};
  this._willUpdate = false;
  this._history = [];

  // Merging defaults
  this.options = Immutable.fromJS(defaults).merge(opts);
}

helpers.inherits(Atom, EventEmitter);

/**
 * Private prototype
 */
Atom.prototype._stack = function(spec) {

  if (!types.check(spec, 'maplike'))
    throw Error('precursors.Atom.update: wrong specification.');

  this._futureUpdate = helpers.merge(spec, this._futureUpdate);

  if (!this.options.get('delay'))
    return this._commit();

  if (!this._willUpdate) {
    this._willUpdate = true;
    helpers.later(this._commit.bind(this));
  }

  return this;
};

Atom.prototype._commit = function() {
  var self = this;

  // Applying modification
  var result = update(this.data, this._futureUpdate);

  // Replacing data
  var oldData = this.data;
  this.data = result.data;

  // Atom-level update event
  this.emit('update', {
    oldData: oldData,
    newData: this.data,
    log: result.log
  });

  // Resetting
  this._futureUpdate = {};
  this._willUpdate = false;

  return this;
};

/**
 * Prototype
 */
Atom.prototype.select = function(path) {
  if (!path)
    throw Error('precursors.Atom.select: invalid path.');

  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (!types.check(path, 'path'))
    throw Error('precursors.Atom.select: invalid path.');
  return new Cursor(this, path);
};

Atom.prototype.get = function(path) {
  var data;

  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (path)
    data = this.data.getIn(typeof path === 'string' ? [path] : path);
  else
    data = this.data;

  if (this.options.get('toJS'))
    return data.toJS();
  else
    return data;
};

Atom.prototype.set = function(key, val) {

  if (arguments.length < 2)
    throw Error('precursors.Atom.set: expects a key and a value.');

  var spec = {};
  spec[key] = {$set: val};

  return this.update(spec);
};

Atom.prototype.update = function(spec) {
  return this._stack(spec);
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
