"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MonkeyDefinition = exports.Monkey = void 0;

var _type = _interopRequireDefault(require("./type"));

var _update2 = _interopRequireDefault(require("./update"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Monkey Definition class
 * Note: The only reason why this is a class is to be able to spot it within
 * otherwise ordinary data.
 *
 * @constructor
 * @param {array|object} definition - The formal definition of the monkey.
 */
var MonkeyDefinition = function MonkeyDefinition(definition) {
  var _this = this;

  _classCallCheck(this, MonkeyDefinition);

  var monkeyType = _type["default"].monkeyDefinition(definition);

  if (!monkeyType) throw (0, _helpers.makeError)('Baobab.monkey: invalid definition.', {
    definition: definition
  });
  this.type = monkeyType;

  if (this.type === 'object') {
    this.getter = definition.get;
    this.projection = definition.cursors || {};
    this.paths = Object.keys(this.projection).map(function (k) {
      return _this.projection[k];
    });
    this.options = definition.options || {};
  } else {
    var offset = 1,
        options = {};

    if (_type["default"].object(definition[definition.length - 1])) {
      offset++;
      options = definition[definition.length - 1];
    }

    this.getter = definition[definition.length - offset];
    this.projection = definition.slice(0, -offset);
    this.paths = this.projection;
    this.options = options;
  } // Coercing paths for convenience


  this.paths = this.paths.map(function (p) {
    return [].concat(p);
  }); // Does the definition contain dynamic paths

  this.hasDynamicPaths = this.paths.some(_type["default"].dynamicPath);
};
/**
 * Monkey core class
 *
 * @constructor
 * @param {Baobab}           tree       - The bound tree.
 * @param {MonkeyDefinition} definition - A definition instance.
 */


exports.MonkeyDefinition = MonkeyDefinition;

var Monkey = /*#__PURE__*/function () {
  function Monkey(tree, pathInTree, definition) {
    var _this2 = this;

    _classCallCheck(this, Monkey);

    // Properties
    this.tree = tree;
    this.path = pathInTree;
    this.definition = definition; // Adapting the definition's paths & projection to this monkey's case

    var projection = definition.projection,
        relative = _helpers.solveRelativePath.bind(null, pathInTree.slice(0, -1));

    if (definition.type === 'object') {
      this.projection = Object.keys(projection).reduce(function (acc, k) {
        acc[k] = relative(projection[k]);
        return acc;
      }, {});
      this.depPaths = Object.keys(this.projection).map(function (k) {
        return _this2.projection[k];
      });
    } else {
      this.projection = projection.map(relative);
      this.depPaths = this.projection;
    } // Internal state


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

    this.writeListener = function (_ref) {
      var path = _ref.data.path;
      if (_this2.state.killed) return; // Is the monkey affected by the current write event?

      var concerned = (0, _helpers.solveUpdate)([path], _this2.relatedPaths());
      if (concerned) _this2.update();
    };
    /**
     * Listener on the tree's `monkey` event.
     *
     * When another monkey updates, this listener will check whether the
     * updated paths are of any use to the monkey and, if so, will update the
     * tree's node where the monkey sits.
     */


    this.recursiveListener = function (_ref2) {
      var _ref2$data = _ref2.data,
          monkey = _ref2$data.monkey,
          path = _ref2$data.path;
      if (_this2.state.killed) return; // Breaking if this is the same monkey

      if (_this2 === monkey) return; // Is the monkey affected by the current monkey event?

      var concerned = (0, _helpers.solveUpdate)([path], _this2.relatedPaths(false));
      if (concerned) _this2.update();
    }; // Binding listeners


    this.tree.on('write', this.writeListener);
    this.tree.on('_monkey', this.recursiveListener); // Updating relevant node

    this.update();
  }
  /**
   * Method returning solved paths related to the monkey.
   *
   * @param  {boolean} recursive - Should we compute recursive paths?
   * @return {array}             - An array of related paths.
   */


  _createClass(Monkey, [{
    key: "relatedPaths",
    value: function relatedPaths() {
      var _this3 = this;

      var recursive = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var paths;
      if (this.definition.hasDynamicPaths) paths = this.depPaths.map(function (p) {
        return (0, _helpers.getIn)(_this3.tree._data, p).solvedPath;
      });else paths = this.depPaths;
      var isRecursive = recursive && this.depPaths.some(function (p) {
        return !!_type["default"].monkeyPath(_this3.tree._monkeys, p);
      });
      if (!isRecursive) return paths;
      return paths.reduce(function (accumulatedPaths, path) {
        var monkeyPath = _type["default"].monkeyPath(_this3.tree._monkeys, path);

        if (!monkeyPath) return accumulatedPaths.concat([path]); // Solving recursive path

        var relatedMonkey = (0, _helpers.getIn)(_this3.tree._monkeys, monkeyPath).data;
        return accumulatedPaths.concat(relatedMonkey.relatedPaths());
      }, []);
    }
    /**
     * Method used to update the tree's internal data with a lazy getter holding
     * the computed data.
     *
     * @return {Monkey} - Returns itself for chaining purposes.
     */

  }, {
    key: "update",
    value: function update() {
      var _this4 = this;

      var deps = this.tree.project(this.projection);

      var lazyGetter = function (tree, def, data) {
        var cache = null,
            alreadyComputed = false;
        return function () {
          if (!alreadyComputed) {
            cache = def.getter.apply(tree, def.type === 'object' ? [data] : data);
            if (tree.options.immutable && def.options.immutable !== false) (0, _helpers.deepFreeze)(cache); // update tree affected paths

            var hash = (0, _helpers.hashPath)(_this4.path);
            tree._affectedPathsIndex[hash] = true;
            alreadyComputed = true;
          }

          return cache;
        };
      }(this.tree, this.definition, deps);

      lazyGetter.isLazyGetter = true; // Should we write the lazy getter in the tree or solve it right now?

      if (this.tree.options.lazyMonkeys) {
        this.tree._data = (0, _update2["default"])(this.tree._data, this.path, {
          type: 'monkey',
          value: lazyGetter
        }, this.tree.options).data;
      } else {
        var result = (0, _update2["default"])(this.tree._data, this.path, {
          type: 'set',
          value: lazyGetter(),
          options: {
            mutableLeaf: !this.definition.options.immutable
          }
        }, this.tree.options);
        if ('data' in result) this.tree._data = result.data;
      } // Notifying the monkey's update so we can handle recursivity


      this.tree.emit('_monkey', {
        monkey: this,
        path: this.path
      });
      return this;
    }
    /**
     * Method releasing the monkey from memory.
     */

  }, {
    key: "release",
    value: function release() {
      // Unbinding events
      this.tree.off('write', this.writeListener);
      this.tree.off('_monkey', this.recursiveListener);
      this.state.killed = true; // Deleting properties
      // NOTE: not deleting this.definition because some strange things happen
      // in the _refreshMonkeys method. See #372.

      delete this.projection;
      delete this.depPaths;
      delete this.tree;
    }
  }]);

  return Monkey;
}();

exports.Monkey = Monkey;