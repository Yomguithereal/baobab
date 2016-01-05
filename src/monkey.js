/**
 * Baobab Monkeys
 * ===============
 *
 * Exposing both handy monkey definitions and the underlying working class.
 */
import type from './type';
import update from './update';
import {
  deepFreeze,
  getIn,
  makeError,
  solveUpdate,
  solveRelativePath
} from './helpers';

/**
 * Monkey Definition class
 * Note: The only reason why this is a class is to be able to spot it within
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
      this.options = definition.options || {};
    }
    else {
      let offset = 1,
          options = {};

      if (type.object(definition[definition.length - 1])) {
        offset++;
        options = definition[definition.length - 1];
      }

      this.getter = definition[definition.length - offset];
      this.projection = definition.slice(0, -offset);
      this.paths = this.projection;
      this.options = options;
    }

    this.hasDynamicPaths = this.paths.some(type.dynamicPath);
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
    this.isRecursive = false;

    // Adapting the definition's paths & projection to this monkey's case
    const projection = definition.projection,
          relative = solveRelativePath.bind(null, pathInTree.slice(0, -1));

    if (definition.type === 'object') {
      this.projection = Object.keys(projection).reduce(function(acc, k) {
        acc[k] = relative(projection[k]);
        return acc;
      }, {});
      this.depPaths = Object.keys(this.projection)
        .map(k => this.projection[k]);
    }
    else {
      this.projection = projection.map(relative);
      this.depPaths = this.projection;
    }

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
   * Method triggering a recursivity check.
   *
   * @return {Monkey} - Returns itself for chaining purposes.
   */
  checkRecursivity() {
    this.isRecursive = this.depPaths.some(
      p => !!type.monkeyPath(this.tree._monkeys, p)
    );

    // Putting the recursive monkeys' listeners at the end of the stack
    // NOTE: this is a dirty hack and a more thorough solution should be found
    if (this.isRecursive) {
      this.tree.off('write', this.listener);
      this.tree.on('write', this.listener);
    }

    return this;
  }

  /**
   * Method returning solved paths related to the monkey.
   *
   * @return {array} - An array of related paths.
   */
  relatedPaths() {
    let paths;

    if (this.definition.hasDynamicPaths)
      paths = this.depPaths.map(
        p => getIn(this.tree._data, p).solvedPath
      );
    else
      paths = this.depPaths;

    if (!this.isRecursive)
      return paths;

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
    const deps = this.tree.project(this.projection);

    const lazyGetter = (function(tree, def, data) {
      let cache = null,
          alreadyComputed = false;

      return function() {

        if (!alreadyComputed) {
          cache = def.getter.apply(
            tree,
            def.type === 'object' ?
              [data] :
              data
          );

          if (tree.options.immutable && def.options.immutable !== false)
            deepFreeze(cache);

          alreadyComputed = true;
        }

        return cache;
      };
    })(this.tree, this.definition, deps);

    lazyGetter.isLazyGetter = true;

    // Should we write the lazy getter in the tree or solve it right now?
    if (this.tree.options.lazyMonkeys) {
      this.tree._data = update(
        this.tree._data,
        this.path,
        {
          type: 'monkey',
          value: lazyGetter
        },
        this.tree.options
      ).data;
    }
    else {
      const result = update(
        this.tree._data,
        this.path,
        {
          type: 'set',
          value: lazyGetter(),
          options: {
            mutableLeaf: !this.definition.options.immutable
          }
        },
        this.tree.options
      );

      if ('data' in result)
        this.tree._data = result.data;
    }

    return this;
  }

  /**
   * Method releasing the monkey from memory.
   */
  release() {

    // Unbinding events
    this.tree.off('write', this.listener);
    this.state.killed = true;

    // Deleting properties
    // NOTE: not deleting this.definition because some strange things happen
    // in the _refreshMonkeys method. See #372.
    delete this.projection;
    delete this.depPaths;
    delete this.tree;
  }
}
