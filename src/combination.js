/**
 * Baobab Cursor Combination
 * ==========================
 *
 * A useful abstraction dealing with cursor's update logical combinations.
 */
var EventEmitter = require('emmett'),
    types = require('./typology.js'),
    helpers = require('./helpers.js');

/**
 * Utilities
 */
function bindCursor(c, cursor) {
  cursor.on('update', c.cursorListener);
}

/**
 * Main Class
 */
function Combination(first, second, operator) {
  var self = this;

  // Safeguard
  if (first === second)
    throw Error('baobab.combination: first cursor is identical to second.');

  if (!types.check([first, second], ['cursor']))
    throw Error('baobab.Combination: argument should be a cursor.');

  if (operator !== 'or' && operator !== 'and')
    throw Error('baobab.Combination: invalid operator.');

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.cursors = [first, second];
  this.operators = [operator];
  this.root = first.root;

  // State
  this.updates = new Array(this.cursors.length);

  // Listeners
  this.cursorListener = function() {
    self.updates[self.cursors.indexOf(this)] = true;
  };

  this.treeListener = function() {
    var shouldFire = self.updates[0],
        i,
        l;

    for (i = 1, l = self.cursors.length; i < l; i++) {
      shouldFire = self.operators[i - 1] === 'or' ?
        shouldFire || self.updates[i] :
        shouldFire && self.updates[i];
    }

    if (shouldFire)
      self.emit('update');

    // Waiting for next update
    self.updates = new Array(self.cursors.length);
  };

  // Initial bindings
  this.root.on('update', this.treeListener);
  bindCursor(this, first);
  bindCursor(this, second);
}

helpers.inherits(Combination, EventEmitter);

/**
 * Prototype
 */
Combination.prototype.or = function(cursor) {

  // Safeguard
  if (!types.check(cursor, 'cursor'))
    throw Error('baobab.Combination.or: argument should be a cursor.');

  if (~this.cursors.indexOf(cursor))
    throw Error('baobab.Combination.or: cursor already in combination.');

  this.cursors.push(cursor);
  this.operators.push('or');
  this.updates.length++;
  bindCursor(this, cursor);

  return this;
};

Combination.prototype.and = function(cursor) {

  // Safeguard
  if (!types.check(cursor, 'cursor'))
    throw Error('baobab.Combination.and: argument should be a cursor.');

  if (~this.cursors.indexOf(cursor))
    throw Error('baobab.Combination.and: cursor already in combination.');

  this.cursors.push(cursor);
  this.operators.push('and');
  this.updates.length++;
  bindCursor(this, cursor);

  return this;
};

Combination.prototype.release = function() {

  // Dropping own listeners
  this.unbindAll();

  // Dropping cursors listeners
  this.cursors.forEach(function(cursor) {
    cursor.off('update', this.cursorListener);
  }, this);

  // Dropping tree listener
  this.root.off('update', this.treeListener);

  // Cleaning
  this.cursors = null;
  this.operators = null;
  this.root = null;
  this.updates = null;
};

/**
 * Exporting
 */
module.exports = Combination;
