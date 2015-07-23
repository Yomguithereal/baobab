/**
 * Baobab Facet Class
 * ===================
 *
 * A class in charge of tree's computed data node.
 */
import type from './type';
import {
  deepFreeze,
  getIn,
  makeError,
  solveUpdate
} from './helpers';

/**
 * Facet class
 *
 * @constructor
 * @param {Baobab}       tree       - The tree.
 * @param {array}        pathInTree - Path where the facets stands in its tree.
 * @param {array|object} definition - The facet's definition.
 */
export default class Facet {
  constructor(tree, pathInTree, definition) {

    // Checking definition's type
    const definitionType = type.facetDefinition(definition);

    // If the definition type is not valid, we cry
    if (!definitionType)
      throw makeError(
        'Baobab.Facet: attempting to create a computed data node with a ' +
        `wrong definition (path: /${pathInTree.join('/')}).`,
        {path: pathInTree, definition}
      );

    // Properties
    this.tree = tree;
    this.computedData = null;
    this.type = definitionType;

    // State
    this.state = {
      killed: false
    };

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

    this._hasDynamicPaths = this.paths.some(p => type.dynamicPath(p));

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
    this.listener = ({data: {path}}) => {
      if (this.state.killed)
        return;

      // Is this facet affected by the current write event?
      const concerned = solveUpdate([path], this.relatedPaths());

      if (concerned) {
        this.computedData = null;
        this.state.computed = false;
      }
    };

    // Binding listener
    tree.on('write', this.listener);
  }

  /**
   * Method returning solved paths related to the facet.
   *
   * @return {array} - An array of related paths.
   */
  relatedPaths() {
    let paths;

    if (this._hasDynamicPaths)
      paths = this.paths.map(
        p => getIn(this.tree._data, p, this.tree._computedDataIndex).solvedPath
      );
    else
      paths = this.paths;

    if (!this.isRecursive)
      return paths;
    else
      return paths.reduce((accumulatedPaths, path) => {
        const facetPath = type.facetPath(path);
        if (!facetPath)
          return accumulatedPaths.concat([path]);

        // Solving recursive path
        const relatedFacet = getIn(this.tree._computedDataIndex, facetPath).data;

        return accumulatedPaths.concat(relatedFacet.relatedPaths());
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

    // Unbinding listener
    this.tree.off('write', this.listener);
    this.state.killed = true;
  }
}
