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
  solveRelativePath,
  hashPath
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

    // Coercing paths for convenience
    this.paths = this.paths.map(p => [].concat(p));

    // Does the definition contain dynamic paths
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
     * where the monkey sits.
     */
    this.writeListener = ({data: {path}}) => {
      if (this.state.killed)
        return;

      // Is the monkey affected by the current write event?
      const concerned = solveUpdate([path], this.relatedPaths());

      if (concerned)
        this.update();
    };

    /**
     * Listener on the tree's `monkey` event.
     *
     * When another monkey updates, this listener will check whether the
     * updated paths are of any use to the monkey and, if so, will update the
     * tree's node where the monkey sits.
     */
    this.recursiveListener = ({data: {monkey, path}}) => {
      if (this.state.killed)
        return;

      // Breaking if this is the same monkey
      if (this === monkey)
        return;

      // Is the monkey affected by the current monkey event?
      const concerned = solveUpdate([path], this.relatedPaths(false));

      if (concerned)
        this.update();
    };

    // Binding listeners
    this.tree.on('write', this.writeListener);
    this.tree.on('_monkey', this.recursiveListener);

    // Updating relevant node
    this.update();
  }

  /**
   * Method returning solved paths related to the monkey.
   *
   * @param  {boolean} recursive - Should we compute recursive paths?
   * @return {array}             - An array of related paths.
   */
  relatedPaths(recursive = true) {
    let paths;

    if (this.definition.hasDynamicPaths)
      paths = this.depPaths.map(
        p => getIn(this.tree._data, p).solvedPath
      );
    else
      paths = this.depPaths;

    const isRecursive = recursive && this.depPaths.some(
      p => !! type.monkeyPath(this.tree._monkeys, p)
    );

    if (!isRecursive)
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

    const lazyGetter = ((tree, def, data) => {
      let cache = null,
          alreadyComputed = false;

      return () => {

        if (!alreadyComputed) {
          cache = def.getter.apply(
            tree,
            def.type === 'object' ?
              [data] :
              data
          );

          if (tree.options.immutable && def.options.immutable !== false)
            deepFreeze(cache);

          // update tree affected paths
          const hash = hashPath(this.path);
          tree._affectedPathsIndex[hash] = true;

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

    // Notifying the monkey's update so we can handle recursivity
    this.tree.emit('_monkey', {monkey: this, path: this.path});

    return this;
  }

  /**
   * Method releasing the monkey from memory.
   */
  release() {

    // Unbinding events
    this.tree.off('write', this.writeListener);
    this.tree.off('_monkey', this.recursiveListener);
    this.state.killed = true;

    // Deleting properties
    // NOTE: not deleting this.definition because some strange things happen
    // in the _refreshMonkeys method. See #372.
    delete this.projection;
    delete this.depPaths;
    delete this.tree;
  }
}
