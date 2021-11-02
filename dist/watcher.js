"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _emmett = _interopRequireDefault(require("emmett"));

var _cursor = _interopRequireDefault(require("./cursor"));

var _type = _interopRequireDefault(require("./type"));

var _helpers = require("./helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

/**
 * Watcher class.
 *
 * @constructor
 * @param {Baobab} tree     - The watched tree.
 * @param {object} mapping  - A mapping of the paths to watch in the tree.
 */
var Watcher = /*#__PURE__*/function (_Emitter) {
  _inherits(Watcher, _Emitter);

  var _super = _createSuper(Watcher);

  function Watcher(tree, mapping) {
    var _this;

    _classCallCheck(this, Watcher);

    _this = _super.call(this); // Properties

    _this.tree = tree;
    _this.mapping = null;
    _this.state = {
      killed: false
    }; // Initializing

    _this.refresh(mapping); // Listening


    _this.handler = function (e) {
      if (_this.state.killed) return;

      var watchedPaths = _this.getWatchedPaths();

      if ((0, _helpers.solveUpdate)(e.data.paths, watchedPaths)) return _this.emit('update');
    };

    _this.tree.on('update', _this.handler);

    return _this;
  }
  /**
   * Method used to get the current watched paths.
   *
   * @return {array} - The array of watched paths.
   */


  _createClass(Watcher, [{
    key: "getWatchedPaths",
    value: function getWatchedPaths() {
      var _this2 = this;

      var rawPaths = Object.keys(this.mapping).map(function (k) {
        var v = _this2.mapping[k]; // Watcher mappings can accept a cursor

        if (v instanceof _cursor["default"]) return v.solvedPath;
        return _this2.mapping[k];
      });
      return rawPaths.reduce(function (cp, p) {
        // Handling path polymorphisms
        p = [].concat(p); // Dynamic path?

        if (_type["default"].dynamicPath(p)) p = (0, _helpers.getIn)(_this2.tree._data, p).solvedPath;
        if (!p) return cp; // Facet path?

        var monkeyPath = _type["default"].monkeyPath(_this2.tree._monkeys, p);

        if (monkeyPath) return cp.concat((0, _helpers.getIn)(_this2.tree._monkeys, monkeyPath).data.relatedPaths());
        return cp.concat([p]);
      }, []);
    }
    /**
     * Method used to return a map of the watcher's cursors.
     *
     * @return {object} - TMap of relevant cursors.
     */

  }, {
    key: "getCursors",
    value: function getCursors() {
      var _this3 = this;

      var cursors = {};
      Object.keys(this.mapping).forEach(function (k) {
        var path = _this3.mapping[k];
        if (path instanceof _cursor["default"]) cursors[k] = path;else cursors[k] = _this3.tree.select(path);
      });
      return cursors;
    }
    /**
     * Method used to refresh the watcher's mapping.
     *
     * @param  {object}  mapping  - The new mapping to apply.
     * @return {Watcher}          - Itself for chaining purposes.
     */

  }, {
    key: "refresh",
    value: function refresh(mapping) {
      if (!_type["default"].watcherMapping(mapping)) throw (0, _helpers.makeError)('Baobab.watch: invalid mapping.', {
        mapping: mapping
      });
      this.mapping = mapping; // Creating the get method

      var projection = {};

      for (var k in mapping) {
        projection[k] = mapping[k] instanceof _cursor["default"] ? mapping[k].path : mapping[k];
      }

      this.get = this.tree.project.bind(this.tree, projection);
    }
    /**
     * Methods releasing the watcher from memory.
     */

  }, {
    key: "release",
    value: function release() {
      this.tree.off('update', this.handler);
      this.state.killed = true;
      this.kill();
    }
  }]);

  return Watcher;
}(_emmett["default"]);

exports["default"] = Watcher;