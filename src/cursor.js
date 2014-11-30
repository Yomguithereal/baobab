/**
 * Cursor Abstraction
 * ===================
 *
 * Part selection into an immutable data tree.
 */
var EventEmitter = require('emmett'),
    mixins = require('./mixins.js');
    helpers = require('./helpers.js');

/**
 * Main Class
 */
function Cursor(root, path) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Enforcing array
  path = path || [];
  path = (typeof path === 'string') ? [path] : path;

  // Properties
  this.root = root;
  this.path = path;

  // Root listeners
  this.root.on(this.path.join('$$'), function() {
    self.emit('update');
  });

  // Making mixin
  this.mixin = mixins.cursor(this);
}

helpers.inherits(Cursor, EventEmitter);

/**
 * Private prototype
 */
Cursor.prototype._stack = function(spec) {
  return this.root._stack(helpers.pathObject(this.path, spec));
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

Cursor.prototype.update = function(spec) {
  this._stack(spec);
};

/**
 * Export
 */
module.exports = Cursor;
