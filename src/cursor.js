/**
 * Baobab Cursor Abstraction
 * ==========================
 *
 * Nested selection into a baobab tree.
 */
var EventEmitter = require('emmett'),
    mixins = require('./mixins.js'),
    helpers = require('./helpers.js'),
    types = require('./typology.js');

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
  this.relevant = this.get() !== undefined;

  // Root listeners
  this.root.on('update', function(e) {
    var log = e.data.log,
        shouldFire = false,
        c, p, l, m, i, j;

    // If selector listens at root, we fire
    if (!self.path.length)
      return self.emit('update');

    // Checking update log to see whether the cursor should update.
    root:
    for (i = 0, l = log.length; i < l; i++) {
      c = log[i];

      for (j = 0, m = c.length; j < m; j++) {
        p = c[j];

        // If path is not relevant to us, we break
        if (p !== self.path[j])
          break;

        // If we reached last item and we are relevant, we fire
        if (j + 1 === m || j + 1 === self.path.length) {
          shouldFire = true;
          break root;
        }
      }
    }

    // Handling relevancy
    var data = self.get() !== undefined;

    if (self.relevant) {
      if (data && shouldFire) {
        self.emit('update');
      }
      else {
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
  });

  // Making mixin
  this.mixin = mixins.cursor(this);
}

helpers.inherits(Cursor, EventEmitter);

/**
 * Private prototype
 */
Cursor.prototype._stack = function(spec) {
  this.root._stack(helpers.pathObject(this.path, spec));
  return this;
};

/**
 * Prototype
 */
Cursor.prototype.select = function(path) {
  if (!path)
    throw Error('precursors.Cursor.select: invalid path.');

  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (!types.check(path, 'path'))
    throw Error('precursors.Cursor.select: invalid path.');
  return new Cursor(this.root, this.path.concat(path));
};

Cursor.prototype.up = function() {
  if (this.path.length)
    return new Cursor(this.root, this.path.slice(0, -1));
  else
    return new Cursor(this.root, []);
};

Cursor.prototype.down = function() {

};

Cursor.prototype.get = function(path) {
  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (path)
    return this.root.get(this.path.concat(path));
  else
    return this.root.get(this.path);
};

Cursor.prototype.set = function(key, value) {
  if (arguments.length < 2) {
    return this.update({$set: key});
  }
  else {
    var spec = {};
    spec[key] = {$set: value};
    return this.update(spec);
  }
};

Cursor.prototype.apply = function(fn) {
  if (typeof fn !== 'function')
    throw Error('baobab.Cursor.apply: argument is not a function.');

  return this.update({$apply: fn});
};

// TODO: maybe composing should be done here rather than in the merge
Cursor.prototype.thread = function(fn) {
  if (typeof fn !== 'function')
    throw Error('baobab.Cursor.thread: argument is not a function.');

  return this.update({$thread: fn});
};

Cursor.prototype.push = function(value) {
  if (arguments.length > 1)
    return this.update({$push: helpers.arrayOf(arguments)});
  else
    return this.update({$push: value});
};

Cursor.prototype.unshift = function(value) {
  if (arguments.length > 1)
    return this.update({$unshift: helpers.arrayOf(arguments)});
  else
    return this.update({$unshift: value});
};

Cursor.prototype.update = function(spec) {
  return this._stack(spec);
};

/**
 * Type definition
 */
types.add('cursor', function(v) {
  return v instanceof Cursor;
});

/**
 * Output
 */
Cursor.prototype.toJSON = function() {
  return this.get();
};

/**
 * Export
 */
module.exports = Cursor;
