/**
 * Baobab Cursors
 * ===============
 *
 * Cursors created by selecting some data within a Baobab tree.
 */
import Emitter from 'emmett';
import type from './type';
import {
  Archive,
  arrayFrom,
  before,
  deepClone,
  getIn,
  makeError,
  shallowClone,
  solvePath,
  solveUpdate
} from './helpers';


/**
 * Traversal helper function for dynamic cursors. Will throw a legible error
 * if traversal is not possible.
 *
 * @param {string} method     - The method name, to create a correct error msg.
 * @param {array}  solvedPath - The cursor's solved path.
 */
function checkPossibilityOfDynamicTraversal(method, solvedPath) {
  if (!solvedPath)
    throw makeError(
      `Baobab.Cursor.${method}: ` +
      `cannot use ${method} on an unresolved dynamic path.`,
      {path: solvedPath}
    );
}

/**
 * Cursor class
 *
 * @constructor
 * @param {Baobab} tree   - The cursor's root.
 * @param {array}  path   - The cursor's path in the tree.
 * @param {object} [opts] - Options
 * @param {string} [opts.hash]  - The path's hash computed ahead by the tree.
 * @param {array}  [opts.watch] - Paths the cursor is meant to watch.
 */
export default class Cursor extends Emitter {
  constructor(tree, path, opts={}) {
    super();

    // If no path were to be provided, we fallback to an empty path (root)
    path = path || [];

    // Privates
    this._identity = '[object Cursor]';
    this._archive = null;

    // Properties
    this.tree = tree;
    this.path = path;
    this.hash = opts.hash;

    // State
    this.state = {
      recording: false,
      undoing: false
    };

    // Checking whether the cursor is a watcher
    if (opts.watch) {
      this._watch = shallowClone(opts.watch);

      // Normalizing path
      for (let k in this._watch)
        if (this._watch[k] instanceof Cursor)
          this._watch[k] = this._watch[k].path;

      // Keeping track of watched paths
      this._watchedPaths = opts.watch && (!type.array(this._watch) ?
        Object.keys(this._watch).map(k => this._watch[k]) :
        this._watch);

      // Overriding the cursor's get method
      this.get = this.tree.project.bind(this.tree, this._watch);
    }

    // Checking whether the given path is dynamic or not
    this._dynamicPath = type.dynamicPath(this.path);

    // Checking whether the given will meet a facet
    this._facetPath = type.facetPath(this.path);

    if (!this._dynamicPath)
      this.solvedPath = this.path;
    else
      this.solvedPath = solvePath(this.tree.data, this.path);

    /**
     * Function in charge of actually trigger the cursor's updates and
     * deal with the archived records.
     *
     * @param {mixed} previousData - the tree's previous data.
     */
    const fireUpdate = (previousData) => {

      if (this._watch)
        return this.emit('update');

      const record = getIn(previousData, this.solvedPath);

      if (this.state.recording && !this.state.undoing)
        this.archive.add(record);

      this.state.undoing = false;

      return this.emit('update', {
        data: this._get().data,
        previousData: record
      });
    };

    /**
     * Listener bound to the tree's updates and determining whether the
     * cursor is affected and should react accordingly.
     *
     * Note that this listener is lazily bound to the tree to be sure
     * one wouldn't leak listeners when only creating cursors for convenience
     * and not to listen to updates specifically.
     *
     * @param {object} event - The event fired by the tree.
     */
    this._updateHandler = (event) => {
      const {paths, previousData} = event.data,
            update = fireUpdate.bind(this, previousData);

      let comparedPaths;

      // Standard cursor
      if (!this._watch) {

        // Checking whether we should keep track of some dependencies
        const additionalPaths = this._facetPath ?
          getIn(this.tree._computedDataIndex, this._facetPath).relatedPaths() :
          [];

        // If the cursor's path is dynamic, we need to recompute it
        if (this._dynamicPath)
          this.solvedPath = solvePath(this.tree.data, this.path);

        comparedPaths = [this.solvedPath].concat(additionalPaths);
      }

      // Watcher cursor
      else {
        comparedPaths = this._watchedPaths.reduce((cp, p) => {
          if (type.dynamicPath(p))
            p = solvePath(this.tree.data, p);

          if (!p)
            return cp;

          const facetPath = type.facetPath(p);

          if (facetPath)
            return cp.concat(
              getIn(this.tree._computedDataIndex, p).relatedPaths());

          return cp.concat([p]);
        }, []);
      }

      if (solveUpdate(paths, comparedPaths))
        return update();
    };

    // Lazy binding
    let bound = false;
    this._lazyBind = () => {
      if (bound)
        return;

      bound = true;
      return this.tree.on('update', this._updateHandler);
    };

    // If the path is dynamic, we actually need to listen to the tree
    // TODO: there should be another way
    if (this._dynamicPath) {
      this._lazyBind();
    }
    else {

      // Overriding the emitter `on` and `once` methods
      this.on = before(this._lazyBind, this.on.bind(this));
      this.once = before(this._lazyBind, this.once.bind(this));
    }
  }

