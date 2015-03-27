/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors.
 */
var Cursor = require('./cursor.js'),
    EventEmitter = require('emmett'),
    helpers = require('./helpers.js'),
    update = require('./update.js'),
    merge = require('./merge.js'),
    mixins = require('./mixins.js'),
    defaults = require('../defaults.js'),
    type = require('./type.js');

function complexHash(type) {
  return type + '$' +
    (new Date()).getTime() + (''  + Math.random()).replace('0.', '');
}

/**
 * Main Class
 */
function Baobab(initialData, opts) {
  if (arguments.length < 1)
    initialData = {};

  // New keyword optional
  if (!(this instanceof Baobab))
    return new Baobab(initialData, opts);

  if (!type.Object(initialData) && !type.Array(initialData))
    throw Error('Baobab: invalid data.');

  // Extending
  EventEmitter.call(this);

  // Merging defaults
  this.options = helpers.shallowMerge(defaults, opts);

  // Privates
  this._transaction = {};
  this._future = undefined;
  this._cursors = {};

  // Properties
  this.data = helpers.deepClone(initialData);

  // Mixin
  this.mixin = mixins.baobab(this);
}

helpers.inherits(Baobab, EventEmitter);

/**
 * Prototype
 */
Baobab.prototype.commit = function() {
  var self = this;

  // Shifting root reference
  if (this.options.shiftReferences)
    this.data = helpers.shallowClone(this.data);

  // Applying modification (mutation)
  var log = update(this.data, this._transaction, this.options);

  // Resetting
  this._transaction = {};

  if (this._future)
    this._future = clearTimeout(this._future);

  // Baobab-level update event
  this.emit('update', {
    log: log
  });

  return this;
};

Baobab.prototype.select = function(path) {
  if (!path)
    throw Error('Baobab.select: invalid path.');

  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (!type.Path(path))
    throw Error('Baobab.select: invalid path.');

  // Casting to array
  path = !type.Array(path) ? [path] : path;

  // Complex path?
  var complex = type.ComplexPath(path);

  var solvedPath;

  if (complex)
    solvedPath = helpers.solvePath(this.data, path);

  // Registering a new cursor or giving the already existing one for path
  var hash = path.map(function(step) {
    if (type.Function(step))
      return complexHash('fn');
    else if (type.Object(step))
      return complexHash('ob');
    else
      return step;
  }).join('λ');

  if (!this._cursors[hash]) {
    var cursor = new Cursor(this, path, solvedPath, hash);
    this._cursors[hash] = cursor;
    return cursor;
  }
  else {
    return this._cursors[hash];
  }
};

Baobab.prototype.root = function() {
  return this.select([]);
};

Baobab.prototype.get = function(path) {
  var data;

  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (!type.Path(path))
    throw Error('Baobab.get: invalid path.');

  return helpers.getIn(
    this.data, type.String(path) || type.Number(path) ? [path] : path
  );
};

Baobab.prototype.set = function(key, val) {

  if (arguments.length < 2)
    throw Error('Baobab.set: expects a key and a value.');

  var spec = {};

  if (type.Array(key)) {
    var path = helpers.solvePath(this.data, key);

    if (!path)
      throw Error('Baobab.set: could not solve dynamic path.');

    spec = helpers.pathObject(path, {$set: val});
  }
  else {
    spec[key] = {$set: val};
  }

  return this.update(spec);
};

Baobab.prototype.unset = function(key) {
  if (!key && key !== 0)
    throw Error('Baobab.unset: expects a valid key to unset.');

  var spec = {};
  spec[key] = {$unset: true};

  return this.update(spec);
};

Baobab.prototype.update = function(spec) {
  var self = this;

  if (!type.Object(spec))
    throw Error('Baobab.update: wrong specification.');

  this._transaction = merge(spec, this._transaction);

  // Should we let the user commit?
  if (!this.options.autoCommit)
    return this;

  // Should we update synchronously?
  if (!this.options.asynchronous)
    return this.commit();

  // Updating asynchronously
  if (!this._future)
    this._future = setTimeout(self.commit.bind(self, null), 0);

  return this;
};

Baobab.prototype.release = function() {

  delete this.data;
  delete this._transaction;

  // Releasing cursors
  for (var k in this._cursors)
    this._cursors[k].release();
  delete this._cursors;

  // Killing event emitter
  this.kill();
};

/**
 * Output
 */
Baobab.prototype.toJSON = function() {
  return this.get();
};

/**
 * Export
 */
module.exports = Baobab;
