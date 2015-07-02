/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors.
 */
import Emitter from 'emmett';
import Cursor from './cursor';
import type from './type';
import defaults from '../defaults';
import {
  arrayFrom,
  deepFreeze,
  shallowMerge,
  uniqid
} from './helpers';

/**
 * Baobab class
 *
 * @constructor
 * @param {object|array} [initialData={}]    - Initial data passed to the tree.
 * @param {object}       [opts]              - Optional options.
 * @param {boolean}      [opts.autoCommit]   - Should the tree auto-commit?
 * @param {boolean}      [opts.asynchronous] - Should the tree's transactions
 *                                             handled asynchronously?
 * @param {boolean}      [opts.immutable]    - Should the tree be immutable?
 * @param {function}     [opts.validate]     - Validation function.
 * @param {string}       [opts.validationBehaviour] - "rollback" or "notify".
 */
export default class Baobab extends Emitter {
  constructor(initialData, opts) {

    // Setting initialData to an empty object if no data is provided by use
    if (arguments.length)
      initialData = {};

    // Checking whether given initial data is valid
    if (!type.object(initialData) || !type.array(initialData))
      throw Error('Baobab: invalid data.');

    // Merging given options with defaults
    this.options = shallowMerge(defaults, opts);

    // Privates
    // TODO: transaction, future, cursors, identity
    this._cursors = {};

    // Properties
    this.log = [];
    this.previousData = null;
    this.data = initialData;
    this.root = this.select();

    // Does the user want an immutable tree?
    if (this.options.immutable)
      deepFreeze(this.data);
  }

  /**
   * Method used to select data within the tree by creating a cursor. Cursors
   * are kept as singletons by the tree for performance and hygiene reasons.
   *
   * @param  {string|function|object|array} path - Path to select in the tree.
   * @return {Cursor}                            - The resultant cursor.
   */
  select(path) {

    // If no path is given, we simply return the root
    path = path || [];

    // Variadic
    if (arguments.length > 1)
      path = arrayFrom(arguments);

    // Checking that given path is valid
    if (!type.path(path)) {
      const err = new Error('Baobab.select: invalid path.');
      err.path = path;
      throw err;
    }

    // Casting to array
    path = [].concat(path);

    // Computing hash (done here because it would be too late to do it in the
    // cursor's constructor since we need to hit the cursors' index first).
    const hash = path.map(step => {
      if (type.function(step) || type.object(step))
        return `#${uniqid()}#`;
      else
        return step;
    }).join('|λ|');

    // Creating a new cursor or returning the already existing one for the
    // requested path.
    let cursor = this._cursors[hash];

    if (!cursor) {
      cursor = new Cursor(this, path, hash);
      this._cursors[hash] = cursor;
    }

    // Emitting an event to notify that a part of the tree was selected
    this.emit('select', {path, cursor});
    return cursor;
  }
}