  /**
   * Predicates
   * -----------
   */

  /**
   * Method returning whether the cursor is at root level.
   *
   * @return {boolean} - Is the cursor the root?
   */
  isRoot() {
    return !this.path.length;
  }

  /**
   * Method returning whether the cursor is at leaf level.
   *
   * @return {boolean} - Is the cursor a leaf?
   */
  isLeaf() {
    return type.primitive(this._get().data);
  }

  /**
   * Method returning whether the cursor is at branch level.
   *
   * @return {boolean} - Is the cursor a branch?
   */
  isBranch() {
    return !this.isRoot() && !this.isLeaf();
  }

  /**
   * Traversal Methods
   * ------------------
   */

  /**
   * Method returning the root cursor.
   *
   * @return {Baobab} - The root cursor.
   */
  root() {
    return this.tree.root;
  }

  /**
   * Method selecting a subpath as a new cursor.
   *
   * Arity (1):
   * @param  {path} path    - The path to select.
   *
   * Arity (*):
   * @param  {...step} path - The path to select.
   *
   * @return {Cursor}       - The created cursor.
   */
  select(path) {
    if (arguments.length > 1)
      path = arrayFrom(arguments);

    return this.tree.select(this.path.concat(path));
  }

  /**
   * Method returning the parent node of the cursor or else `null` if the
   * cursor is already at root level.
   *
   * @return {Baobab} - The parent cursor.
   */
  up() {
    if (!this.isRoot())
      return this.tree.select(this.path.slice(0, -1));
    else
      return null;
  }

  /**
   * Method returning the child node of the cursor.
   *
   * @return {Baobab} - The child cursor.
   */
  down() {
    checkPossibilityOfDynamicTraversal('down', this.solvedPath);

    if (!(this._get().data instanceof Array))
      throw Error('Baobab.Cursor.down: cannot go down on a non-list type.');

    return this.tree.select(this.solvedPath.concat(0));
  }

