/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors. Main class of the library.
 */
import Emitter from 'emmett';
import type from './type';
import defaults from '../defaults';

/**
 * Main Class
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
  }
}
