/**
 * Baobab Cursor Abstraction
 * ==========================
 *
 * Nested selection into a baobab tree.
 */
var EventEmitter = require('emmett'),
    helpers = require('./helpers.js'),
    defaults = require('../defaults.js'),
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
  this.undoing = false;

  // Privates
  this._identity = '[object Cursor]';

  // Complex path?
  this.complexPath = !!solvedPath;
  this.solvedPath = this.complexPath ? solvedPath : this.path;

  // Relevant?
  this.relevant = this.get() !== undefined;

  // Root listeners
  function update(previousState) {
    if (self.isRecording() && !self.undoing) {

      // Handle archive
      var data = helpers.getIn(previousState, self.solvedPath, self.tree),
          record = helpers.deepClone(data);

      self.archive.add(record);
    }

    self.undoing = false;
    return self.emit('update');
  }

  this.updateHandler = function(e) {
    var log = e.data.log,
        previousState = e.data.previousState,
        shouldFire = false,
        c, p, l, m, i, j;

    // Solving path if needed
    if (self.complexPath)
      self.solvedPath = helpers.solvePath(self.tree.data, self.path, self.tree);

    // If selector listens at tree, we fire
    if (!self.path.length)
      return update(previousState);

    // Checking update log to see whether the cursor should update.
    if (self.solvedPath)
      shouldFire = helpers.solveUpdate(log, [self.solvedPath]);

    // Handling relevancy
    var data = self.get() !== undefined;

    if (self.relevant) {
      if (data && shouldFire) {
        update(previousState);
      }
      else if (!data) {
        self.emit('irrelevant');
        self.relevant = false;
      }
    }
    else {
      if (data && shouldFire) {
        self.emit('relevant');
        update(previousState);
        self.relevant = true;
      }
    }
  };

  // Lazy binding
  var bound = false;

  this._lazyBind = function() {
    if (bound)
      return;
    bound = true;
    self.tree.on('update', self.updateHandler);
  };

  this.on = helpers.before(this._lazyBind, this.on.bind(this));
  this.once = helpers.before(this._lazyBind, this.once.bind(this));

  if (this.complexPath)
    this._lazyBind();
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
    [].concat(path || path === 0 ? path : [])
  );

  return helpers.getIn(this.tree.data, fullPath, this.tree);
};

/**
 * Update
 */
function pathPolymorphism(method, allowedType, key, val) {
  if (arguments.length > 5)
    throw Error('baobab.Cursor.' + method + ': too many arguments.');

  if (arguments.length < 4) {
    val = key;
    key = [];
  }

  key = key || [];

  // Checking value validity
  if (allowedType && !allowedType(val))
    throw Error('baobab.Cursor.' + method + ': incorrect value.');

  var path = [].concat(key),
      solvedPath = helpers.solvePath(this.get(), path, this.tree);

  if (!solvedPath)
    throw Error('baobab.Cursor.' + method + ': could not solve dynamic path.');

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
makeUpdateMethod('push');
makeUpdateMethod('unshift');
makeUpdateMethod('merge', type.Object);

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
 * History
 */
Cursor.prototype.startRecording = function(maxRecords) {
  maxRecords = maxRecords || 5;

  if (maxRecords < 1)
    throw Error('baobab.Cursor.startRecording: invalid maximum number of records.');

  if (this.archive)
    return this;

  // Lazy bind
  this._lazyBind();

  this.archive = helpers.archive(maxRecords);
  return this;
};

Cursor.prototype.stopRecording = function() {
  this.archive = null;
  return this;
};

Cursor.prototype.undo = function(steps) {
  steps = steps || 1;

  if (!this.isRecording())
    throw Error('baobab.Cursor.undo: cursor is not recording.');

  if (!type.PositiveInteger(steps))
    throw Error('baobab.Cursor.undo: expecting a positive integer.');

  var record = this.archive.back(steps);

  if (!record)
    throw Error('boabab.Cursor.undo: cannot find a relevant record (' + steps + ' back).');

  this.undoing = true;
  return this.set(record);
};

Cursor.prototype.isRecording = function() {
  return !!this.archive;
};

Cursor.prototype.hasHistory = function() {
  return !!(this.archive && this.archive.get().length);
};

Cursor.prototype.getHistory = function() {
  return this.archive ? this.archive.get() : [];
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
  delete this.archive;

  // Killing emitter
  this.kill();
};

/**
 * Output
 */
Cursor.prototype.toJSON = function() {
  return this.get();
};

Cursor.prototype.toString = function() {
  return this._identity;
};

/**
 * Export
 */
module.exports = Cursor;
