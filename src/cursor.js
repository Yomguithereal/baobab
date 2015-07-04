/**
 * Baobab Cursors
 * ===============
 *
 * Cursors created by selecting some data within a Baobab tree.
 */
import Emitter from 'emmett';
import type from './type';
import {
  arrayFrom,
  before,
  getIn,
  makeError,
  solvePath
} from './helpers';

/**
 * Cursor class
 *
 * @constructor
 * @param {Baobab} tree - The cursor's root.
 * @param {array}  path - The cursor's path in the tree.
 * @param {string} hash - The path's hash computed ahead by the tree.
 */
export default class Cursor extends Emitter {
  constructor(tree, path, hash) {
    super();

    // If no path were to be provided, we fallback to an empty path (root)
    path = path || [];

    // Privates
    this._identity = '[object Cursor]';
    this._archive = null;

    // Properties
    this.tree = tree;
    this.path = path;
    this.hash = hash;

    // State
    this.state =  {
      recording: false,
      undoing: false
    };

    // Checking whether the given path is dynamic or not
    this._dynamicPath = type.dynamicPath(this.path);

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
      const record = getIn(previousData, this.solvedPath);

      if (this.state.recording && !this.state.undoing)
        this.archive.add(record);

      this.state.undoing = false;
      return this.emit('update', {
        data: this._get(),
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

      let shouldFire = false;

      // If the cursor's path is dynamic, we need to recompute it
      if (this._dynamicPath)
        this.solvedPath = solvedPath(this.tree.data, this.path);

      // If this is the root selector, we fire already
      if (this.isRoot())
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
    return type.primitive(this._get());
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
   * Getter Methods
   * ---------------
   */

  /**
   * Internal get method. Basically contains the main body of the `get` method
   * without the event emitting. This is sometimes needed not to fire useless
   * events.
   *
   * @param  {path}   path            - Path to get in the tree.
   * @return {object} info            - The resultant information.
   * @return {mixed}  info.data       - Data at path.
   * @return {array}  info.solvedPath - The path solved when getting.
   */
  _get(path) {
    const fullPath = this.solvedPath.concat([].concat(path)),
          data = getIn(this.tree.data, fullPath);

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
    path = path || path === 0 ? path : [];

    if (arguments.length > 1)
      path = arrayFrom(arguments);

    const {data, solvedPath} = this._get(path);

    // Emitting the event
    this.tree.emit('get', {data, path: solvedPath});

    return data;
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
    path = path || path === 0 ? path : [];

    // Checking the path's validity
    if (!type.path(path))
      throw makeError(`Baobab.Cursor.${name}: invalid path.`, {path});

    // Checking the value's validity
    if (typeChecker && !typeChecker(value))
      throw makeError(`Baobab.Cursor.${name}: invalid value.`, {path, value});

    // Filing the update to the tree
    return this.tree.update(
      this.solvedPath.concat(path),
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
makeSetter('append', type.array);
makeSetter('unshift');
makeSetter('prepend', type.array);
makeSetter('splice', type.array);
makeSetter('merge', type.object);
