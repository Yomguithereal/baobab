"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Cursor", {
  enumerable: true,
  get: function get() {
    return _cursor["default"];
  }
});
Object.defineProperty(exports, "Monkey", {
  enumerable: true,
  get: function get() {
    return _monkey.Monkey;
  }
});
Object.defineProperty(exports, "MonkeyDefinition", {
  enumerable: true,
  get: function get() {
    return _monkey.MonkeyDefinition;
  }
});
exports.monkey = exports.helpers = exports.dynamic = exports["default"] = exports.VERSION = void 0;
Object.defineProperty(exports, "type", {
  enumerable: true,
  get: function get() {
    return _type["default"];
  }
});

var _emmett = _interopRequireDefault(require("emmett"));

var _cursor = _interopRequireDefault(require("./cursor"));

var _monkey = require("./monkey");

var _watcher = _interopRequireDefault(require("./watcher"));

var _type = _interopRequireDefault(require("./type"));

var _update2 = _interopRequireDefault(require("./update"));

var helpers = _interopRequireWildcard(require("./helpers"));

exports.helpers = helpers;

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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

var arrayFrom = helpers.arrayFrom,
    coercePath = helpers.coercePath,
    deepFreeze = helpers.deepFreeze,
    getIn = helpers.getIn,
    makeError = helpers.makeError,
    deepClone = helpers.deepClone,
    deepMerge = helpers.deepMerge,
    shallowClone = helpers.shallowClone,
    shallowMerge = helpers.shallowMerge,
    hashPath = helpers.hashPath;
/**
 * Baobab defaults
 */

var DEFAULTS = {
  // Should the tree handle its transactions on its own?
  autoCommit: true,
  // Should the transactions be handled asynchronously?
  asynchronous: true,
  // Should the tree's data be immutable?
  immutable: true,
  // Should the monkeys be lazy?
  lazyMonkeys: true,
  // Should we evaluate monkeys?
  monkeyBusiness: true,
  // Should the tree be persistent?
  persistent: true,
  // Should the tree's update be pure?
  pure: true,
  // Validation specifications
  validate: null,
  // Validation behavior 'rollback' or 'notify'
  validationBehavior: 'rollback'
};
/**
 * Baobab class
 *
 * @constructor
 * @param {object|array} [initialData={}]    - Initial data passed to the tree.
 * @param {object}       [opts]              - Optional options.
 * @param {boolean}      [opts.autoCommit]   - Should the tree auto-commit?
 * @param {boolean}      [opts.asynchronous] - Should the tree's transactions
 *                                             handled asynchronously?
 * @param {boolean}      [opts.immutable]    - Should the tree be immutable?
 * @param {boolean}      [opts.persistent]   - Should the tree be persistent?
 * @param {boolean}      [opts.pure]         - Should the tree be pure?
 * @param {function}     [opts.validate]     - Validation function.
 * @param {string}       [opts.validationBehaviour] - "rollback" or "notify".
 */

