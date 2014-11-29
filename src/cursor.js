/**
 * Cursor Abstraction
 * ===================
 *
 * Part selection into an immutable data tree.
 */
var EventEmitter = require('emmett'),
    helpers = require('./helpers');

/**
 * Main Class
 */
function Cursor(root, path) {

  // Extending event emitter
  EventEmitter.call(this);

  // Enforcing array
  path = path || [];
  path = (typeof path === 'string') ? [path] : path;

  // Properties
  this.root = root;
  this.path = path;
}

helpers.inherits(Cursor, EventEmitter);

/**
 * Private prototype
 */
Cursor.prototype._stack = function(spec) {
  return this.root._stack(this, helpers.pathObject(this.path, spec));
};

/**
 * Prototype
 */
Cursor.prototype.select = function(path) {
  if (!path)
    throw Error('precursors.Cursor.select: invalid path.');

  return new Cursor(this.root, this.path.concat(path));
};

Cursor.prototype.get = function(path) {
  if (path)
    return this.root.get(this.path.concat(path));
  else
    return this.root.get(this.path);
};

Cursor.prototype.set = function(value) {
  this._stack({$set: value});
};

Cursor.prototype.push = function(value) {
  this._stack({$push: value});
};

// TODO: set/against update
Cursor.prototype.update = function(spec) {
  // TODO: patterns
};

/**
 * Export
 */
module.exports = Cursor;
