/**
 * Baobab Cursors
 * ===============
 *
 * Cursors created by selecting some data within a Baobab tree.
 */
import Emitter from 'emmett';
import type from './type';

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

    // Properties
    this.tree = tree;
    this.path = path;
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
}