var Baobab = /*#__PURE__*/function (_Emitter) {
  _inherits(Baobab, _Emitter);

  var _super = _createSuper(Baobab);

  function Baobab(initialData, opts) {
    var _this;

    _classCallCheck(this, Baobab);

    _this = _super.call(this); // Setting initialData to an empty object if no data is provided by use

    if (arguments.length < 1) initialData = {}; // Checking whether given initial data is valid

    if (!_type["default"].object(initialData) && !_type["default"].array(initialData)) throw makeError('Baobab: invalid data.', {
      data: initialData
    }); // Merging given options with defaults

    _this.options = shallowMerge({}, DEFAULTS, opts); // Disabling immutability & persistence if persistence if disabled

    if (!_this.options.persistent) {
      _this.options.immutable = false;
      _this.options.pure = false;
    } // Privates


    _this._identity = '[object Baobab]';
    _this._cursors = {};
    _this._future = null;
    _this._transaction = [];
    _this._affectedPathsIndex = {};
    _this._monkeys = {};
    _this._previousData = null;
    _this._data = initialData; // Properties

    _this.root = new _cursor["default"](_assertThisInitialized(_this), [], 'λ');
    delete _this.root.release; // Does the user want an immutable tree?

    if (_this.options.immutable) deepFreeze(_this._data); // Bootstrapping root cursor's getters and setters

    var bootstrap = function bootstrap(name) {
      _this[name] = function () {
        var r = this.root[name].apply(this.root, arguments);
        return r instanceof _cursor["default"] ? this : r;
      };
    };

    ['apply', 'clone', 'concat', 'deepClone', 'deepMerge', 'exists', 'get', 'push', 'merge', 'pop', 'project', 'serialize', 'set', 'shift', 'splice', 'unset', 'unshift'].forEach(bootstrap); // Registering the initial monkeys

    if (_this.options.monkeyBusiness) {
      _this._refreshMonkeys();
    } // Initial validation


    var validationError = _this.validate();

    if (validationError) throw Error('Baobab: invalid data.', {
      error: validationError
    });
    return _this;
  }
  /**
   * Internal method used to refresh the tree's monkey register on every
   * update.
   * Note 1) For the time being, placing monkeys beneath array nodes is not
   * allowed for performance reasons.
   *
   * @param  {mixed}   node      - The starting node.
   * @param  {array}   path      - The starting node's path.
   * @param  {string}  operation - The operation that lead to a refreshment.
   * @return {Baobab}            - The tree instance for chaining purposes.
   */


  _createClass(Baobab, [{
    key: "_refreshMonkeys",
    value: function _refreshMonkeys(node, path, operation) {
      var _this2 = this;

      var clean = function clean(data) {
        var p = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        if (data instanceof _monkey.Monkey) {
          data.release();
          (0, _update2["default"])(_this2._monkeys, p, {
            type: 'unset'
          }, {
            immutable: false,
            persistent: false,
            pure: false
          });
          return;
        }

        if (_type["default"].object(data)) {
          for (var k in data) {
            clean(data[k], p.concat(k));
          }
        }
      };

      var walk = function walk(data) {
        var p = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        // Should we sit a monkey in the tree?
        if (data instanceof _monkey.MonkeyDefinition || data instanceof _monkey.Monkey) {
          var monkeyInstance = new _monkey.Monkey(_this2, p, data instanceof _monkey.Monkey ? data.definition : data);
          (0, _update2["default"])(_this2._monkeys, p, {
            type: 'set',
            value: monkeyInstance
          }, {
            immutable: false,
            persistent: false,
            pure: false
          });
          return;
        } // Object iteration


        if (_type["default"].object(data)) {
          for (var k in data) {
            walk(data[k], p.concat(k));
          }
        }
      }; // Walking the whole tree


      if (!arguments.length) {
        walk(this._data);
      } else {
        var monkeysNode = getIn(this._monkeys, path).data; // Is this required that we clean some already existing monkeys?

        if (monkeysNode) clean(monkeysNode, path); // Let's walk the tree only from the updated point

        if (operation !== 'unset') {
          walk(node, path);
        }
      }

      return this;
    }
    /**
     * Method used to validate the tree's data.
     *
     * @return {boolean} - Is the tree valid?
     */

  }, {
    key: "validate",
    value: function validate(affectedPaths) {
      var _this$options = this.options,
          validate = _this$options.validate,
          behavior = _this$options.validationBehavior;
      if (typeof validate !== 'function') return null;
      var error = validate.call(this, this._previousData, this._data, affectedPaths || [[]]);

      if (error instanceof Error) {
        if (behavior === 'rollback') {
          this._data = this._previousData;
          this._affectedPathsIndex = {};
          this._transaction = [];
          this._previousData = this._data;
        }

        this.emit('invalid', {
          error: error
        });
        return error;
      }

      return null;
    }
    /**
     * Method used to select data within the tree by creating a cursor. Cursors
     * are kept as singletons by the tree for performance and hygiene reasons.
     *
     * Arity (1):
     * @param {path}    path - Path to select in the tree.
     *
     * Arity (*):
     * @param {...step} path - Path to select in the tree.
     *
     * @return {Cursor}      - The resultant cursor.
     */

  }, {
    key: "select",
    value: function select(path) {
      // If no path is given, we simply return the root
      path = path || []; // Variadic

      if (arguments.length > 1) path = arrayFrom(arguments); // Checking that given path is valid

      if (!_type["default"].path(path)) throw makeError('Baobab.select: invalid path.', {
        path: path
      }); // Casting to array

      path = [].concat(path); // Computing hash (done here because it would be too late to do it in the
      // cursor's constructor since we need to hit the cursors' index first).

      var hash = hashPath(path); // Creating a new cursor or returning the already existing one for the
      // requested path.

      var cursor = this._cursors[hash];

      if (!cursor) {
        cursor = new _cursor["default"](this, path, hash);
        this._cursors[hash] = cursor;
      } // Emitting an event to notify that a part of the tree was selected


      this.emit('select', {
        path: path,
        cursor: cursor
      });
      return cursor;
    }
    /**
     * Method used to update the tree. Updates are simply expressed by a path,
     * dynamic or not, and an operation.
     *
     * This is where path solving should happen and not in the cursor.
     *
     * @param  {path}   path      - The path where we'll apply the operation.
     * @param  {object} operation - The operation to apply.
     * @return {mixed} - Return the result of the update.
     */

  }, {
    key: "update",
    value: function update(path, operation) {
      var _this3 = this;

      // Coercing path
      path = coercePath(path);
      if (!_type["default"].operationType(operation.type)) throw makeError("Baobab.update: unknown operation type \"".concat(operation.type, "\"."), {
        operation: operation
      }); // Solving the given path

      var _getIn = getIn(this._data, path),
          solvedPath = _getIn.solvedPath,
          exists = _getIn.exists; // If we couldn't solve the path, we throw


      if (!solvedPath) throw makeError('Baobab.update: could not solve the given path.', {
        path: solvedPath
      }); // Read-only path?

      var monkeyPath = _type["default"].monkeyPath(this._monkeys, solvedPath);

      if (monkeyPath && solvedPath.length > monkeyPath.length) throw makeError('Baobab.update: attempting to update a read-only path.', {
        path: solvedPath
      }); // We don't unset irrelevant paths

      if (operation.type === 'unset' && !exists) return; // If we merge data, we need to acknowledge monkeys

      var realOperation = operation;

      if (/merge/i.test(operation.type)) {
        var monkeysNode = getIn(this._monkeys, solvedPath).data;

        if (_type["default"].object(monkeysNode)) {
          // Cloning the operation not to create weird behavior for the user
          realOperation = shallowClone(realOperation); // Fetching the existing node in the current data

          var currentNode = getIn(this._data, solvedPath).data;
          if (/deep/i.test(realOperation.type)) realOperation.value = deepMerge({}, deepMerge({}, currentNode, deepClone(monkeysNode)), realOperation.value);else realOperation.value = shallowMerge({}, deepMerge({}, currentNode, deepClone(monkeysNode)), realOperation.value);
        }
      } // Stashing previous data if this is the frame's first update


      if (!this._transaction.length) this._previousData = this._data; // Applying the operation

      var result = (0, _update2["default"])(this._data, solvedPath, realOperation, this.options);
      var data = result.data,
          node = result.node; // If because of purity, the update was moot, we stop here

      if (!('data' in result)) return node; // If the operation is push, the affected path is slightly different

      var affectedPath = solvedPath.concat(operation.type === 'push' ? node.length - 1 : []);
      var hash = hashPath(affectedPath); // Updating data and transaction

      this._data = data;
      this._affectedPathsIndex[hash] = true;

      this._transaction.push(shallowMerge({}, operation, {
        path: affectedPath
      })); // Updating the monkeys


      if (this.options.monkeyBusiness) {
        this._refreshMonkeys(node, solvedPath, operation.type);
      } // Emitting a `write` event


      this.emit('write', {
        path: affectedPath
      }); // Should we let the user commit?

      if (!this.options.autoCommit) return node; // Should we update asynchronously?

      if (!this.options.asynchronous) {
        this.commit();
        return node;
      } // Updating asynchronously


      if (!this._future) this._future = setTimeout(function () {
        return _this3.commit();
      }, 0); // Finally returning the affected node

      return node;
    }
    /**
     * Method committing the updates of the tree and firing the tree's events.
     *
     * @return {Baobab} - The tree instance for chaining purposes.
     */

  }, {
    key: "commit",
    value: function commit() {
      // Do not fire update if the transaction is empty
      if (!this._transaction.length) return this; // Clearing timeout if one was defined

      if (this._future) this._future = clearTimeout(this._future);
      var affectedPaths = Object.keys(this._affectedPathsIndex).map(function (h) {
        return h !== 'λ' ? h.split('λ').slice(1) : [];
      }); // Is the tree still valid?

      var validationError = this.validate(affectedPaths);
      if (validationError) return this; // Caching to keep original references before we change them

      var transaction = this._transaction,
          previousData = this._previousData;
      this._affectedPathsIndex = {};
      this._transaction = [];
      this._previousData = this._data; // Emitting update event

      this.emit('update', {
        paths: affectedPaths,
        currentData: this._data,
        transaction: transaction,
        previousData: previousData
      });
      return this;
    }
    /**
     * Method returning a monkey at the given path or else `null`.
     *
     * @param  {path}        path - Path of the monkey to retrieve.
     * @return {Monkey|null}      - The Monkey instance of `null`.
     */

  }, {
    key: "getMonkey",
    value: function getMonkey(path) {
      path = coercePath(path);
      var monkey = getIn(this._monkeys, [].concat(path)).data;
      if (monkey instanceof _monkey.Monkey) return monkey;
      return null;
    }
    /**
     * Method used to watch a collection of paths within the tree. Very useful
     * to bind UI components and such to the tree.
     *
     * @param  {object} mapping - Mapping of paths to listen.
     * @return {Cursor}         - The created watcher.
     */

  }, {
    key: "watch",
    value: function watch(mapping) {
      return new _watcher["default"](this, mapping);
    }
    /**
     * Method releasing the tree and its attached data from memory.
     */

  }, {
    key: "release",
    value: function release() {
      var k;
      this.emit('release');
      delete this.root;
      delete this._data;
      delete this._previousData;
      delete this._transaction;
      delete this._affectedPathsIndex;
      delete this._monkeys; // Releasing cursors

      for (k in this._cursors) {
        this._cursors[k].release();
      }

      delete this._cursors; // Killing event emitter

      this.kill();
    }
    /**
     * Overriding the `toJSON` method for convenient use with JSON.stringify.
     *
     * @return {mixed} - Data at cursor.
     */

  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.serialize();
    }
    /**
     * Overriding the `toString` method for debugging purposes.
     *
     * @return {string} - The baobab's identity.
     */

  }, {
    key: "toString",
    value: function toString() {
      return this._identity;
    }
  }]);

  return Baobab;
}(_emmett["default"]);
/**
 * Monkey helper.
 */


Baobab.monkey = function () {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!args.length) throw new Error('Baobab.monkey: missing definition.');
  if (args.length === 1 && typeof args[0] !== 'function') return new _monkey.MonkeyDefinition(args[0]);
  return new _monkey.MonkeyDefinition(args);
};

Baobab.dynamicNode = Baobab.monkey;
var monkey = Baobab.monkey;
exports.monkey = monkey;
var dynamic = Baobab.dynamic;
/**
 * Exposing some internals for convenience
 */

exports.dynamic = dynamic;

/**
 * Version.
 */
Baobab.VERSION = '2.6.1';
var VERSION = Baobab.VERSION;
/**
 * Exporting.
 */

exports.VERSION = VERSION;
var _default = Baobab; // export * from './sbaobab';

exports["default"] = _default;
for (var exportedName in exports)
  Baobab[exportedName] = exports[exportedName];

module.exports = Baobab;
