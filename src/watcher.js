/**
 * Baobab Watchers
 * ================
 *
 * Abstraction used to listen and retrieve data from multiple parts of a
 * Baobab tree at once.
 */
import Emitter from 'emmett';
import Cursor from './cursor';
import type from './type';
import {
  getIn,
  makeError,
  solveUpdate
} from './helpers';

/**
 * Watcher class.
 *
 * @constructor
 * @param {Baobab} tree     - The watched tree.
 * @param {object} mapping  - A mapping of the paths to watch in the tree.
 */
export default class Watcher extends Emitter {
  constructor(tree, mapping) {
    super();

    // Properties
    this.tree = tree;
    this.mapping = null;

    this.state = {
      killed: false
    };

    // Initializing
    this.refresh(mapping);

    // Listening
    this.handler = (e) => {
      if (this.state.killed)
        return;

      const watchedPaths = this.getWatchedPaths();

      if (solveUpdate(e.data.paths, watchedPaths))
        return this.emit('update');
    };

    this.tree.on('update', this.handler);
  }

  /**
   * Method used to get the current watched paths.
   *
   * @return {array} - The array of watched paths.
   */
  getWatchedPaths() {
    const rawPaths = Object.keys(this.mapping)
      .map(k => {
        const v = this.mapping[k];

        // Watcher mappings can accept a cursor
        if (v instanceof Cursor)
          return v.solvedPath;

        return this.mapping[k];
      });

    return rawPaths.reduce((cp, p) => {

      // Handling path polymorphisms
      p = [].concat(p);

      // Dynamic path?
      if (type.dynamicPath(p))
        p = getIn(this.tree._data, p).solvedPath;

      if (!p)
        return cp;

      // Facet path?
      const monkeyPath = type.monkeyPath(this.tree._monkeys, p);

      if (monkeyPath)
        return cp.concat(
          getIn(this.tree._monkeys, monkeyPath).data.relatedPaths()
        );

      return cp.concat([p]);
    }, []);
  }

  /**
   * Method used to return a map of the watcher's cursors.
   *
   * @return {object} - TMap of relevant cursors.
   */
  getCursors() {
    const cursors = {};

    Object.keys(this.mapping).forEach(k => {
      const path = this.mapping[k];

      if (path instanceof Cursor)
        cursors[k] = path;
      else
        cursors[k] = this.tree.select(path);
    });

    return cursors;
  }

  /**
   * Method used to refresh the watcher's mapping.
   *
   * @param  {object}  mapping  - The new mapping to apply.
   * @return {Watcher}          - Itself for chaining purposes.
   */
  refresh(mapping) {

    if (!type.watcherMapping(mapping))
      throw makeError('Baobab.watch: invalid mapping.', {mapping});

    this.mapping = mapping;

    // Creating the get method
    const projection = {};

    for (const k in mapping)
      projection[k] = mapping[k] instanceof Cursor ?
        mapping[k].path :
        mapping[k];

    this.get = this.tree.project.bind(this.tree, projection);
  }

  /**
   * Methods releasing the watcher from memory.
   */
  release() {

    this.tree.off('update', this.handler);
    this.state.killed = true;
    this.kill();
  }
}
