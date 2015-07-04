/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors.
 */
import Emitter from 'emmett';
import Cursor from './cursor';
import type from './type';
import update from './update';
import defaults from '../defaults';
import {
  arrayFrom,
  deepFreeze,
  makeError,
  shallowMerge,
  solvePath,
  uniqid
} from './helpers';

/**
 * Function returning a string hash from a non-dynamic path expressed as an
 * array.
 *
 * @param  {array}  path - The path to hash.
 * @return {string} string - The resultant hash.
 */
function hashPath(path) {
  return path.map(step => {
    if (type.function(step) || type.object(step))
      return `#${uniqid()}#`;
    else
      return step;
  }).join('|λ|');
}

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
    super();

    // Setting initialData to an empty object if no data is provided by use
    if (arguments.length < 1)
      initialData = {};

    // Checking whether given initial data is valid
    if (!type.object(initialData) && !type.array(initialData))
      throw makeError('Baobab: invalid data.', {data: initialData});

    // Merging given options with defaults
    this.options = shallowMerge(defaults, opts);

    // Privates
    this._identity = '[object Baobab]';
    this._cursors = {};
    this._future = null;
    this._transaction = {};

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
   * Arity 1:
   * @param {path}    path - Path to select in the tree.
   *
   * Arity *:
   * @param {...step} path - Path to select in the tree.
   *
   * @return {Cursor}      - The resultant cursor.
   */
  select(path) {

    // If no path is given, we simply return the root
    path = path || [];

    // Variadic
    if (arguments.length > 1)
      path = arrayFrom(arguments);

    // Checking that given path is valid
    if (!type.path(path))
      throw makeError('Baobab.select: invalid path.', {path});

    // Casting to array
    path = [].concat(path);

    // Computing hash (done here because it would be too late to do it in the
    // cursor's constructor since we need to hit the cursors' index first).
    const hash = hashPath(path);

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

  /**
   * Method used to update the tree. Updates are simply expressed by a path,
   * dynamic or not, and an operation.
   *
   * This is where path solving should happen and not in the cursor.
   *
   * Arity 1:
   * @param  {object} operation - The operation to apply at root level.
   *
   * Arity 2:
   * @param  {path}   path      - The path where we'll apply the operation.
   * @param  {object} operation - The operation to apply.
   *
   * @return {mixed} - Return the result of the update.
   */
  update(path, operation) {

    // TODO: coerce path and deal with polymorphism

    // Stashing previous data if this is the frame's first update
    this.previousData = this.data;

    // Applying the operation
    const solvedPath = solvePath(this.data, path),
          hash = hashPath(solvedPath),
          {data, node} = update(this.data, solvedPath, operation, this.options);

    // TODO: previousData
    // Updating data and transaction
    this.data = data;

    if (!this._transaction[hash])
      this._transaction[hash] = [];
    this._transaction[hash].push(operation);

    // Should we let the user commit?
    if (!this.options.autoCommit) {
      return node;
    }

    // Should we update asynchronously?
    if (!this.options.asynchronous) {
      this.commit();
      return node;
    }

    // Updating asynchronously
    if (!this._future)
      this._future = setTimeout(() => this.commit(), 0);

    // Finally returning the affected node
    return node;
  }

  /**
   * Method committing the updates of the tree and firing the tree's events.
   *
   * @return {Baobab} - The tree instance for chaining purposes.
   */
  commit() {

    // Clearing timeout if one was defined
    if (this._future)
      this._future = clearTimeout(this._future);

    // Validation?
    const {validate, validationBehaviour: behavior} = this.options;

    if (typeof validate === 'function') {
      const error = validate.call(this, this._transaction);

      if (error instanceof Error) {
        this.emit('invalid', {error});

        if (behavior === 'rollback') {
          this.data = this.previousData;
          return this;
        }
      }
    }

    // Caching
    const transaction = this._transaction,
          previousData = this.previousData;

    this._transaction = {};
    this.previousData = null;

    // Emitting update event
    this.emit('update', {
      transaction,
      previousData,
      data: this.data,
      paths: Object.keys(transaction).map(h => h.split('|λ|'))
    });

    return this;
  }
}
