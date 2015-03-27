/**
 * Baobab Cursor Abstraction
 * ==========================
 *
 * Nested selection into a baobab tree.
 */
var EventEmitter = require('emmett'),
    Combination = require('./combination.js'),
    mixins = require('./mixins.js'),
    helpers = require('./helpers.js'),
    type = require('./type.js');

/**
 * Main Class
 */
function Cursor(tree, path, solvedPath, hash) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Enforcing array
  path = path || [];

  // Properties
  this.tree = tree;
  this.path = path;
  this.hash = hash;
  this.relevant = this.get() !== undefined;

  // Complex path?
  this.complexPath = !!solvedPath;
  this.solvedPath = this.complexPath ? solvedPath : this.path;

  // Root listeners
  this.updateHandler = function(e) {
    var log = e.data.log,
        shouldFire = false,
        c, p, l, m, i, j;

    // Solving path if needed
    if (self.complexPath)
      self.solvedPath = helpers.solvePath(self.tree.data, self.path);

    // If selector listens at tree, we fire
    if (!self.path.length)
      return self.emit('update');

    // Checking update log to see whether the cursor should update.
    outer:
    for (i = 0, l = log.length; i < l; i++) {
      c = log[i];

      for (j = 0, m = c.length; j < m; j++) {
        p = c[j];

        // If path is not relevant to us, we break
        if (p !== '' + self.solvedPath[j])
          break;

        // If we reached last item and we are relevant, we fire
        if (j + 1 === m || j + 1 === self.solvedPath.length) {
          shouldFire = true;
          break outer;
        }
      }
    }

    // Handling relevancy
    var data = self.get() !== undefined;

    if (self.relevant) {
      if (data && shouldFire) {
        self.emit('update');
      }
      else if (!data) {
        self.emit('irrelevant');
        self.relevant = false;
      }
    }
    else {
      if (data && shouldFire) {
        self.emit('relevant');
        self.emit('update');
        self.relevant = true;
      }
    }
  };

  // Making mixin
  this.mixin = mixins.cursor(this);

  // Lazy binding
  var bound = false,
      regularOn = this.on,
      regularOnce = this.once;

  var lazyBind = function() {
    if (bound)
      return;
    bound = true;
    self.tree.on('update', self.updateHandler);
  };

  this.on = function() {
    lazyBind();
    return regularOn.apply(this, arguments);
  };

  this.once = function() {
    lazyBind();
    return regularOnce.apply(this, arguments);
  };
}

helpers.inherits(Cursor, EventEmitter);

/**
 * Predicates
 */
Cursor.prototype.isRoot = function() {
  return !this.path.length;
};

Cursor.prototype.isLeaf = function() {
  return type.Primitive(this.get());
};

Cursor.prototype.isBranch = function() {
  return !this.isLeaf() && !this.isRoot();
};

/**
 * Traversal
 */
Cursor.prototype.root = function() {
  return this.tree.root();
};

Cursor.prototype.select = function(path) {
  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (!type.Path(path))
    throw Error('baobab.Cursor.select: invalid path.');
  return this.tree.select(this.path.concat(path));
};

Cursor.prototype.up = function() {
  if (this.solvedPath && this.solvedPath.length)
    return this.tree.select(this.path.slice(0, -1));
  else
    return null;
};

Cursor.prototype.left = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.left: cannot go left on a non-list type.');

  return last ?
    this.tree.select(this.solvedPath.slice(0, -1).concat(last - 1)) :
    null;
};

Cursor.prototype.leftmost = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.leftmost: cannot go left on a non-list type.');

  return this.tree.select(this.solvedPath.slice(0, -1).concat(0));
};

Cursor.prototype.right = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.right: cannot go right on a non-list type.');

  if (last + 1 === this.up().get().length)
    return null;

  return this.tree.select(this.solvedPath.slice(0, -1).concat(last + 1));
};

Cursor.prototype.rightmost = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.right: cannot go right on a non-list type.');

  var list = this.up().get();

  return this.tree.select(this.solvedPath.slice(0, -1).concat(list.length - 1));
};

