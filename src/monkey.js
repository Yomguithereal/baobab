/**
 * Baobab Monkeys
 * ===============
 *
 * Exposing both handy monkey definitions and the underlying working class.
 */
import type from './type';
import update from './update';
import {
  arrayFrom,
  getIn,
  makeError,
  solveUpdate
} from './helpers';

/**
 * Monkey Definition class
 * Note: The only reason why this is a class is to be able to spot it whithin
 * otherwise ordinary data.
 *
 * @constructor
 * @param {array|object} definition - The formal definition of the monkey.
 */
export class MonkeyDefinition {
  constructor(definition) {
    const monkeyType = type.monkeyDefinition(definition);

    if (!monkeyType)
      throw makeError(
        'Baobab.monkey: invalid definition.',
        {definition}
      );

    this.type = monkeyType;

    if (this.type === 'object') {
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

    this.hasDynamicPaths = this.paths.some(type.dynamicPath);

    // TODO...
    this.isRecursive = false;
  }
}

/**
 * Monkey core class
 *
 * @constructor
 * @param {Baobab}           tree       - The bound tree.
 * @param {MonkeyDefinition} definition - A definition instance.
 */
export class Monkey {
  constructor(tree, pathInTree, definition) {

    // Properties
    this.tree = tree;
    this.path = pathInTree;
    this.definition = definition;

    // Internal state
    this.state = {
      killed: false
    };

    /**
     * Listener on the tree's `write` event.
     *
     * When the tree writes, this listener will check whether the updated paths
     * are of any use to the monkey and, if so, will update the tree's node
     * where the monkey sits with a lazy getter.
     */
    this.listener = ({data: {path}}) => {
      if (this.state.killed)
        return;

      // Is the monkey affected by the current write event?
      const concerned = solveUpdate([path], this.relatedPaths());

      if (concerned)
        this.update();
    };

    // Binding listener
    this.tree.on('write', this.listener);

    // Updating relevant node
    this.update();
  }

  /**
   * Method returning solved paths related to the monkey.
   *
   * @return {array} - An array of related paths.
   */
  relatedPaths() {
    const def = this.definition;

    let paths;

    if (def.hasDynamicPaths)
      paths = def.paths.map(
        p => getIn(this.tree._data, p).solvedPath
      );
    else
      paths = def.paths;

    if (!def.isRecursive)
      return paths;
    else
      return paths.reduce((accumulatedPaths, path) => {
        const monkeyPath = type.monkeyPath(this.tree._monkeys, path);

        if (!monkeyPath)
          return accumulatedPaths.concat([path]);

        // Solving recursive path
        const relatedMonkey = getIn(this.tree._monkeys, monkeyPath).data;

        return accumulatedPaths.concat(relatedMonkey.relatedPaths());
      }, []);
  }

  /**
   * Method used to update the tree's internal data with a lazy getter holding
   * the computed data.
   *
   * @return {Monkey} - Returns itself for chaining purposes.
   */
  update() {
    const deps = this.tree.project(this.definition.projection);

    const lazyGetter = (function(tree, def, data) {
      return function() {
        return def.getter.apply(
          tree,
          def.type === 'object' ?
            [data] :
            data
        );
      };
    })(this.tree, this.definition, deps);

    this.tree._data = update(
      this.tree._data,
      this.path,
      {type: 'monkey', value: lazyGetter},
      this.tree.options
    ).data;

    return this;
  }

  /**
   * Method releasing the monkey from memory.
   */
  release() {

    // Deleting properties
    delete this.tree;
    delete this.definition;

    this.tree.off('write', this.listener);
    this.state.killed = true;
  }
}