  /**
   * Method returning the left sibling node of the cursor if this one is
   * pointing at a list. Returns `null` if this cursor is already leftmost.
   *
   * @return {Baobab} - The left sibling cursor.
   */
  left() {
    checkPossibilityOfDynamicTraversal('left', this.solvedPath);

    const last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last))
      throw Error('Baobab.Cursor.left: cannot go left on a non-list type.');

    return last ?
      this.tree.select(this.solvedPath.slice(0, -1).concat(last - 1)) :
      null;
  }

  /**
   * Method returning the right sibling node of the cursor if this one is
   * pointing at a list. Returns `null` if this cursor is already rightmost.
   *
   * @return {Baobab} - The right sibling cursor.
   */
  right() {
    checkPossibilityOfDynamicTraversal('right', this.solvedPath);

    const last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last))
      throw Error('Baobab.Cursor.right: cannot go right on a non-list type.');

    if (last + 1 === this.up()._get().data.length)
      return null;

    return this.tree.select(this.solvedPath.slice(0, -1).concat(last + 1));
  }

  /**
   * Method returning the leftmost sibling node of the cursor if this one is
   * pointing at a list.
   *
   * @return {Baobab} - The leftmost sibling cursor.
   */
  leftmost() {
    checkPossibilityOfDynamicTraversal('leftmost', this.solvedPath);

    const last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last))
      throw Error('Baobab.Cursor.leftmost: cannot go left on a non-list type.');

    return this.tree.select(this.solvedPath.slice(0, -1).concat(0));
  }

  /**
   * Method returning the rightmost sibling node of the cursor if this one is
   * pointing at a list.
   *
   * @return {Baobab} - The rightmost sibling cursor.
   */
  rightmost() {
    checkPossibilityOfDynamicTraversal('rightmost', this.solvedPath);

    const last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last))
      throw Error(
        'Baobab.Cursor.rightmost: cannot go right on a non-list type.');

    const list = this.up()._get().data;

    return this.tree
      .select(this.solvedPath.slice(0, -1).concat(list.length - 1));
  }

  /**
   * Method mapping the children nodes of the cursor.
   *
   * @param  {function} fn      - The function to map.
   * @param  {object}   [scope] - An optional scope.
   * @return {array}            - The resultant array.
   */
  map(fn, scope) {
    checkPossibilityOfDynamicTraversal('map', this.solvedPath);

    let array = this._get().data,
        l = arguments.length;

    if (!type.array(array))
      throw Error('baobab.Cursor.map: cannot map a non-list type.');

    return array.map(function(item, i) {
      return fn.call(
        l > 1 ? scope : this,
        this.select(i),
        i,
        array
      );
    }, this);
  }

  /**
   * Getter Methods
   * ---------------
   */

  /**
   * Internal get method. Basically contains the main body of the `get` method
   * without the event emitting. This is sometimes needed not to fire useless
   * events.
   *
   * @param  {path}   [path=[]]       - Path to get in the tree.
   * @return {object} info            - The resultant information.
   * @return {mixed}  info.data       - Data at path.
   * @return {array}  info.solvedPath - The path solved when getting.
   */
  _get(path=[]) {
    const fullPath = this.solvedPath && this.solvedPath.concat(path);

    let data;

    if (!fullPath)
      data = undefined;
    else
      data = getIn(
        this.tree.data,
        fullPath,
        this.tree._computedDataIndex,
        this.tree.options
      );

    return {data, solvedPath: fullPath};
  }

  /**
   * Method used to get data from the tree. Will fire a `get` event from the
   * tree so that the user may sometimes react upon it to fecth data, for
   * instance.
   *
   * @todo: check path validity
   *
   * Arity (1):
   * @param  {path}   path           - Path to get in the tree.
   *
   * Arity (2):
   * @param {..step} path            - Path to get in the tree.
   *
   * @return {mixed}                 - Data at path.
   */
  get(path) {
    path = path || path === 0 ? path : [];

    if (arguments.length > 1)
      path = arrayFrom(arguments);

    const {data, solvedPath} = this._get(path);

    // Emitting the event
    if (solvedPath)
      this.tree.emit('get', {data, path: solvedPath});

    return data;
  }

  /**
   * Method used to return raw data from the tree, by carefully avoiding
   * computed one.
   *
   * Arity (1):
   * @param  {path}   path           - Path to serialize in the tree.
   *
   * Arity (2):
   * @param {..step} path            - Path to serialize in the tree.
   *
   * @return {mixed}                 - The retrieved raw data.
   */
  serialize() {
    const data = this.get.apply(this, arguments);

    return deepClone(data);
  }

  /**
   * Method used to project some of the data at cursor onto a map or a list.
   *
   * @param  {object|array} projection - The projection's formal definition.
   * @return {object|array}            - The resultant map/list.
   */
  project(projection) {
    if (type.object(projection)) {
      const data = {};

      for (let k in projection)
        data[k] = this.get(projection[k]);

      return data;
    }

    else if (type.array(projection)) {
      const data = [];

      for (let i = 0, l = projection.length; i < l; i++)
        data.push(this.get(projection[i]));

      return data;
    }

    throw makeError('Baobab.Cursor.project: wrong projection.', {projection});
  }

  /**
   * History Methods
   * ----------------
   */

  /**
   * Methods starting to record the cursor's successive states.
   *
   * @param  {integer} [maxRecords] - Maximum records to keep in memory. Note
   *                                  that if no number is provided, the cursor
   *                                  will keep everything.
   * @return {Cursor}               - The cursor instance for chaining purposes.
   */
  startRecording(maxRecords) {
    maxRecords = maxRecords || Infinity;

    if (maxRecords < 1)
      throw makeError('Baobab.Cursor.startRecording: invalid max records.', {
        value: maxRecords
      });

    if (this.archive)
      return this;

    // Lazy binding
    this._lazyBind();

    this.archive = new Archive(maxRecords);
    this.state.recording = true;
    return this;
  }

  /**
   * Methods stopping to record the cursor's successive states.
   *
   * @return {Cursor} - The cursor instance for chaining purposes.
   */
  stopRecording() {
    this.state.recording = false;
    return this;
  }

  /**
   * Methods undoing n steps of the cursor's recorded states.
   *
   * @param  {integer} [steps=1] - The number of steps to rollback.
   * @return {Cursor}            - The cursor instance for chaining purposes.
   */
  undo(steps=1) {
    if (!this.state.recording)
      throw new Error('Baobab.Cursor.undo: cursor is not recording.');

    const record = this.archive.back(steps);

    if (!record)
      throw Error('Baobab.Cursor.undo: cannot find a relevant record.');

    this.state.undoing = true;
    this.set(record);

    return this;
  }

  /**
   * Methods returning whether the cursor has a recorded history.
   *
   * @return {boolean} - `true` if the cursor has a recorded history?
   */
  hasHistory() {
    return !!(this.archive && this.archive.get().length);
  }

  /**
   * Methods returning the cursor's history.
   *
   * @return {array} - The cursor's history.
   */
  getHistory() {
    return this.archive ? this.archive.get() : [];
  }

  /**
   * Methods clearing the cursor's history.
   *
   * @return {Cursor} - The cursor instance for chaining purposes.
   */
  clearHistory() {
    if (this.archive)
      this.archive.clear();
    return this;
  }

  /**
   * Releasing
   * ----------
   */

  /**
   * Methods releasing the cursor from memory.
   */
  release() {

    // Removing listener on parent
    this.tree.off('update', this._updateHandler);

    // Unsubscribe from the parent
    if (this.hash)
      delete this.tree._cursors[this.hash];

    // Dereferencing
    delete this.tree;
    delete this.path;
    delete this.solvedPath;
    delete this.archive;

    // Killing emitter
    this.kill();
  }

  /**
   * Output
   * -------
   */

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
   * @return {string} - The cursor's identity.
   */
  toString() {
    return this._identity;
  }
}