Cursor.prototype.down = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (!(this.get() instanceof Array))
    return null;

  return this.tree.select(this.solvedPath.concat(0));
};

/**
 * Access
 */
Cursor.prototype.get = function(path) {
  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (type.Step(path))
    return this.tree.get(this.solvedPath.concat(path));
  else
    return this.tree.get(this.solvedPath);
};

/**
 * Update
 */
Cursor.prototype.set = function(key, val) {
  if (arguments.length < 2)
    throw Error('baobab.Cursor.set: expecting at least key/value.');

  var data = this.get();

  if (typeof data !== 'object')
    throw Error('baobab.Cursor.set: trying to set key to a non-object.');

  var spec = {};

  if (type.Array(key)) {
    var path = helpers.solvePath(data, key);

    if (!path)
      throw Error('baobab.Cursor.set: could not solve dynamic path.');

    spec = helpers.pathObject(path, {$set: val});
  }
  else {
    spec[key] = {$set: val};
  }

  return this.update(spec);
};

Cursor.prototype.edit = function(val) {
  return this.update({$set: val});
};

Cursor.prototype.unset = function(key) {
  if (!key && key !== 0)
    throw Error('baobab.Cursor.unset: expects a valid key to unset.');

  if (typeof this.get() !== 'object')
    throw Error('baobab.Cursor.set: trying to set key to a non-object.');

  var spec = {};
  spec[key] = {$unset: true};
  return this.update(spec);
};

Cursor.prototype.remove = function() {
  if (this.isRoot())
    throw Error('baobab.Cursor.remove: cannot remove root node.');

  return this.update({$unset: true});
};

Cursor.prototype.apply = function(fn) {
  if (typeof fn !== 'function')
    throw Error('baobab.Cursor.apply: argument is not a function.');

  return this.update({$apply: fn});
};

Cursor.prototype.chain = function(fn) {
  if (typeof fn !== 'function')
    throw Error('baobab.Cursor.chain: argument is not a function.');

  return this.update({$chain: fn});
};

Cursor.prototype.push = function(value) {
  if (!(this.get() instanceof Array))
    throw Error('baobab.Cursor.push: trying to push to non-array value.');

  if (arguments.length > 1)
    return this.update({$push: helpers.arrayOf(arguments)});
  else
    return this.update({$push: value});
};

Cursor.prototype.unshift = function(value) {
  if (!(this.get() instanceof Array))
    throw Error('baobab.Cursor.push: trying to push to non-array value.');

  if (arguments.length > 1)
    return this.update({$unshift: helpers.arrayOf(arguments)});
  else
    return this.update({$unshift: value});
};

Cursor.prototype.merge = function(o) {
  if (!type.Object(o))
    throw Error('baobab.Cursor.merge: trying to merge a non-object.');

  if (!type.Object(this.get()))
    throw Error('baobab.Cursor.merge: trying to merge into a non-object.');

  this.update({$merge: o});
};

Cursor.prototype.update = function(spec) {
  this.tree.update(helpers.pathObject(this.solvedPath, spec));
  return this;
};

/**
 * Combination
 */
Cursor.prototype.or = function(otherCursor) {
  return new Combination('or', this, otherCursor);
};

Cursor.prototype.and = function(otherCursor) {
  return new Combination('and', this, otherCursor);
};

/**
 * Releasing
 */
Cursor.prototype.release = function() {

  // Removing listener on parent
  this.tree.off('update', this.updateHandler);

  // If the cursor is hashed, we unsubscribe from the parent
  if (this.hash)
    delete this.tree._cursors[this.hash];

  // Dereferencing
  delete this.tree;
  delete this.path;
  delete this.solvedPath;

  // Killing emitter
  this.kill();
};

/**
 * Output
 */
Cursor.prototype.toJSON = function() {
  return this.get();
};

type.Cursor = function (value) {
  return value instanceof Cursor;
};

/**
 * Export
 */
module.exports = Cursor;
