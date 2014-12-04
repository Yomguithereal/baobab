/**
 * Baobab Data Structure
 * ======================
 *
 * Encloses an immutable set of data exposing useful cursors to its user.
 */
var Cursor = require('./cursor.js'),
    EventEmitter = require('emmett'),
    helpers = require('./helpers.js'),
    update = require('./update.js'),
    types = require('./typology.js'),
    mixins = require('./mixins.js'),
    defaults = require('../defaults.json');

/**
 * Main Class
 */
function Baobab(initialData, opts) {

  // New keyword optional
  if (!(this instanceof Baobab))
    return new Baobab(initialData, opts);

  if (!types.check(initialData, 'object'))
    throw Error('Baobab: invalid data.');

  // Extending
  EventEmitter.call(this);

  // Properties
  this.data = initialData;

  // Privates
  this._futureUpdate = {};
  this._willUpdate = false;
  this._history = [];

  // Merging defaults
  this.options = helpers.merge(opts, defaults);

  // Mixin
  this.mixin = mixins.baobab(this);
}

helpers.inherits(Baobab, EventEmitter);

/**
 * Private prototype
 */
Baobab.prototype._stack = function(spec) {

  if (!types.check(spec, 'object'))
    throw Error('Baobab.update: wrong specification.');

  this._futureUpdate = helpers.merge(spec, this._futureUpdate);

  if (!this.options.delay)
    return this._commit();

  if (!this._willUpdate) {
    this._willUpdate = true;
    helpers.later(this._commit.bind(this));
  }

  return this;
};

Baobab.prototype._commit = function() {
  var self = this;

  // Applying modification (mutation)
  var log = update(this.data, this._futureUpdate);

  // Baobab-level update event
  this.emit('update', {
    log: log
  });

  // Resetting
  this._futureUpdate = {};
  this._willUpdate = false;

  return this;
};

/**
 * Prototype
 */
Baobab.prototype.select = function(path) {
  if (!path)
    throw Error('Baobab.select: invalid path.');

  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (!types.check(path, 'path'))
    throw Error('Baobab.select: invalid path.');
  return new Cursor(this, path);
};

Baobab.prototype.get = function(path) {
  var data;

  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (path)
    data = helpers.getIn(this.data, typeof path === 'string' ? [path] : path);
  else
    data = this.data;

  return data;
};

Baobab.prototype.set = function(key, val) {

  if (arguments.length < 2)
    throw Error('Baobab.set: expects a key and a value.');

  var spec = {};
  spec[key] = {$set: val};

  return this.update(spec);
};

Baobab.prototype.update = function(spec) {
  return this._stack(spec);
};

/**
 * Output
 */
Baobab.prototype.toJSON = function() {
  return this.data;
};
Baobab.prototype.toString = function() {
  return 'Baobab ' + this.data.toString().replace(/^[^{]+\{/, '{');
};
Baobab.prototype.inspect = Baobab.prototype.toString;
Baobab.prototype.toSource = Baobab.prototype.toString;

/**
 * Type definition
 */
types.add('baobab', function(v) {
  return v instanceof Baobab;
});

/**
 * Export
 */
module.exports = Baobab;