/**
 * Setter Methods
 * ---------------
 *
 * Those methods are dynamically assigned to the class for DRY reasons.
 */

/**
 * Function creating a setter method for the Cursor class.
 *
 * @param {string}   name          - the method's name.
 * @param {function} [typeChecker] - a function checking that the given value is
 *                                   valid for the given operation.
 */
function makeSetter(name, typeChecker) {

  /**
   * Binding a setter method to the Cursor class and having the following
   * definition.
   *
   * Arity (1):
   * @param  {mixed} value - New value to set at cursor's path.
   *
   * Arity (2):
   * @param  {path}  path  - Subpath to update starting from cursor's.
   * @param  {mixed} value - New value to set.
   *
   * @return {mixed}       - Data at path.
   */
  Cursor.prototype[name] = function(path, value) {

    // We should warn the user if he applies to many arguments to the function
    if (arguments.length > 2)
      throw makeError(`Baobab.Cursor.${name}: too many arguments.`);

    // Handling arities
    if (arguments.length === 1 && name !== 'unset') {
      value = path;
      path = [];
    }

    // Coerce path
    path = path || path === 0 ? path : [];

    // Checking the path's validity
    if (!type.path(path))
      throw makeError(`Baobab.Cursor.${name}: invalid path.`, {path});

    // Checking the value's validity
    if (typeChecker && !typeChecker(value))
      throw makeError(`Baobab.Cursor.${name}: invalid value.`, {path, value});

    const fullPath = this.solvedPath.concat(path);

    // Checking we are not trying to update a read-only path
    if (type.readOnlyPath(fullPath))
      throw makeError(
        `Baobab.Cursor.${name}: trying to update a read-only path.`,
        {path: fullPath}
      );

    // Filing the update to the tree
    return this.tree.update(
      fullPath,
      {
        type: name,
        value
      }
    );
  };
}

/**
 * Making the necessary setters.
 */
makeSetter('set');
makeSetter('unset');
makeSetter('apply', type.function);
makeSetter('push');
makeSetter('concat', type.array);
makeSetter('unshift');
makeSetter('splice', type.array);
makeSetter('merge', type.object);
