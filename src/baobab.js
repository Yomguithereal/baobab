/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors.
 */
var Cursor = require('./cursor.js'),
    EventEmitter = require('emmett'),
    Typology = require('typology'),
    helpers = require('./helpers.js'),
    update = require('./update.js'),
    merge = require('./merge.js'),
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

  if (!types.check(initialData, 'object|array'))
    throw Error('Baobab: invalid data.');

  // Extending
  EventEmitter.call(this);

  // Merging defaults
  this.options = merge(opts, defaults);
  this._cloner = this.options.cloningFunction || helpers.clone;

  // Privates
  this._futureUpdate = {};
  this._willUpdate = false;
  this._history = [];
  this._registeredCursors = {};

  // Mutation function for cursors, e.g. React.addons.update that
  // takes the data as first argument and any number of other arguments
  if (this.options.cursorMutateFunction) {
    
    var mutateFunction = this.options.cursorMutateFunction;

    Cursor.prototype.mutate = function () {
      var args = [].slice.call(arguments, 0);
      var data = this.get();
      return this.edit(mutateFunction.apply(null, [data].concat(args)));
    };

  }

  // Internal typology
  this.typology = this.options.typology ?
    (types.check(this.options.typology, 'typology') ?
      this.options.typology :
      new Typology(this.options.typology)) :
    new Typology();

  // Internal validation
  this.validate = this.options.validate || null;

  if (this.validate)
    try {
      this.typology.check(initialData, this.validate, true);
    }
    catch (e) {
      e.message = '/' + e.path.join('/') + ': ' + e.message;
      throw e;
    }

  // Properties
  this.data = this._cloner(initialData);

  // Mixin
  this.mixin = mixins.baobab(this);
}

helpers.inherits(Baobab, EventEmitter);

/**
 * Private prototype
 */
Baobab.prototype._stack = function(spec) {
  var self = this;

  if (!types.check(spec, 'object'))
    throw Error('Baobab.update: wrong specification.');

  this._futureUpdate = merge(spec, this._futureUpdate);

  // Should we let the user commit?
  if (!this.options.autoCommit)
    return this;

  // Should we update synchronously?
  if (!this.options.asynchronous)
    return this.commit();

  // Updating asynchronously
  if (!this._willUpdate) {
    this._willUpdate = true;
    helpers.later(function() {
      self.commit();
    });
  }

  return this;
};

Baobab.prototype._archive = function() {
  if (this.options.maxHistory <= 0)
    return;

  var record = {
    data: this._cloner(this.data)
  };

  // Replacing
  if (this._history.length === this.options.maxHistory) {
    this._history.pop();
  }
  this._history.unshift(record);

  return record;
};

/**
 * Prototype
 */
Baobab.prototype.commit = function(referenceRecord) {
  var self = this,
      log;

  if (referenceRecord) {

    // Override
    this.data = referenceRecord.data;
    log = referenceRecord.log;
  }
  else {

    // Applying modification (mutation)
    var record = this._archive();
    log = update(this.data, this._futureUpdate);

    if (record)
      record.log = log;
  }

  if (this.validate) {
    var errors = [],
        l = log.length,
        d,
        i;

    for (i = 0; i < l; i++) {
      d = helpers.getIn(this.validate, log[i]);

      if (!d)
        continue;

      try {
        this.typology.check(this.get(log[i]), d, true);
      }
      catch (e) {
        e.path = log[i].concat((e.path || []));
        errors.push(e);
      }
    }

    if (errors.length)
      this.emit('invalid', {errors: errors});
  }

  // Baobab-level update event
  this.emit('update', {
    log: log
  });

  // Resetting
  this._futureUpdate = {};
  this._willUpdate = false;

  return this;
};

Baobab.prototype.select = function(path) {
  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (!types.check(path, 'path'))
    throw Error('Baobab.select: invalid path.');

  // Casting to array
  path = (typeof path === 'string') ? [path] : path;

  // Registering a new cursor or giving the already existing one for path
  if (!this.options.cursorSingletons) {
    return new Cursor(this, path);
  }
  else {
    var hash = path.join('λ');

    if (!this._registeredCursors[hash]) {
      var cursor = new Cursor(this, path);
      this._registeredCursors[hash] = cursor;
      return cursor;
    }
    else {
      return this._registeredCursors[hash];
    }
  }
};

Baobab.prototype.reference = function(path) {
  var data;

  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (!types.check(path, 'path'))
    throw Error('Baobab.get: invalid path.');

  return helpers.getIn(
    this.data, types.check(path, 'string|number') ? [path] : path
  );
};

Baobab.prototype.get = function() {
  var ref = this.reference.apply(this, arguments);

  return this.options.clone ? this._cloner(ref) : ref;
};

Baobab.prototype.clone = function(path) {
  return this._cloner(this.reference.apply(this, arguments));
};

Baobab.prototype.set = function(key, val) {

  if (arguments.length < 2)
    throw Error('Baobab.set: expects a key and a value.');

  var spec = {};
  spec[key] = {$set: val};

  return this._stack(spec);
};

Baobab.prototype.update = function(spec) {
  return this._stack(spec);
};

Baobab.prototype.hasHistory = function() {
  return !!this._history.length;
};

Baobab.prototype.getHistory = function() {
  return this._history;
};

Baobab.prototype.undo = function() {
  if (!this.hasHistory())
    throw Error('Baobab.undo: no history recorded, cannot undo.');

  var lastRecord = this._history.shift();
  this.commit(lastRecord);
};

/**
 * Type definition
 */
types.add('baobab', function(v) {
  return v instanceof Baobab;
});

/**
 * Output
 */
Baobab.prototype.toJSON = function() {
  return this.reference();
};

/**
 * Export
 */
module.exports = Baobab;
