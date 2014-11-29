/**
 * Cursor Abstraction
 * ===================
 *
 * Part selection into an immutable data tree.
 */

/**
 * Main Class
 */
function Cursor(root, path) {

  // Enforcing array
  path = path || [];
  path = (typeof path === 'string') ? [path] : path;

  // Properties
  this.root = root;
  this.path = path;
}

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
  this.root._addUpdateToStack({$set: value});
};

// TODO: set/against update
Cursor.prototype.update = function(def) {
  // TODO: patterns
};

/**
 * Export
 */
module.exports = Cursor;
