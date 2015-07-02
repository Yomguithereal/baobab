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
  getIn
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
    // TODO: identity
    // TODO: handle complex selection

    // Properties
    this.tree = tree;
    this.path = path;
    this.solvedPath = path;
    this.hash = hash;
    this.archive = null;

    // State
    this.state =  {
      recording: false,
      undoing: false
    };
  }

  /**
   * Predicates
   * -----------
   */

  /**
   * Method returning whether the cursor is at root level.
   *
   * @return {boolean} - Is the cursor root?
   */
  isRoot() {
    return !this.path.length;
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
   * @param  {string|function|object|array} path - Path to get in the tree.
   * @return {object} info                       - The resultant information.
   * @return {mixed}  info.data                  - Data at path.
   * @return {array}  info.solvedPath            - The path solved when getting.
   */
  _get(path) {
    path = path || path === 0 ? path : [];

    if (arguments.length > 1)
      path = arrayFrom(arguments);

    const fullPath = this.solvedPath.concat([].concat(path)),
          data = getIn(this.tree.data, fullPath);

    return {data, solvedPath: fullPath};
  }

  /**
   * Method used to get data from the tree. Will fire a `get` event from the
   * tree so that the user may sometimes react upon it to fecth data, for
   * instance.
   *
   * @param  {string|function|object|array} path - Path to get in the tree.
   * @return {mixed}                             - Data at path.
   */
  get(path) {
    const {data, solvedPath} = this._get(path);

    // Emitting the event
    this.tree.emit('get', {data, path: solvedPath});

    return data;
  }

  /**
   * Setter Methods
   * ---------------
   */
}
