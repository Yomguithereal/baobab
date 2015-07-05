/**
 * Baobab Facet Class
 * ===================
 *
 * A class in charge of tree's computed data node.
 */
import type from './type';
import {
  makeError,
  solveUpdate
} from './helpers';

/**
 * Facet class
 *
 * @constructor
 * @param {Baobab}       tree       - The tree.
 * @param {array}        path       - Path where the facets stands in its tree.
 * @param {array|object} definition - The facet's definition.
 */
export default class Facet {
  constructor(tree, path, definition) {

    // Checking definition's type
    const definitionType = type.facetDefinition(definition);

    // If the definition type is not valid, we cry
    if (!definitionType)
      throw makeError(
        'Baobab.Facet: attempting to create a computed data node with a ' +
        `wrong definition (path: /${path.join('/')}).`,
        {path, definition}
      );

    // Properties
    this.tree = tree;
    this.computedData = null;
    this.type = definitionType;

    // Harmonizing
    if (definitionType === 'object') {
      this.getter = definition.get;
      this.projection = definition.cursors || {};
      this.paths = Object.keys(this.projection)
        .map(k => this.projection[k]);
    }
    else {
      this.getter = definition[definition.length - 1];
      this.projection = defition.slice(0, -1);
      this.paths = this.projection;
    }

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

      // Is this facet affected by the current write event?
      const concerned = solveUpdate([path], this.paths);

      if (concerned) {
        this.computedData = null;
        this.state.computed = false;
      }
    };

    // Binding listener
    tree.on('write', this.listener);
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
  }
}
