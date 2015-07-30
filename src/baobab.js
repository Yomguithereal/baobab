/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors.
 */
import Emitter from 'emmett';
import Cursor from './cursor';
import Facet from './facet';
import type from './type';
import update from './update';
import {
  arrayFrom,
  coercePath,
  deepFreeze,
  getIn,
  makeError,
  deepMerge,
  pathObject,
  shallowMerge,
  uniqid
} from './helpers';

/**
 * Baobab defaults
 */
const DEFAULTS = {

  // Should the tree handle its transactions on its own?
  autoCommit: true,

  // Should the transactions be handled asynchronously?
  asynchronous: true,

  // Should the tree's data be immutable?
  immutable: true,

  // Should the tree be persistent?
  persistent: true,

  // Validation specifications
  validate: null,

  // Validation behaviour 'rollback' or 'notify'
  validationBehavior: 'rollback'
};

/**
 * Function returning a string hash from a non-dynamic path expressed as an
 * array.
 *
 * @param  {array}  path - The path to hash.
 * @return {string} string - The resultant hash.
 */
function hashPath(path) {
  return '/' + path.map(step => {
    if (type.function(step) || type.object(step))
      return `#${uniqid()}#`;
    else
      return step;
  }).join('/');
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
    this.options = shallowMerge({}, DEFAULTS, opts);

    // Disabling immutability if persistence if disabled
    if (!this.options.persistent)
      this.options.immutable = false;

    // Privates
    this._identity = '[object Baobab]';
    this._cursors = {};
    this._future = null;
    this._transaction = [];
    this._affectedPathsIndex = {};
    this._computedDataIndex = {};
    this._previousData = null;
    this._data = initialData;

    // Properties
    this.root = this.select();

    // Does the user want an immutable tree?
    if (this.options.immutable)
      deepFreeze(this._data);

    // Bootstrapping root cursor's getters and setters
    const bootstrap = (name) => {
      this[name] = function() {
        const r = this.root[name].apply(this.root, arguments);
        return r instanceof Cursor ? this : r;
      };
    };

    [
      'apply',
      'concat',
      'exists',
      'get',
      'push',
      'merge',
      'project',
      'serialize',
      'set',
      'splice',
      'unset',
      'unshift'
    ].forEach(bootstrap);

    // Creating the computed data index for the first time
    this._initializeComputedDataIndex();
  }

  /**
   * Private method used to initialize the internal computed data index of the
   * tree.
   */
  _initializeComputedDataIndex() {

    // Refreshing the whole tree
    const walk = (data, p=[]) => {

      // Have we reached the end?
      if (type.primitive(data))
        return;

      // Object iteration
      // TODO: handle arrays?
      if (type.object(data)) {
        let k;

        for (k in data) {

          // Creating a facet if needed
          if (k[0] === '$') {
            const facet = new Facet(this, p.concat(k), data[k]);

            deepMerge(
              this._computedDataIndex,
              pathObject(p, {[k]: facet})
            );
          }
          else {
            walk(data[k], p.concat(k));
          }
        }
      }
    };

    // Walking the whole tree
    return walk(this._data);
  }

  /**
   * Method used to select data within the tree by creating a cursor. Cursors
   * are kept as singletons by the tree for performance and hygiene reasons.
   *
   * Arity (1):
   * @param {path}    path - Path to select in the tree.
   *
   * Arity (*):
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
      cursor = new Cursor(this, path, {hash});
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
   * @param  {path}   path      - The path where we'll apply the operation.
   * @param  {object} operation - The operation to apply.
   * @return {mixed} - Return the result of the update.
   */
  update(path, operation) {

    // Coercing path
    path = coercePath(path);

    if (!type.operationType(operation.type))
      throw makeError(
        `Baobab.update: unknown operation type "${operation.type}".`,
        {operation: operation}
      );

    // Solving the given path
    const {solvedPath, exists} = getIn(
      this._data,
      path,
      this._computedDataIndex
    );

    // If we couldn't solve the path, we throw
    if (!solvedPath)
      throw makeError('Baobab.update: could not solve the given path.', {
        path: solvedPath
      });

    // We don't unset irrelevant paths
    if (operation.type === 'unset' && !exists)
      return;

    // Stashing previous data if this is the frame's first update
    if (!this._transaction.length)
      this._previousData = this.get();

    const hash = hashPath(solvedPath);

    // Applying the operation
    const {data, node} = update(
      this._data,
      solvedPath,
      operation,
      this.options
    );

    // Updating data and transaction
    this._data = data;
    this._affectedPathsIndex[hash] = true;
    this._transaction.push({...operation, path: solvedPath});

    // Emitting a `write` event
    this.emit('write', {path: solvedPath});

    // Should we let the user commit?
    if (!this.options.autoCommit)
      return node;

    // Should we update asynchronously?
    if (!this.options.asynchronous) {
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
    const self = this;

    // Clearing timeout if one was defined
    if (this._future)
      this._future = clearTimeout(this._future);

    const affectedPaths = Object.keys(this._affectedPathsIndex).map(h => {
      return h !== '/' ?
        h.split('/').slice(1) :
        [];
    });

    // Validation?
    const {validate, validationBehavior: behavior} = this.options;

    if (typeof validate === 'function') {
      const error = validate.call(
        this,
        this._previousData,
        this._data,
        affectedPaths
      );

      if (error instanceof Error) {
        this.emit('invalid', {error});

        if (behavior === 'rollback') {
          this._data = this._previousData;
          this._affectedPathsIndex = {};
          this._transaction = [];
          this._previousData = this._data;
          return this;
        }
      }
    }

    // Caching to keep original references before we change them
    const transaction = this._transaction,
          previousData = this._previousData;

    this._affectedPathsIndex = {};
    this._transaction = [];
    this._previousData = this._data;

    // Emitting update event
    this.emit('update', {
      paths: affectedPaths,
      transaction,
      previousData,
      get currentData() {
        return self.get();
      }
    });

    return this;
  }

  /**
   * Method used to watch a collection of paths within the tree. Very useful
   * to bind UI components and such to the tree.
   *
   * @param  {object|array} definition - Paths to listen.
   * @return {Cursor}                  - A special cursor that can be listened.
   */
  watch(definition) {
    if (!type.watcherDefinition(definition))
      throw makeError('Baobab.watch: wrong definition.', {definition});

    return new Cursor(this, null, {watched: definition});
  }

  /**
   * Method releasing the tree and its attached data from memory.
   */
  release() {
    let k;

    delete this._data;
    delete this._transaction;
    delete this._affectedPathsIndex;

    // Releasing cursors
    for (k in this._cursors)
      this._cursors[k].release();
    delete this._cursors;

    // Killing event emitter
    this.kill();
  }

  /**
   * Overriding the `toJSON` method for convenient use with JSON.stringify.
   *
   * @return {mixed} - Data at cursor.
   */
  toJSON() {
    return this.serialize();
  }

  /**
   * Overriding the `toString` method for debugging purposes.
   *
   * @return {string} - The baobab's identity.
   */
  toString() {
    return this._identity;
  }
}

/**
 * Version
 */
Object.defineProperty(Baobab, 'version', {
  value: '2.0.0-dev12'
});

/**
 * Exposing the Cursor class
 */
Baobab.Cursor = Cursor;

/**
 * Exporting
 */
export default Baobab;
