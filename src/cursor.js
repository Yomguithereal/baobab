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
  this.archive = null;

  // Complex path?
  this.complexPath = !!solvedPath;
  this.solvedPath = this.complexPath ? solvedPath : this.path;

  // Relevant?
  this.relevant = this.get() !== undefined;

  // Root listeners
  this.updateHandler = function(e) {
    var log = e.data.log,
        shouldFire = false,
        c, p, l, m, i, j;

    // Solving path if needed
    if (self.complexPath)
      self.solvedPath = helpers.solvePath(self.tree.data, self.path, self.tree);

    // If selector listens at tree, we fire
    if (!self.path.length)
      return self.emit('update');

    // Checking update log to see whether the cursor should update.
    if (self.solvedPath)
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
  var bound = false;

  var lazyBind = function() {
    if (bound)
      return;
    bound = true;
    self.tree.on('update', self.updateHandler);
  };

  this.on = helpers.before(lazyBind, this.on.bind(this));
  this.once = helpers.before(lazyBind, this.once.bind(this));
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

  var fullPath = this.solvedPath.concat(
    (type.String(path) || type.Number(path) ? [path] : path) || []
  );

  return helpers.getIn(this.tree.data, fullPath, this.tree);
};

/**
 * Update
 */
function pathPolymorphism(method, allowedType, key, val) {
  if (arguments.length < 4) {
    val = key;
    key = [];
  }

  key = key || [];

  var path = [].concat(key),
      solvedPath = helpers.solvePath(this.get(), path, this.tree);

  if (!solvedPath)
    throw Error('baobab.Cursor.' + method + ': could not solve dynamic path.');

  if (allowedType) {
    var data = this.get(solvedPath);

    if (!type[allowedType](data))
      throw Error('baobab.Cursor.' + method + ': invalid target.');
  }

  var leaf = {};
  leaf['$' + method] = val;

  var spec = helpers.pathObject(solvedPath, leaf);

  return spec;
}

function makeUpdateMethod(command, type) {
  Cursor.prototype[command] = function() {
    var spec = pathPolymorphism.bind(this, command, type).apply(this, arguments);

    return this.update(spec);
  };
}

makeUpdateMethod('set');
makeUpdateMethod('apply');
makeUpdateMethod('chain');
makeUpdateMethod('push', 'Array');
makeUpdateMethod('unshift', 'Array');

Cursor.prototype.merge = function(o) {
  if (!type.Object(o))
    throw Error('baobab.Cursor.merge: trying to merge a non-object.');

  var spec = pathPolymorphism.bind(this, 'merge', 'Object').apply(this, arguments);

  return this.update(spec);
};

Cursor.prototype.unset = function(key) {
  if (key === undefined && this.isRoot())
    throw Error('baobab.Cursor.unset: cannot remove root node.');

  var spec = pathPolymorphism.bind(this, 'unset', null).apply(this, [key, true]);

  return this.update(spec);
};

Cursor.prototype.update = function(key, spec) {
  if (arguments.length < 2) {
    this.tree.stack(helpers.pathObject(this.solvedPath, key));
    return this;
  }

  // Solving path
  var path = [].concat(key),
      solvedPath = helpers.solvePath(this.get(), path, this.tree);

  if (!solvedPath)
    throw Error('baobab.Cursor.update: could not solve dynamic path.');

  this.tree.stack(helpers.pathObject(this.solvedPath.concat(solvedPath), spec));
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
 * History
 */
Cursor.prototype.startRecording = function(maxRecords) {
  if (this.archive)
    return this;
  this.archive = helpers.archive(maxRecords);
  return this;
};

Cursor.prototype.stopRecording = function() {
  this.archive = null;
  return this;
};

Cursor.prototype.undo = function() {
  // TODO...
};

Cursor.prototype.redo = function() {
  // TODO...
};

Cursor.prototype.isRecording = function() {
  return !!this.archive;
};

Cursor.prototype.hasHistory = function() {
  return !!(this.archive && this.archive.records.length);
};

Cursor.prototype.getHistory = function() {
  return this.archive.records;
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
