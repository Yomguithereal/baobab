/**
 * Baobab Facet Class
 * ===================
 *
 * A class in charge of tree's computed data node.
 */
import Emitter from 'emmett';
import type from './type';
import {
  deepFreeze,
  getIn,
  makeError,
  solveUpdate
} from './helpers';

/**
 * Identity function
 */
const identity = x => x;

/**
 * Facet class
 *
 * @constructor
 * @param {Baobab}       tree       - The tree.
 * @param {array}        path       - Path where the facets stands in its tree.
 * @param {array|object} definition - The facet's definition.
 */
export default class Facet extends Emitter {
  constructor(tree, definition, pathInTree=null) {
    super();

    // Checking definition's type
    const definitionType = type.facetDefinition(definition);

    // If the definition type is not valid, we cry
    if (!definitionType)
      throw makeError(
        'Baobab.Facet: attempting to create a computed data node with a ' +
        `wrong definition (path: /${(pathInTree || []).join('/')}).`,
        {path: pathInTree, definition}
      );

    // Properties
    this.tree = tree;
    this.computedData = null;
    this.type = definitionType;
    this.watcher = !pathInTree;

    // Harmonizing
    if (definitionType === 'object') {
      this.getter = definition.get;
      this.projection = definition.cursors || {};
      this.paths = Object.keys(this.projection)
        .map(k => this.projection[k]);
    }
    else {
      this.getter = definition[definition.length - 1];
      this.projection = definition.slice(0, -1);
      this.paths = this.projection;
    }

    // Is the facet recursive?
    this.isRecursive = this.paths.some(p => !!type.facetPath(p));

    // Internal state
    this.state = {
      computed: false
    };

    /**
     * Listener on the tree's `write` event.
     *
     * When the tree writes, this listener will check whether the updated paths
     * are of any use to the facet and, if so, will clean any computed data
     * so that the data may be recomputed when needed.
     */
    this.writeListener = ({data: {path}}) => {

      // Is this facet affected by the current write event?
      const concerned = solveUpdate([path], this.relatedPaths());

      if (concerned) {
        this.computedData = null;
        this.state.computed = false;
      }
    };

    /**
     * Listener on the tree's `update` event.
     *
     * This will run only if the Facet is created by a watch routine.
     */
    this.updateListener = ({data: {paths}}) => {
      const concerned = solveUpdate(paths, this.relatedPaths());

      if (concerned)
        this.emit('update');
    };

    // Binding listeners
    if (this.watcher)
      tree.on('update', this.updateListener);
    else
      tree.on('write', this.writeListener);
  }

  /**
   * Method returning solved paths related to the facet.
   *
   * @return {array} - An array of related paths.
   */
  relatedPaths() {
    if (!this.isRecursive)
      return this.paths;
    else
      return this.paths.reduce((paths, path) => {
        const facetPath = type.facetPath(path);
        if (!facetPath)
          return paths.concat(path);

        // Solving recursive path
        const relatedFacet = getIn(this.tree._computedDataIndex, facetPath);

        return paths.concat(relatedFacet.relatedPaths());
      }, []);
  }


  /**
   * Getter method
   *
   * @return {mixed} - The facet's computed data.
   */
  get() {

    // Returning data if already computed
    if (this.state.computed)
      return this.computedData;

    // Computing data
    const deps = this.tree.project(this.projection),
          data = this.getter.apply(
            this.tree,
            this.type === 'object' ?
              [deps] :
              deps
          );

    this.state.computed = true;
    this.computedData = data;

    // If the tree is immutable, we need to freeze the data
    if (this.tree.options.immutable)
      deepFreeze(this.computedData);

    return data;
  }

  /**
   * Method releasing the facet from memory.
   */
  release() {

    // Deleting properties
    delete this.getter;
    delete this.projection;
    delete this.paths;

    // Unbinding listeners
    if (this.watcher)
      this.tree.off('update', this.updateListener);
    else
      this.tree.off('write', this.writeListener);

    // Killing emitter
    this.kill();
  }
}
