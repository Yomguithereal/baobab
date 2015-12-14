/* baobab.js - Version: 2.2.0 - Author: Yomguithereal (Guillaume Plique) */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Baobab = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  'use strict';

  /**
   * Here is the list of every allowed parameter when using Emitter#on:
   * @type {Object}
   */
  var __allowedOptions = {
    once: 'boolean',
    scope: 'object'
  };

  /**
   * Incremental id used to order event handlers.
   */
  var __order = 0;

  /**
   * A simple helper to shallowly merge two objects. The second one will "win"
   * over the first one.
   *
   * @param  {object}  o1 First target object.
   * @param  {object}  o2 Second target object.
   * @return {object}     Returns the merged object.
   */
  function shallowMerge(o1, o2) {
    var o = {},
        k;

    for (k in o1) o[k] = o1[k];
    for (k in o2) o[k] = o2[k];

    return o;
  }

  /**
   * Is the given variable a plain JavaScript object?
   *
   * @param  {mixed}  v   Target.
   * @return {boolean}    The boolean result.
   */
  function isPlainObject(v) {
    return v &&
           typeof v === 'object' &&
           !Array.isArray(v) &&
           !(v instanceof Function) &&
           !(v instanceof RegExp);
  }

  /**
   * Iterate over an object that may have ES6 Symbols.
   *
   * @param  {object}   object  Object on which to iterate.
   * @param  {function} fn      Iterator function.
   * @param  {object}   [scope] Optional scope.
   */
  function forIn(object, fn, scope) {
    var symbols,
        k,
        i,
        l;

    for (k in object)
      fn.call(scope || null, k, object[k]);

    if (Object.getOwnPropertySymbols) {
      symbols = Object.getOwnPropertySymbols(object);

      for (i = 0, l = symbols.length; i < l; i++)
        fn.call(scope || null, symbols[i], object[symbols[i]]);
    }
  }

  /**
   * The emitter's constructor. It initializes the handlers-per-events store and
   * the global handlers store.
   *
   * Emitters are useful for non-DOM events communication. Read its methods
   * documentation for more information about how it works.
   *
   * @return {Emitter}         The fresh new instance.
   */
  var Emitter = function() {
    this._enabled = true;

    // Dirty trick that will set the necessary properties to the emitter
    this.unbindAll();
  };

  /**
   * This method unbinds every handlers attached to every or any events. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Usage:
   * ******
   * > myEmitter.unbindAll();
   *
   * @return {Emitter}      Returns this.
   */
  Emitter.prototype.unbindAll = function() {

    this._handlers = {};
    this._handlersAll = [];
    this._handlersComplex = [];

    return this;
  };


  /**
   * This method binds one or more functions to the emitter, handled to one or a
   * suite of events. So, these functions will be executed anytime one related
   * event is emitted.
   *
   * It is also possible to bind a function to any emitted event by not
   * specifying any event to bind the function to.
   *
   * Recognized options:
   * *******************
   *  - {?boolean} once   If true, the handlers will be unbound after the first
   *                      execution. Default value: false.
   *  - {?object}  scope  If a scope is given, then the listeners will be called
   *                      with this scope as "this".
   *
   * Variant 1:
   * **********
   * > myEmitter.on('myEvent', function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on('myEvent', function(e) { console.log(e); }, { once: true });
   *
   * @param  {string}   event   The event to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >);
   * > // Or:
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >   { once: true }}
   * >);
   *
   * @param  {array}    events  The events to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > });
   * > // Or:
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > }, { once: true });
   *
   * @param  {object}  bindings An object containing pairs event / function.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.on(function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on(function(e) { console.log(e); }, { once: true});
   *
   * @param  {function} handler The function to bind to every events.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   */
  Emitter.prototype.on = function(a, b, c) {
    var i,
        l,
        k,
        event,
        eArray,
        handlersList,
        bindingObject;

    // Variant 3
    if (isPlainObject(a)) {
      forIn(a, function(name, fn) {
        this.on(name, fn, b);
      }, this);

      return this;
    }

    // Variant 1, 2 and 4
    if (typeof a === 'function') {
      c = b;
      b = a;
      a = null;
    }

    eArray = [].concat(a);

    for (i = 0, l = eArray.length; i < l; i++) {
      event = eArray[i];

      bindingObject = {
        order: __order++,
        fn: b
      };

      // Defining the list in which the handler should be inserted
      if (typeof event === 'string' || typeof event === 'symbol') {
        if (!this._handlers[event])
          this._handlers[event] = [];
        handlersList = this._handlers[event];
        bindingObject.type = event;
      }
      else if (event instanceof RegExp) {
        handlersList = this._handlersComplex;
        bindingObject.pattern = event;
      }
      else if (event === null) {
        handlersList = this._handlersAll;
      }
      else {
        throw Error('Emitter.on: invalid event.');
      }

      // Appending needed properties
      for (k in c || {})
        if (__allowedOptions[k])
          bindingObject[k] = c[k];

      handlersList.push(bindingObject);
    }

    return this;
  };


  /**
   * This method works exactly as the previous #on, but will add an options
   * object if none is given, and set the option "once" to true.
   *
   * The polymorphism works exactly as with the #on method.
   */
  Emitter.prototype.once = function() {
    var args = Array.prototype.slice.call(arguments),
        li = args.length - 1;

    if (isPlainObject(args[li]) && args.length > 1)
      args[li] = shallowMerge(args[li], {once: true});
    else
      args.push({once: true});

    return this.on.apply(this, args);
  };


  /**
   * This method unbinds one or more functions from events of the emitter. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Variant 1:
   * **********
   * > myEmitter.off('myEvent', myHandler);
   *
   * @param  {string}   event   The event to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.off(['myEvent1', 'myEvent2'], myHandler);
   *
   * @param  {array}    events  The events to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.off({
   * >   myEvent1: myHandler1,
   * >   myEvent2: myHandler2
   * > });
   *
   * @param  {object} bindings An object containing pairs event / function.
   * @return {Emitter}         Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.off(myHandler);
   *
   * @param  {function} handler The function to unbind from every events.
   * @return {Emitter}          Returns this.
   *
   * Variant 5:
   * **********
   * > myEmitter.off(event);
   *
   * @param  {string} event     The event we should unbind.
   * @return {Emitter}          Returns this.
   */
  function filter(target, fn) {
    target = target || [];

    var a = [],
        l,
        i;

    for (i = 0, l = target.length; i < l; i++)
      if (target[i].fn !== fn)
        a.push(target[i]);

    return a;
  }

  Emitter.prototype.off = function(events, fn) {
    var i,
        n,
        k,
        event;

    // Variant 4:
    if (arguments.length === 1 && typeof events === 'function') {
      fn = arguments[0];

      // Handlers bound to events:
      for (k in this._handlers) {
        this._handlers[k] = filter(this._handlers[k], fn);

        if (this._handlers[k].length === 0)
          delete this._handlers[k];
      }

      // Generic Handlers
      this._handlersAll = filter(this._handlersAll, fn);

      // Complex handlers
      this._handlersComplex = filter(this._handlersComplex, fn);
    }

    // Variant 5
    else if (arguments.length === 1 &&
             (typeof events === 'string' || typeof events === 'symbol')) {
      delete this._handlers[events];
    }

    // Variant 1 and 2:
    else if (arguments.length === 2) {
      var eArray = [].concat(events);

      for (i = 0, n = eArray.length; i < n; i++) {
        event = eArray[i];

        this._handlers[event] = filter(this._handlers[event], fn);

        if ((this._handlers[event] || []).length === 0)
          delete this._handlers[event];
      }
    }

    // Variant 3
    else if (isPlainObject(events)) {
      forIn(events, this.off, this);
    }

    return this;
  };

  /**
   * This method retrieve the listeners attached to a particular event.
   *
   * @param  {?string}    Name of the event.
   * @return {array}      Array of handler functions.
   */
  Emitter.prototype.listeners = function(event) {
    var handlers = this._handlersAll || [],
        complex = false,
        h,
        i,
        l;

    if (!event)
      throw Error('Emitter.listeners: no event provided.');

    handlers = handlers.concat(this._handlers[event] || []);

    for (i = 0, l = this._handlersComplex.length; i < l; i++) {
      h = this._handlersComplex[i];

      if (~event.search(h.pattern)) {
        complex = true;
        handlers.push(h);
      }
    }

    // If we have any complex handlers, we need to sort
    if (this._handlersAll.length || complex)
      return handlers.sort(function(a, b) {
        return a.order - b.order;
      });
    else
      return handlers.slice(0);
  };

  /**
   * This method emits the specified event(s), and executes every handlers bound
   * to the event(s).
   *
   * Use cases:
   * **********
   * > myEmitter.emit('myEvent');
   * > myEmitter.emit('myEvent', myData);
   * > myEmitter.emit(['myEvent1', 'myEvent2']);
   * > myEmitter.emit(['myEvent1', 'myEvent2'], myData);
   * > myEmitter.emit({myEvent1: myData1, myEvent2: myData2});
   *
   * @param  {string|array} events The event(s) to emit.
   * @param  {object?}      data   The data.
   * @return {Emitter}             Returns this.
   */
  Emitter.prototype.emit = function(events, data) {

    // Short exit if the emitter is disabled
    if (!this._enabled)
      return this;

    // Object variant
    if (isPlainObject(events)) {
      forIn(events, this.emit, this);
      return this;
    }

    var eArray = [].concat(events),
        onces = [],
        event,
        parent,
        handlers,
        handler,
        i,
        j,
        l,
        m;

    for (i = 0, l = eArray.length; i < l; i++) {
      handlers = this.listeners(eArray[i]);

      for (j = 0, m = handlers.length; j < m; j++) {
        handler = handlers[j];
        event = {
          type: eArray[i],
          target: this
        };

        if (arguments.length > 1)
          event.data = data;

        handler.fn.call('scope' in handler ? handler.scope : this, event);

        if (handler.once)
          onces.push(handler);
      }

      // Cleaning onces
      for (j = onces.length - 1; j >= 0; j--) {
        parent = onces[j].type ?
          this._handlers[onces[j].type] :
          onces[j].pattern ?
            this._handlersComplex :
            this._handlersAll;

        parent.splice(parent.indexOf(onces[j]), 1);
      }
    }

    return this;
  };


  /**
   * This method will unbind all listeners and make it impossible to ever
   * rebind any listener to any event.
   */
  Emitter.prototype.kill = function() {

    this.unbindAll();
    this._handlers = null;
    this._handlersAll = null;
    this._handlersComplex = null;
    this._enabled = false;

    // Nooping methods
    this.unbindAll =
    this.on =
    this.once =
    this.off =
    this.emit =
    this.listeners = Function.prototype;
  };


  /**
   * This method disabled the emitter, which means its emit method will do
   * nothing.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.disable = function() {
    this._enabled = false;

    return this;
  };


  /**
   * This method enables the emitter.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.enable = function() {
    this._enabled = true;

    return this;
  };


  /**
   * Version:
   */
  Emitter.version = '3.1.1';


  // Export:
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = Emitter;
    exports.Emitter = Emitter;
  } else if (typeof define === 'function' && define.amd)
    define('emmett', [], function() {
      return Emitter;
    });
  else
    this.Emitter = Emitter;
}).call(this);

},{}],2:[function(require,module,exports){
/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors.
 */
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _emmett = require('emmett');

var _emmett2 = _interopRequireDefault(_emmett);

var _cursor = require('./cursor');

var _cursor2 = _interopRequireDefault(_cursor);

var _monkey = require('./monkey');

var _watcher = require('./watcher');

var _watcher2 = _interopRequireDefault(_watcher);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _update2 = require('./update');

var _update3 = _interopRequireDefault(_update2);

var _helpers = require('./helpers');

var helpers = _interopRequireWildcard(_helpers);

var arrayFrom = helpers.arrayFrom;
var coercePath = helpers.coercePath;
var deepFreeze = helpers.deepFreeze;
var getIn = helpers.getIn;
var makeError = helpers.makeError;
var deepMerge = helpers.deepMerge;
var shallowClone = helpers.shallowClone;
var shallowMerge = helpers.shallowMerge;
var uniqid = helpers.uniqid;

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
 * Function returning a string hash from a non-dynamic path expressed as an
 * array.
 *
 * @param  {array}  path - The path to hash.
 * @return {string} string - The resultant hash.
 */
function hashPath(path) {
  return 'λ' + path.map(function (step) {
    if (_type2['default']['function'](step) || _type2['default'].object(step)) return '#' + uniqid() + '#';

    return step;
  }).join('λ');
}

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

var Baobab = (function (_Emitter) {
  _inherits(Baobab, _Emitter);

  function Baobab(initialData, opts) {
    var _this = this;

    _classCallCheck(this, Baobab);

    _Emitter.call(this);

    // Setting initialData to an empty object if no data is provided by use
    if (arguments.length < 1) initialData = {};

    // Checking whether given initial data is valid
    if (!_type2['default'].object(initialData) && !_type2['default'].array(initialData)) throw makeError('Baobab: invalid data.', { data: initialData });

    // Merging given options with defaults
    this.options = shallowMerge({}, DEFAULTS, opts);

    // Disabling immutability & persistence if persistence if disabled
    if (!this.options.persistent) {
      this.options.immutable = false;
      this.options.pure = false;
    }

    // Privates
    this._identity = '[object Baobab]';
    this._cursors = {};
    this._future = null;
    this._transaction = [];
    this._affectedPathsIndex = {};
    this._monkeys = {};
    this._previousData = null;
    this._data = initialData;

    // Properties
    this.root = new _cursor2['default'](this, [], 'λ');
    delete this.root.release;

    // Does the user want an immutable tree?
    if (this.options.immutable) deepFreeze(this._data);

    // Bootstrapping root cursor's getters and setters
    var bootstrap = function bootstrap(name) {
      _this[name] = function () {
        var r = this.root[name].apply(this.root, arguments);
        return r instanceof _cursor2['default'] ? this : r;
      };
    };

    ['apply', 'concat', 'deepMerge', 'exists', 'get', 'push', 'merge', 'project', 'serialize', 'set', 'splice', 'unset', 'unshift'].forEach(bootstrap);

    // Registering the initial monkeys
    this._refreshMonkeys();

    // Initial validation
    var validationError = this.validate();

    if (validationError) throw Error('Baobab: invalid data.', { error: validationError });
  }

  /**
   * Creating statics
   */

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

  Baobab.prototype._refreshMonkeys = function _refreshMonkeys(node, path, operation) {
    var _this2 = this;

    var clean = function clean(data) {
      var p = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      if (data instanceof _monkey.Monkey) {
        data.release();
        _update3['default'](_this2._monkeys, p, { type: 'unset' }, {
          immutable: false,
          persistent: false,
          pure: false
        });

        return;
      }

      if (_type2['default'].object(data)) {
        for (var k in data) {
          clean(data[k], p.concat(k));
        }
      }
    };

    var register = [];

    var walk = function walk(data) {
      var p = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      // Should we sit a monkey in the tree?
      if (data instanceof _monkey.MonkeyDefinition || data instanceof _monkey.Monkey) {
        var monkey = new _monkey.Monkey(_this2, p, data instanceof _monkey.Monkey ? data.definition : data);

        register.push(monkey);

        _update3['default'](_this2._monkeys, p, { type: 'set', value: monkey }, {
          immutable: false,
          persistent: false,
          pure: false
        });

        return;
      }

      // Object iteration
      if (_type2['default'].object(data)) {
        for (var k in data) {
          walk(data[k], p.concat(k));
        }
      }
    };

    // Walking the whole tree
    if (!arguments.length) {
      walk(this._data);
      register.forEach(function (m) {
        return m.checkRecursivity();
      });
    } else {
      var monkeysNode = getIn(this._monkeys, path).data;

      // Is this required that we clean some already existing monkeys?
      if (monkeysNode) clean(monkeysNode, path);

      // Let's walk the tree only from the updated point
      if (operation !== 'unset') {
        walk(node, path);
        register.forEach(function (m) {
          return m.checkRecursivity();
        });
      }
    }

    return this;
  };

  /**
   * Method used to validate the tree's data.
   *
   * @return {boolean} - Is the tree valid?
   */

  Baobab.prototype.validate = function validate(affectedPaths) {
    var _options = this.options;
    var validate = _options.validate;
    var behavior = _options.validationBehavior;

    if (typeof validate !== 'function') return null;

    var error = validate.call(this, this._previousData, this._data, affectedPaths || [[]]);

    if (error instanceof Error) {

      if (behavior === 'rollback') {
        this._data = this._previousData;
        this._affectedPathsIndex = {};
        this._transaction = [];
        this._previousData = this._data;
      }

      this.emit('invalid', { error: error });

      return error;
    }

    return null;
  };

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

  Baobab.prototype.select = function select(path) {

    // If no path is given, we simply return the root
    path = path || [];

    // Variadic
    if (arguments.length > 1) path = arrayFrom(arguments);

    // Checking that given path is valid
    if (!_type2['default'].path(path)) throw makeError('Baobab.select: invalid path.', { path: path });

    // Casting to array
    path = [].concat(path);

    // Computing hash (done here because it would be too late to do it in the
    // cursor's constructor since we need to hit the cursors' index first).
    var hash = hashPath(path);

    // Creating a new cursor or returning the already existing one for the
    // requested path.
    var cursor = this._cursors[hash];

    if (!cursor) {
      cursor = new _cursor2['default'](this, path, hash);
      this._cursors[hash] = cursor;
    }

    // Emitting an event to notify that a part of the tree was selected
    this.emit('select', { path: path, cursor: cursor });
    return cursor;
  };

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

  Baobab.prototype.update = function update(path, operation) {
    var _this3 = this;

    // Coercing path
    path = coercePath(path);

    if (!_type2['default'].operationType(operation.type)) throw makeError('Baobab.update: unknown operation type "' + operation.type + '".', { operation: operation });

    // Solving the given path

    var _getIn = getIn(this._data, path);

    var solvedPath = _getIn.solvedPath;
    var exists = _getIn.exists;

    // If we couldn't solve the path, we throw
    if (!solvedPath) throw makeError('Baobab.update: could not solve the given path.', {
      path: solvedPath
    });

    // Read-only path?
    var monkeyPath = _type2['default'].monkeyPath(this._monkeys, solvedPath);
    if (monkeyPath && solvedPath.length > monkeyPath.length) throw makeError('Baobab.update: attempting to update a read-only path.', {
      path: solvedPath
    });

    // We don't unset irrelevant paths
    if (operation.type === 'unset' && !exists) return;

    // If we merge data, we need to acknowledge monkeys
    var realOperation = operation;
    if (/merge/.test(operation.type)) {
      var monkeysNode = getIn(this._monkeys, solvedPath).data;

      if (_type2['default'].object(monkeysNode)) {
        realOperation = shallowClone(realOperation);

        if (/deep/.test(realOperation.type)) realOperation.value = deepMerge({}, monkeysNode, realOperation.value);else realOperation.value = shallowMerge({}, monkeysNode, realOperation.value);
      }
    }

    // Stashing previous data if this is the frame's first update
    if (!this._transaction.length) this._previousData = this._data;

    // Applying the operation
    var result = _update3['default'](this._data, solvedPath, realOperation, this.options);

    var data = result.data;
    var node = result.node;

    // If because of purity, the update was moot, we stop here
    if (!('data' in result)) return node;

    // If the operation is push, the affected path is slightly different
    var affectedPath = solvedPath.concat(operation.type === 'push' ? node.length - 1 : []);

    var hash = hashPath(affectedPath);

    // Updating data and transaction
    this._data = data;
    this._affectedPathsIndex[hash] = true;
    this._transaction.push(_extends({}, operation, { path: affectedPath }));

    // Updating the monkeys
    this._refreshMonkeys(node, solvedPath, operation.type);

    // Emitting a `write` event
    this.emit('write', { path: affectedPath });

    // Should we let the user commit?
    if (!this.options.autoCommit) return node;

    // Should we update asynchronously?
    if (!this.options.asynchronous) {
      this.commit();
      return node;
    }

    // Updating asynchronously
    if (!this._future) this._future = setTimeout(function () {
      return _this3.commit();
    }, 0);

    // Finally returning the affected node
    return node;
  };

  /**
   * Method committing the updates of the tree and firing the tree's events.
   *
   * @return {Baobab} - The tree instance for chaining purposes.
   */

  Baobab.prototype.commit = function commit() {

    // Clearing timeout if one was defined
    if (this._future) this._future = clearTimeout(this._future);

    var affectedPaths = Object.keys(this._affectedPathsIndex).map(function (h) {
      return h !== 'λ' ? h.split('λ').slice(1) : [];
    });

    // Is the tree still valid?
    var validationError = this.validate(affectedPaths);

    if (validationError) return this;

    // Caching to keep original references before we change them
    var transaction = this._transaction,
        previousData = this._previousData;

    this._affectedPathsIndex = {};
    this._transaction = [];
    this._previousData = this._data;

    // Emitting update event
    this.emit('update', {
      paths: affectedPaths,
      currentData: this._data,
      transaction: transaction,
      previousData: previousData
    });

    return this;
  };

  /**
   * Method used to watch a collection of paths within the tree. Very useful
   * to bind UI components and such to the tree.
   *
   * @param  {object} mapping - Mapping of paths to listen.
   * @return {Cursor}         - The created watcher.
   */

  Baobab.prototype.watch = function watch(mapping) {
    return new _watcher2['default'](this, mapping);
  };

  /**
   * Method releasing the tree and its attached data from memory.
   */

  Baobab.prototype.release = function release() {
    var k = undefined;

    this.emit('release');

    delete this.root;

    delete this._data;
    delete this._previousData;
    delete this._transaction;
    delete this._affectedPathsIndex;
    delete this._monkeys;

    // Releasing cursors
    for (k in this._cursors) this._cursors[k].release();
    delete this._cursors;

    // Killing event emitter
    this.kill();
  };

  /**
   * Overriding the `toJSON` method for convenient use with JSON.stringify.
   *
   * @return {mixed} - Data at cursor.
   */

  Baobab.prototype.toJSON = function toJSON() {
    return this.serialize();
  };

  /**
   * Overriding the `toString` method for debugging purposes.
   *
   * @return {string} - The baobab's identity.
   */

  Baobab.prototype.toString = function toString() {
    return this._identity;
  };

  return Baobab;
})(_emmett2['default']);

exports['default'] = Baobab;
Baobab.monkey = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!args.length) throw new Error('Baobab.monkey: missing definition.');

  if (args.length === 1) return new _monkey.MonkeyDefinition(args[0]);

  return new _monkey.MonkeyDefinition(args);
};
Baobab.dynamicNode = Baobab.monkey;

/**
 * Exposing some internals for convenience
 */
Baobab.Cursor = _cursor2['default'];
Baobab.MonkeyDefinition = _monkey.MonkeyDefinition;
Baobab.Monkey = _monkey.Monkey;
Baobab.type = _type2['default'];
Baobab.helpers = helpers;

/**
 * Version
 */
Object.defineProperty(Baobab, 'version', {
  value: '2.2.0'
});

/**
 * Exporting
 */
exports['default'] = Baobab;
module.exports = exports['default'];

},{"./cursor":3,"./helpers":4,"./monkey":5,"./type":6,"./update":7,"./watcher":8,"emmett":1}],3:[function(require,module,exports){
/**
 * Baobab Cursors
 * ===============
 *
 * Cursors created by selecting some data within a Baobab tree.
 */
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _emmett = require('emmett');

var _emmett2 = _interopRequireDefault(_emmett);

var _monkey = require('./monkey');

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _helpers = require('./helpers');

/**
 * Traversal helper function for dynamic cursors. Will throw a legible error
 * if traversal is not possible.
 *
 * @param {string} method     - The method name, to create a correct error msg.
 * @param {array}  solvedPath - The cursor's solved path.
 */
function checkPossibilityOfDynamicTraversal(method, solvedPath) {
  if (!solvedPath) throw _helpers.makeError('Baobab.Cursor.' + method + ': ' + ('cannot use ' + method + ' on an unresolved dynamic path.'), { path: solvedPath });
}

/**
 * Cursor class
 *
 * @constructor
 * @param {Baobab} tree   - The cursor's root.
 * @param {array}  path   - The cursor's path in the tree.
 * @param {string} hash   - The path's hash computed ahead by the tree.
 */

var Cursor = (function (_Emitter) {
  _inherits(Cursor, _Emitter);

  function Cursor(tree, path, hash) {
    var _this = this;

    _classCallCheck(this, Cursor);

    _Emitter.call(this);

    // If no path were to be provided, we fallback to an empty path (root)
    path = path || [];

    // Privates
    this._identity = '[object Cursor]';
    this._archive = null;

    // Properties
    this.tree = tree;
    this.path = path;
    this.hash = hash;

    // State
    this.state = {
      killed: false,
      recording: false,
      undoing: false
    };

    // Checking whether the given path is dynamic or not
    this._dynamicPath = _type2['default'].dynamicPath(this.path);

    // Checking whether the given path will meet a monkey
    this._monkeyPath = _type2['default'].monkeyPath(this.tree._monkeys, this.path);

    if (!this._dynamicPath) this.solvedPath = this.path;else this.solvedPath = _helpers.getIn(this.tree._data, this.path).solvedPath;

    /**
     * Listener bound to the tree's writes so that cursors with dynamic paths
     * may update their solved path correctly.
     *
     * @param {object} event - The event fired by the tree.
     */
    this._writeHandler = function (_ref) {
      var data = _ref.data;

      if (_this.state.killed || !_helpers.solveUpdate([data.path], _this._getComparedPaths())) return;

      _this.solvedPath = _helpers.getIn(_this.tree._data, _this.path).solvedPath;
    };

    /**
     * Function in charge of actually trigger the cursor's updates and
     * deal with the archived records.
     *
     * @note: probably should wrap the current solvedPath in closure to avoid
     * for tricky cases where it would fail.
     *
     * @param {mixed} previousData - the tree's previous data.
     */
    var fireUpdate = function fireUpdate(previousData) {
      var self = _this;

      var eventData = Object.defineProperties({}, {
        previousData: {
          get: function get() {
            return _helpers.getIn(previousData, self.solvedPath).data;
          },
          configurable: true,
          enumerable: true
        },
        currentData: {
          get: function get() {
            return self.get();
          },
          configurable: true,
          enumerable: true
        }
      });

      if (_this.state.recording && !_this.state.undoing) _this.archive.add(eventData.previousData);

      _this.state.undoing = false;

      return _this.emit('update', eventData);
    };

    /**
     * Listener bound to the tree's updates and determining whether the
     * cursor is affected and should react accordingly.
     *
     * Note that this listener is lazily bound to the tree to be sure
     * one wouldn't leak listeners when only creating cursors for convenience
     * and not to listen to updates specifically.
     *
     * @param {object} event - The event fired by the tree.
     */
    this._updateHandler = function (event) {
      if (_this.state.killed) return;

      var _event$data = event.data;
      var paths = _event$data.paths;
      var previousData = _event$data.previousData;
      var update = fireUpdate.bind(_this, previousData);
      var comparedPaths = _this._getComparedPaths();

      if (_helpers.solveUpdate(paths, comparedPaths)) return update();
    };

    // Lazy binding
    var bound = false;
    this._lazyBind = function () {
      if (bound) return;

      bound = true;

      if (_this._dynamicPath) _this.tree.on('write', _this._writeHandler);

      return _this.tree.on('update', _this._updateHandler);
    };

    // If the path is dynamic, we actually need to listen to the tree
    if (this._dynamicPath) {
      this._lazyBind();
    } else {

      // Overriding the emitter `on` and `once` methods
      this.on = _helpers.before(this._lazyBind, this.on.bind(this));
      this.once = _helpers.before(this._lazyBind, this.once.bind(this));
    }
  }

  /**
   * Method used to allow iterating over cursors containing list-type data.
   *
   * e.g. for(let i of cursor) { ... }
   *
   * @returns {object} -  Each item sequentially.
   */

  /**
   * Internal helpers
   * -----------------
   */

  /**
   * Method returning the paths of the tree watched over by the cursor and that
   * should be taken into account when solving a potential update.
   *
   * @return {array} - Array of paths to compare with a given update.
   */

  Cursor.prototype._getComparedPaths = function _getComparedPaths() {

    // Checking whether we should keep track of some dependencies
    var additionalPaths = this._monkeyPath ? _helpers.getIn(this.tree._monkeys, this._monkeyPath).data.relatedPaths() : [];

    return [this.solvedPath].concat(additionalPaths);
  };

  /**
   * Predicates
   * -----------
   */

  /**
   * Method returning whether the cursor is at root level.
   *
   * @return {boolean} - Is the cursor the root?
   */

  Cursor.prototype.isRoot = function isRoot() {
    return !this.path.length;
  };

  /**
   * Method returning whether the cursor is at leaf level.
   *
   * @return {boolean} - Is the cursor a leaf?
   */

  Cursor.prototype.isLeaf = function isLeaf() {
    return _type2['default'].primitive(this._get().data);
  };

  /**
   * Method returning whether the cursor is at branch level.
   *
   * @return {boolean} - Is the cursor a branch?
   */

  Cursor.prototype.isBranch = function isBranch() {
    return !this.isRoot() && !this.isLeaf();
  };

  /**
   * Traversal Methods
   * ------------------
   */

  /**
   * Method returning the root cursor.
   *
   * @return {Baobab} - The root cursor.
   */

  Cursor.prototype.root = function root() {
    return this.tree.select();
  };

  /**
   * Method selecting a subpath as a new cursor.
   *
   * Arity (1):
   * @param  {path} path    - The path to select.
   *
   * Arity (*):
   * @param  {...step} path - The path to select.
   *
   * @return {Cursor}       - The created cursor.
   */

  Cursor.prototype.select = function select(path) {
    if (arguments.length > 1) path = _helpers.arrayFrom(arguments);

    return this.tree.select(this.path.concat(path));
  };

  /**
   * Method returning the parent node of the cursor or else `null` if the
   * cursor is already at root level.
   *
   * @return {Baobab} - The parent cursor.
   */

  Cursor.prototype.up = function up() {
    if (!this.isRoot()) return this.tree.select(this.path.slice(0, -1));

    return null;
  };

  /**
   * Method returning the child node of the cursor.
   *
   * @return {Baobab} - The child cursor.
   */

  Cursor.prototype.down = function down() {
    checkPossibilityOfDynamicTraversal('down', this.solvedPath);

    if (!(this._get().data instanceof Array)) throw Error('Baobab.Cursor.down: cannot go down on a non-list type.');

    return this.tree.select(this.solvedPath.concat(0));
  };

  /**
   * Method returning the left sibling node of the cursor if this one is
   * pointing at a list. Returns `null` if this cursor is already leftmost.
   *
   * @return {Baobab} - The left sibling cursor.
   */

  Cursor.prototype.left = function left() {
    checkPossibilityOfDynamicTraversal('left', this.solvedPath);

    var last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last)) throw Error('Baobab.Cursor.left: cannot go left on a non-list type.');

    return last ? this.tree.select(this.solvedPath.slice(0, -1).concat(last - 1)) : null;
  };

  /**
   * Method returning the right sibling node of the cursor if this one is
   * pointing at a list. Returns `null` if this cursor is already rightmost.
   *
   * @return {Baobab} - The right sibling cursor.
   */

  Cursor.prototype.right = function right() {
    checkPossibilityOfDynamicTraversal('right', this.solvedPath);

    var last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last)) throw Error('Baobab.Cursor.right: cannot go right on a non-list type.');

    if (last + 1 === this.up()._get().data.length) return null;

    return this.tree.select(this.solvedPath.slice(0, -1).concat(last + 1));
  };

  /**
   * Method returning the leftmost sibling node of the cursor if this one is
   * pointing at a list.
   *
   * @return {Baobab} - The leftmost sibling cursor.
   */

  Cursor.prototype.leftmost = function leftmost() {
    checkPossibilityOfDynamicTraversal('leftmost', this.solvedPath);

    var last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last)) throw Error('Baobab.Cursor.leftmost: cannot go left on a non-list type.');

    return this.tree.select(this.solvedPath.slice(0, -1).concat(0));
  };

  /**
   * Method returning the rightmost sibling node of the cursor if this one is
   * pointing at a list.
   *
   * @return {Baobab} - The rightmost sibling cursor.
   */

  Cursor.prototype.rightmost = function rightmost() {
    checkPossibilityOfDynamicTraversal('rightmost', this.solvedPath);

    var last = +this.solvedPath[this.solvedPath.length - 1];

    if (isNaN(last)) throw Error('Baobab.Cursor.rightmost: cannot go right on a non-list type.');

    var list = this.up()._get().data;

    return this.tree.select(this.solvedPath.slice(0, -1).concat(list.length - 1));
  };

  /**
   * Method mapping the children nodes of the cursor.
   *
   * @param  {function} fn      - The function to map.
   * @param  {object}   [scope] - An optional scope.
   * @return {array}            - The resultant array.
   */

  Cursor.prototype.map = function map(fn, scope) {
    checkPossibilityOfDynamicTraversal('map', this.solvedPath);

    var array = this._get().data,
        l = arguments.length;

    if (!_type2['default'].array(array)) throw Error('baobab.Cursor.map: cannot map a non-list type.');

    return array.map(function (item, i) {
      return fn.call(l > 1 ? scope : this, this.select(i), i, array);
    }, this);
  };

  /**
   * Getter Methods
   * ---------------
   */

  /**
   * Internal get method. Basically contains the main body of the `get` method
   * without the event emitting. This is sometimes needed not to fire useless
   * events.
   *
   * @param  {path}   [path=[]]       - Path to get in the tree.
   * @return {object} info            - The resultant information.
   * @return {mixed}  info.data       - Data at path.
   * @return {array}  info.solvedPath - The path solved when getting.
   */

  Cursor.prototype._get = function _get() {
    var path = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    if (!_type2['default'].path(path)) throw _helpers.makeError('Baobab.Cursor.getters: invalid path.', { path: path });

    if (!this.solvedPath) return { data: undefined, solvedPath: null, exists: false };

    return _helpers.getIn(this.tree._data, this.solvedPath.concat(path));
  };

  /**
   * Method used to check whether a certain path exists in the tree starting
   * from the current cursor.
   *
   * Arity (1):
   * @param  {path}   path           - Path to check in the tree.
   *
   * Arity (2):
   * @param {..step}  path           - Path to check in the tree.
   *
   * @return {boolean}               - Does the given path exists?
   */

  Cursor.prototype.exists = function exists(path) {
    path = _helpers.coercePath(path);

    if (arguments.length > 1) path = _helpers.arrayFrom(arguments);

    return this._get(path).exists;
  };

  /**
   * Method used to get data from the tree. Will fire a `get` event from the
   * tree so that the user may sometimes react upon it to fetch data, for
   * instance.
   *
   * Arity (1):
   * @param  {path}   path           - Path to get in the tree.
   *
   * Arity (2):
   * @param  {..step} path           - Path to get in the tree.
   *
   * @return {mixed}                 - Data at path.
   */

  Cursor.prototype.get = function get(path) {
    path = _helpers.coercePath(path);

    if (arguments.length > 1) path = _helpers.arrayFrom(arguments);

    var _get2 = this._get(path);

    var data = _get2.data;
    var solvedPath = _get2.solvedPath;

    // Emitting the event
    this.tree.emit('get', { data: data, solvedPath: solvedPath, path: this.path.concat(path) });

    return data;
  };

  /**
   * Method used to return raw data from the tree, by carefully avoiding
   * computed one.
   *
   * @todo: should be more performant as the cloning should happen as well as
   * when dropping computed data.
   *
   * Arity (1):
   * @param  {path}   path           - Path to serialize in the tree.
   *
   * Arity (2):
   * @param  {..step} path           - Path to serialize in the tree.
   *
   * @return {mixed}                 - The retrieved raw data.
   */

  Cursor.prototype.serialize = function serialize(path) {
    path = _helpers.coercePath(path);

    if (arguments.length > 1) path = _helpers.arrayFrom(arguments);

    if (!_type2['default'].path(path)) throw _helpers.makeError('Baobab.Cursor.getters: invalid path.', { path: path });

    if (!this.solvedPath) return undefined;

    var fullPath = this.solvedPath.concat(path);

    var data = _helpers.deepClone(_helpers.getIn(this.tree._data, fullPath).data),
        monkeys = _helpers.getIn(this.tree._monkeys, fullPath).data;

    var dropComputedData = function dropComputedData(d, m) {
      if (!_type2['default'].object(m) || !_type2['default'].object(d)) return;

      for (var k in m) {
        if (m[k] instanceof _monkey.Monkey) delete d[k];else dropComputedData(d[k], m[k]);
      }
    };

    dropComputedData(data, monkeys);
    return data;
  };

  /**
   * Method used to project some of the data at cursor onto a map or a list.
   *
   * @param  {object|array} projection - The projection's formal definition.
   * @return {object|array}            - The resultant map/list.
   */

  Cursor.prototype.project = function project(projection) {
    if (_type2['default'].object(projection)) {
      var data = {};

      for (var k in projection) {
        data[k] = this.get(projection[k]);
      }return data;
    } else if (_type2['default'].array(projection)) {
      var data = [];

      for (var i = 0, l = projection.length; i < l; i++) {
        data.push(this.get(projection[i]));
      }return data;
    }

    throw _helpers.makeError('Baobab.Cursor.project: wrong projection.', { projection: projection });
  };

  /**
   * History Methods
   * ----------------
   */

  /**
   * Methods starting to record the cursor's successive states.
   *
   * @param  {integer} [maxRecords] - Maximum records to keep in memory. Note
   *                                  that if no number is provided, the cursor
   *                                  will keep everything.
   * @return {Cursor}               - The cursor instance for chaining purposes.
   */

  Cursor.prototype.startRecording = function startRecording(maxRecords) {
    maxRecords = maxRecords || Infinity;

    if (maxRecords < 1) throw _helpers.makeError('Baobab.Cursor.startRecording: invalid max records.', {
      value: maxRecords
    });

    this.state.recording = true;

    if (this.archive) return this;

    // Lazy binding
    this._lazyBind();

    this.archive = new _helpers.Archive(maxRecords);
    return this;
  };

  /**
   * Methods stopping to record the cursor's successive states.
   *
   * @return {Cursor} - The cursor instance for chaining purposes.
   */

  Cursor.prototype.stopRecording = function stopRecording() {
    this.state.recording = false;
    return this;
  };

  /**
   * Methods undoing n steps of the cursor's recorded states.
   *
   * @param  {integer} [steps=1] - The number of steps to rollback.
   * @return {Cursor}            - The cursor instance for chaining purposes.
   */

  Cursor.prototype.undo = function undo() {
    var steps = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

    if (!this.state.recording) throw new Error('Baobab.Cursor.undo: cursor is not recording.');

    var record = this.archive.back(steps);

    if (!record) throw Error('Baobab.Cursor.undo: cannot find a relevant record.');

    this.state.undoing = true;
    this.set(record);

    return this;
  };

  /**
   * Methods returning whether the cursor has a recorded history.
   *
   * @return {boolean} - `true` if the cursor has a recorded history?
   */

  Cursor.prototype.hasHistory = function hasHistory() {
    return !!(this.archive && this.archive.get().length);
  };

  /**
   * Methods returning the cursor's history.
   *
   * @return {array} - The cursor's history.
   */

  Cursor.prototype.getHistory = function getHistory() {
    return this.archive ? this.archive.get() : [];
  };

  /**
   * Methods clearing the cursor's history.
   *
   * @return {Cursor} - The cursor instance for chaining purposes.
   */

  Cursor.prototype.clearHistory = function clearHistory() {
    if (this.archive) this.archive.clear();
    return this;
  };

  /**
   * Releasing
   * ----------
   */

  /**
   * Methods releasing the cursor from memory.
   */

  Cursor.prototype.release = function release() {

    // Removing listeners on parent
    if (this._dynamicPath) this.tree.off('write', this._writeHandler);

    this.tree.off('update', this._updateHandler);

    // Unsubscribe from the parent
    if (this.hash) delete this.tree._cursors[this.hash];

    // Dereferencing
    delete this.tree;
    delete this.path;
    delete this.solvedPath;
    delete this.archive;

    // Killing emitter
    this.kill();
    this.state.killed = true;
  };

  /**
   * Output
   * -------
   */

  /**
   * Overriding the `toJSON` method for convenient use with JSON.stringify.
   *
   * @return {mixed} - Data at cursor.
   */

  Cursor.prototype.toJSON = function toJSON() {
    return this.serialize();
  };

  /**
   * Overriding the `toString` method for debugging purposes.
   *
   * @return {string} - The cursor's identity.
   */

  Cursor.prototype.toString = function toString() {
    return this._identity;
  };

  return Cursor;
})(_emmett2['default']);

exports['default'] = Cursor;
if (typeof Symbol === 'function' && typeof Symbol.iterator !== 'undefined') {
  Cursor.prototype[Symbol.iterator] = function () {
    var array = this._get().data;

    if (!_type2['default'].array(array)) throw Error('baobab.Cursor.@@iterate: cannot iterate a non-list type.');

    var i = 0;

    var cursor = this,
        length = array.length;

    return {
      next: function next() {
        if (i < length) {
          return {
            value: cursor.select(i++)
          };
        }

        return {
          done: true
        };
      }
    };
  };
}

/**
 * Setter Methods
 * ---------------
 *
 * Those methods are dynamically assigned to the class for DRY reasons.
 */

/**
 * Function creating a setter method for the Cursor class.
 *
 * @param {string}   name          - the method's name.
 * @param {function} [typeChecker] - a function checking that the given value is
 *                                   valid for the given operation.
 */
function makeSetter(name, typeChecker) {

  /**
   * Binding a setter method to the Cursor class and having the following
   * definition.
   *
   * Note: this is not really possible to make those setters variadic because
   * it would create an impossible polymorphism with path.
   *
   * @todo: perform value validation elsewhere so that tree.update can
   * beneficiate from it.
   *
   * Arity (1):
   * @param  {mixed} value - New value to set at cursor's path.
   *
   * Arity (2):
   * @param  {path}  path  - Subpath to update starting from cursor's.
   * @param  {mixed} value - New value to set.
   *
   * @return {mixed}       - Data at path.
   */
  Cursor.prototype[name] = function (path, value) {

    // We should warn the user if he applies to many arguments to the function
    if (arguments.length > 2) throw _helpers.makeError('Baobab.Cursor.' + name + ': too many arguments.');

    // Handling arities
    if (arguments.length === 1 && name !== 'unset') {
      value = path;
      path = [];
    }

    // Coerce path
    path = _helpers.coercePath(path);

    // Checking the path's validity
    if (!_type2['default'].path(path)) throw _helpers.makeError('Baobab.Cursor.' + name + ': invalid path.', { path: path });

    // Checking the value's validity
    if (typeChecker && !typeChecker(value)) throw _helpers.makeError('Baobab.Cursor.' + name + ': invalid value.', { path: path, value: value });

    var fullPath = this.solvedPath.concat(path);

    // Filing the update to the tree
    return this.tree.update(fullPath, {
      type: name,
      value: value
    });
  };
}

/**
 * Making the necessary setters.
 */
makeSetter('set');
makeSetter('unset');
makeSetter('apply', _type2['default']['function']);
makeSetter('push');
makeSetter('concat', _type2['default'].array);
makeSetter('unshift');
makeSetter('splice', _type2['default'].splicer);
makeSetter('merge', _type2['default'].object);
makeSetter('deepMerge', _type2['default'].object);
module.exports = exports['default'];

},{"./helpers":4,"./monkey":5,"./type":6,"emmett":1}],4:[function(require,module,exports){
(function (global){
/* eslint eqeqeq: 0 */

/**
 * Baobab Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */
'use strict';

exports.__esModule = true;
exports.arrayFrom = arrayFrom;
exports.before = before;
exports.coercePath = coercePath;
exports.getIn = getIn;
exports.makeError = makeError;
exports.solveRelativePath = solveRelativePath;
exports.solveUpdate = solveUpdate;
exports.splice = splice;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _monkey = require('./monkey');

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

/**
 * Noop function
 */
var noop = Function.prototype;

/**
 * Function returning the index of the first element of a list matching the
 * given predicate.
 *
 * @param  {array}     a  - The target array.
 * @param  {function}  fn - The predicate function.
 * @return {mixed}        - The index of the first matching item or -1.
 */
function index(a, fn) {
  var i = undefined,
      l = undefined;
  for (i = 0, l = a.length; i < l; i++) {
    if (fn(a[i])) return i;
  }
  return -1;
}

/**
 * Efficient slice function used to clone arrays or parts of them.
 *
 * @param  {array} array - The array to slice.
 * @return {array}       - The sliced array.
 */
function slice(array) {
  var newArray = new Array(array.length);

  var i = undefined,
      l = undefined;

  for (i = 0, l = array.length; i < l; i++) newArray[i] = array[i];

  return newArray;
}

/**
 * Archive abstraction
 *
 * @constructor
 * @param {integer} size - Maximum number of records to store.
 */

var Archive = (function () {
  function Archive(size) {
    _classCallCheck(this, Archive);

    this.size = size;
    this.records = [];
  }

  /**
   * Function creating a real array from what should be an array but is not.
   * I'm looking at you nasty `arguments`...
   *
   * @param  {mixed} culprit - The culprit to convert.
   * @return {array}         - The real array.
   */

  /**
   * Method retrieving the records.
   *
   * @return {array} - The records.
   */

  Archive.prototype.get = function get() {
    return this.records;
  };

  /**
   * Method adding a record to the archive
   *
   * @param {object}  record - The record to store.
   * @return {Archive}       - The archive itself for chaining purposes.
   */

  Archive.prototype.add = function add(record) {
    this.records.unshift(record);

    // If the number of records is exceeded, we truncate the records
    if (this.records.length > this.size) this.records.length = this.size;

    return this;
  };

  /**
   * Method clearing the records.
   *
   * @return {Archive} - The archive itself for chaining purposes.
   */

  Archive.prototype.clear = function clear() {
    this.records = [];
    return this;
  };

  /**
   * Method to go back in time.
   *
   * @param {integer} steps - Number of steps we should go back by.
   * @return {number}       - The last record.
   */

  Archive.prototype.back = function back(steps) {
    var record = this.records[steps - 1];

    if (record) this.records = this.records.slice(steps);
    return record;
  };

  return Archive;
})();

exports.Archive = Archive;

function arrayFrom(culprit) {
  return slice(culprit);
}

/**
 * Function decorating one function with another that will be called before the
 * decorated one.
 *
 * @param  {function} decorator - The decorating function.
 * @param  {function} fn        - The function to decorate.
 * @return {function}           - The decorated function.
 */

function before(decorator, fn) {
  return function () {
    decorator.apply(null, arguments);
    fn.apply(null, arguments);
  };
}

/**
 * Function cloning the given regular expression. Supports `y` and `u` flags
 * already.
 *
 * @param  {RegExp} re - The target regular expression.
 * @return {RegExp}    - The cloned regular expression.
 */
function cloneRegexp(re) {
  var pattern = re.source;

  var flags = '';

  if (re.global) flags += 'g';
  if (re.multiline) flags += 'm';
  if (re.ignoreCase) flags += 'i';
  if (re.sticky) flags += 'y';
  if (re.unicode) flags += 'u';

  return new RegExp(pattern, flags);
}

/**
 * Function cloning the given variable.
 *
 * @todo: implement a faster way to clone an array.
 *
 * @param  {boolean} deep - Should we deep clone the variable.
 * @param  {mixed}   item - The variable to clone
 * @return {mixed}        - The cloned variable.
 */
function cloner(deep, item) {
  if (!item || typeof item !== 'object' || item instanceof Error || item instanceof _monkey.MonkeyDefinition || 'ArrayBuffer' in global && item instanceof ArrayBuffer) return item;

  // Array
  if (_type2['default'].array(item)) {
    if (deep) {
      var a = [];

      var i = undefined,
          l = undefined;

      for (i = 0, l = item.length; i < l; i++) a.push(cloner(true, item[i]));
      return a;
    }

    return slice(item);
  }

  // Date
  if (item instanceof Date) return new Date(item.getTime());

  // RegExp
  if (item instanceof RegExp) return cloneRegexp(item);

  // Object
  if (_type2['default'].object(item)) {
    var o = {};

    var k = undefined;

    // NOTE: could be possible to erase computed properties through `null`.
    for (k in item) {
      if (_type2['default'].lazyGetter(item, k)) {
        Object.defineProperty(o, k, {
          get: Object.getOwnPropertyDescriptor(item, k).get,
          enumerable: true,
          configurable: true
        });
      } else if (item.hasOwnProperty(k)) {
        o[k] = deep ? cloner(true, item[k]) : item[k];
      }
    }
    return o;
  }

  return item;
}

/**
 * Exporting shallow and deep cloning functions.
 */
var shallowClone = cloner.bind(null, false),
    deepClone = cloner.bind(null, true);

exports.shallowClone = shallowClone;
exports.deepClone = deepClone;

/**
 * Coerce the given variable into a full-fledged path.
 *
 * @param  {mixed} target - The variable to coerce.
 * @return {array}        - The array path.
 */

function coercePath(target) {
  if (target || target === 0 || target === '') return target;
  return [];
}

/**
 * Function comparing an object's properties to a given descriptive
 * object.
 *
 * @param  {object} object      - The object to compare.
 * @param  {object} description - The description's mapping.
 * @return {boolean}            - Whether the object matches the description.
 */
function compare(object, description) {
  var ok = true,
      k = undefined;

  // If we reached here via a recursive call, object may be undefined because
  // not all items in a collection will have the same deep nesting structure.
  if (!object) return false;

  for (k in description) {
    if (_type2['default'].object(description[k])) {
      ok = ok && compare(object[k], description[k]);
    } else if (_type2['default'].array(description[k])) {
      ok = ok && !! ~description[k].indexOf(object[k]);
    } else {
      if (object[k] !== description[k]) return false;
    }
  }

  return ok;
}

/**
 * Function freezing the given variable if possible.
 *
 * @param  {boolean} deep - Should we recursively freeze the given objects?
 * @param  {object}  o    - The variable to freeze.
 * @return {object}    - The merged object.
 */
function freezer(deep, o) {
  if (typeof o !== 'object' || o === null || o instanceof _monkey.Monkey) return;

  Object.freeze(o);

  if (!deep) return;

  if (Array.isArray(o)) {

    // Iterating through the elements
    var i = undefined,
        l = undefined;

    for (i = 0, l = o.length; i < l; i++) freezer(true, o[i]);
  } else {
    var p = undefined,
        k = undefined;

    for (k in o) {
      if (_type2['default'].lazyGetter(o, k)) continue;

      p = o[k];

      if (!p || !o.hasOwnProperty(k) || typeof p !== 'object' || Object.isFrozen(p)) continue;

      freezer(true, p);
    }
  }
}

/**
 * Exporting both `freeze` and `deepFreeze` functions.
 * Note that if the engine does not support `Object.freeze` then this will
 * export noop functions instead.
 */
var isFreezeSupported = typeof Object.freeze === 'function';

var freeze = isFreezeSupported ? freezer.bind(null, false) : noop,
    deepFreeze = isFreezeSupported ? freezer.bind(null, true) : noop;

exports.freeze = freeze;
exports.deepFreeze = deepFreeze;

/**
 * Function retrieving nested data within the given object and according to
 * the given path.
 *
 * @todo: work if dynamic path hit objects also.
 * @todo: memoized perfgetters.
 *
 * @param  {object}  object - The object we need to get data from.
 * @param  {array}   path   - The path to follow.
 * @return {object}  result            - The result.
 * @return {mixed}   result.data       - The data at path, or `undefined`.
 * @return {array}   result.solvedPath - The solved path or `null`.
 * @return {boolean} result.exists     - Does the path exists in the tree?
 */
var notFoundObject = { data: undefined, solvedPath: null, exists: false };

function getIn(object, path) {
  if (!path) return notFoundObject;

  var solvedPath = [];

  var exists = true,
      c = object,
      idx = undefined,
      i = undefined,
      l = undefined;

  for (i = 0, l = path.length; i < l; i++) {
    if (!c) return { data: undefined, solvedPath: path, exists: false };

    if (typeof path[i] === 'function') {
      if (!_type2['default'].array(c)) return notFoundObject;

      idx = index(c, path[i]);
      if (! ~idx) return notFoundObject;

      solvedPath.push(idx);
      c = c[idx];
    } else if (typeof path[i] === 'object') {
      if (!_type2['default'].array(c)) return notFoundObject;

      idx = index(c, function (e) {
        return compare(e, path[i]);
      });
      if (! ~idx) return notFoundObject;

      solvedPath.push(idx);
      c = c[idx];
    } else {
      solvedPath.push(path[i]);
      exists = typeof c === 'object' && path[i] in c;
      c = c[path[i]];
    }
  }

  return { data: c, solvedPath: solvedPath, exists: exists };
}

/**
 * Little helper returning a JavaScript error carrying some data with it.
 *
 * @param  {string} message - The error message.
 * @param  {object} [data]  - Optional data to assign to the error.
 * @return {Error}          - The created error.
 */

function makeError(message, data) {
  var err = new Error(message);

  for (var k in data) {
    err[k] = data[k];
  }return err;
}

/**
 * Function taking n objects to merge them together.
 * Note 1): the latter object will take precedence over the first one.
 * Note 2): the first object will be mutated to allow for perf scenarios.
 * Note 3): this function will consider monkeys as leaves.
 *
 * @param  {boolean}   deep    - Whether the merge should be deep or not.
 * @param  {...object} objects - Objects to merge.
 * @return {object}            - The merged object.
 */
function merger(deep) {
  for (var _len = arguments.length, objects = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    objects[_key - 1] = arguments[_key];
  }

  var o = objects[0];

  var t = undefined,
      i = undefined,
      l = undefined,
      k = undefined;

  for (i = 1, l = objects.length; i < l; i++) {
    t = objects[i];

    for (k in t) {
      if (deep && _type2['default'].object(t[k]) && !(t[k] instanceof _monkey.Monkey)) {
        o[k] = merger(true, o[k] || {}, t[k]);
      } else {
        o[k] = t[k];
      }
    }
  }

  return o;
}

/**
 * Exporting both `shallowMerge` and `deepMerge` functions.
 */
var shallowMerge = merger.bind(null, false),
    deepMerge = merger.bind(null, true);

exports.shallowMerge = shallowMerge;
exports.deepMerge = deepMerge;

/**
 * Solving a potentially relative path.
 *
 * @param  {array} base - The base path from which to solve the path.
 * @param  {array} to   - The subpath to reach.
 * @param  {array}      - The solved absolute path.
 */

function solveRelativePath(base, to) {
  var solvedPath = [];

  for (var i = 0, l = to.length; i < l; i++) {
    var step = to[i];

    if (step === '.') {
      if (!i) solvedPath = base.slice(0);
    } else if (step === '..') {
      solvedPath = (!i ? base : solvedPath).slice(0, -1);
    } else {
      solvedPath.push(step);
    }
  }

  return solvedPath;
}

/**
 * Function determining whether some paths in the tree were affected by some
 * updates that occurred at the given paths. This helper is mainly used at
 * cursor level to determine whether the cursor is concerned by the updates
 * fired at tree level.
 *
 * NOTES: 1) If performance become an issue, the following threefold loop
 *           can be simplified to a complex twofold one.
 *        2) A regex version could also work but I am not confident it would
 *           be faster.
 *        3) Another solution would be to keep a register of cursors like with
 *           the monkeys and update along this tree.
 *
 * @param  {array} affectedPaths - The paths that were updated.
 * @param  {array} comparedPaths - The paths that we are actually interested in.
 * @return {boolean}             - Is the update relevant to the compared
 *                                 paths?
 */

function solveUpdate(affectedPaths, comparedPaths) {
  var i = undefined,
      j = undefined,
      k = undefined,
      l = undefined,
      m = undefined,
      n = undefined,
      p = undefined,
      c = undefined,
      s = undefined;

  // Looping through possible paths
  for (i = 0, l = affectedPaths.length; i < l; i++) {
    p = affectedPaths[i];

    if (!p.length) return true;

    // Looping through logged paths
    for (j = 0, m = comparedPaths.length; j < m; j++) {
      c = comparedPaths[j];

      if (!c || !c.length) return true;

      // Looping through steps
      for (k = 0, n = c.length; k < n; k++) {
        s = c[k];

        // If path is not relevant, we break
        // NOTE: the '!=' instead of '!==' is required here!
        if (s != p[k]) break;

        // If we reached last item and we are relevant
        if (k + 1 === n || k + 1 === p.length) return true;
      }
    }
  }

  return false;
}

/**
 * Non-mutative version of the splice array method.
 *
 * @param {array}    array        - The array to splice.
 * @param {integer}  startIndex   - The start index.
 * @param {integer}  nb           - Number of elements to remove.
 * @param {...mixed} elements     - Elements to append after splicing.
 * @return {array}                - The spliced array.
 */

function splice(array, startIndex, nb) {
  for (var _len2 = arguments.length, elements = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
    elements[_key2 - 3] = arguments[_key2];
  }

  return array.slice(0, startIndex).concat(elements).concat(array.slice(startIndex + Math.max(0, nb)));
}

/**
 * Function returning a unique incremental id each time it is called.
 *
 * @return {integer} - The latest unique id.
 */
var uniqid = (function () {
  var i = 0;

  return function () {
    return i++;
  };
})();

exports.uniqid = uniqid;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./monkey":5,"./type":6}],5:[function(require,module,exports){
/**
 * Baobab Monkeys
 * ===============
 *
 * Exposing both handy monkey definitions and the underlying working class.
 */
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _update2 = require('./update');

var _update3 = _interopRequireDefault(_update2);

var _helpers = require('./helpers');

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

  var monkeyType = _type2['default'].monkeyDefinition(definition);

  if (!monkeyType) throw _helpers.makeError('Baobab.monkey: invalid definition.', { definition: definition });

  this.type = monkeyType;

  if (this.type === 'object') {
    this.getter = definition.get;
    this.projection = definition.cursors || {};
    this.paths = Object.keys(this.projection).map(function (k) {
      return _this.projection[k];
    });
  } else {
    this.getter = definition[definition.length - 1];
    this.projection = definition.slice(0, -1);
    this.paths = this.projection;
  }

  this.hasDynamicPaths = this.paths.some(_type2['default'].dynamicPath);
}

/**
 * Monkey core class
 *
 * @constructor
 * @param {Baobab}           tree       - The bound tree.
 * @param {MonkeyDefinition} definition - A definition instance.
 */
;

exports.MonkeyDefinition = MonkeyDefinition;

var Monkey = (function () {
  function Monkey(tree, pathInTree, definition) {
    var _this2 = this;

    _classCallCheck(this, Monkey);

    // Properties
    this.tree = tree;
    this.path = pathInTree;
    this.definition = definition;
    this.isRecursive = false;

    // Adapting the definition's paths & projection to this monkey's case
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
    this.listener = function (_ref) {
      var path = _ref.data.path;

      if (_this2.state.killed) return;

      // Is the monkey affected by the current write event?
      var concerned = _helpers.solveUpdate([path], _this2.relatedPaths());

      if (concerned) _this2.update();
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

  Monkey.prototype.checkRecursivity = function checkRecursivity() {
    var _this3 = this;

    this.isRecursive = this.depPaths.some(function (p) {
      return !!_type2['default'].monkeyPath(_this3.tree._monkeys, p);
    });

    // Putting the recursive monkeys' listeners at the end of the stack
    // NOTE: this is a dirty hack and a more thorough solution should be found
    if (this.isRecursive) {
      this.tree.off('write', this.listener);
      this.tree.on('write', this.listener);
    }

    return this;
  };

  /**
   * Method returning solved paths related to the monkey.
   *
   * @return {array} - An array of related paths.
   */

  Monkey.prototype.relatedPaths = function relatedPaths() {
    var _this4 = this;

    var paths = undefined;

    if (this.definition.hasDynamicPaths) paths = this.depPaths.map(function (p) {
      return _helpers.getIn(_this4.tree._data, p).solvedPath;
    });else paths = this.depPaths;

    if (!this.isRecursive) return paths;

    return paths.reduce(function (accumulatedPaths, path) {
      var monkeyPath = _type2['default'].monkeyPath(_this4.tree._monkeys, path);

      if (!monkeyPath) return accumulatedPaths.concat([path]);

      // Solving recursive path
      var relatedMonkey = _helpers.getIn(_this4.tree._monkeys, monkeyPath).data;

      return accumulatedPaths.concat(relatedMonkey.relatedPaths());
    }, []);
  };

  /**
   * Method used to update the tree's internal data with a lazy getter holding
   * the computed data.
   *
   * @return {Monkey} - Returns itself for chaining purposes.
   */

  Monkey.prototype.update = function update() {
    var deps = this.tree.project(this.projection);

    var lazyGetter = (function (tree, def, data) {
      var cache = null,
          alreadyComputed = false;

      return function () {

        if (!alreadyComputed) {
          cache = def.getter.apply(tree, def.type === 'object' ? [data] : data);

          // Freezing if required
          if (tree.options.immutable) _helpers.deepFreeze(cache);

          alreadyComputed = true;
        }

        return cache;
      };
    })(this.tree, this.definition, deps);

    lazyGetter.isLazyGetter = true;

    // If the tree does not accept lazy monkeys, we solve the lazy getter
    if (this.tree.options.lazyMonkeys) {
      this.tree._data = _update3['default'](this.tree._data, this.path, { type: 'monkey', value: lazyGetter }, this.tree.options).data;
    } else {
      var result = _update3['default'](this.tree._data, this.path, { type: 'set', value: lazyGetter() }, this.tree.options);

      if ('data' in result) this.tree._data = result.data;
    }

    return this;
  };

  /**
   * Method releasing the monkey from memory.
   */

  Monkey.prototype.release = function release() {

    // Unbinding events
    this.tree.off('write', this.listener);
    this.state.killed = true;

    // Deleting properties
    // NOTE: not deleting this.definition because some strange things happen
    // in the _refreshMonkeys method. See #372.
    delete this.projection;
    delete this.depPaths;
    delete this.tree;
  };

  return Monkey;
})();

exports.Monkey = Monkey;

},{"./helpers":4,"./type":6,"./update":7}],6:[function(require,module,exports){
/**
 * Baobab Type Checking
 * =====================
 *
 * Helpers functions used throughout the library to perform some type
 * tests at runtime.
 *
 */
'use strict';

exports.__esModule = true;

var _monkey = require('./monkey');

var type = {};

/**
 * Helpers
 * --------
 */

/**
 * Checking whether the given variable is of any of the given types.
 *
 * @todo   Optimize this function by dropping `some`.
 *
 * @param  {mixed} target  - Variable to test.
 * @param  {array} allowed - Array of allowed types.
 * @return {boolean}
 */
function anyOf(target, allowed) {
  return allowed.some(function (t) {
    return type[t](target);
  });
}

/**
 * Simple types
 * -------------
 */

/**
 * Checking whether the given variable is an array.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.array = function (target) {
  return Array.isArray(target);
};

/**
 * Checking whether the given variable is an object.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.object = function (target) {
  return target && typeof target === 'object' && !Array.isArray(target) && !(target instanceof Date) && !(target instanceof RegExp) && !(typeof Map === 'function' && target instanceof Map) && !(typeof Set === 'function' && target instanceof Set);
};

/**
 * Checking whether the given variable is a string.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.string = function (target) {
  return typeof target === 'string';
};

/**
 * Checking whether the given variable is a number.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.number = function (target) {
  return typeof target === 'number';
};

/**
 * Checking whether the given variable is a function.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type['function'] = function (target) {
  return typeof target === 'function';
};

/**
 * Checking whether the given variable is a JavaScript primitive.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.primitive = function (target) {
  return target !== Object(target);
};

/**
 * Complex types
 * --------------
 */

/**
 * Checking whether the given variable is a valid splicer.
 *
 * @param  {mixed} target    - Variable to test.
 * @param  {array} [allowed] - Optional valid types in path.
 * @return {boolean}
 */
type.splicer = function (target) {
  if (!type.array(target) || target.length < 2) return false;

  return anyOf(target[0], ['number', 'function', 'object']) && type.number(target[1]);
};

/**
 * Checking whether the given variable is a valid cursor path.
 *
 * @param  {mixed} target    - Variable to test.
 * @param  {array} [allowed] - Optional valid types in path.
 * @return {boolean}
 */

// Order is important for performance reasons
var ALLOWED_FOR_PATH = ['string', 'number', 'function', 'object'];

type.path = function (target) {
  if (!target && target !== 0 && target !== '') return false;

  return [].concat(target).every(function (step) {
    return anyOf(step, ALLOWED_FOR_PATH);
  });
};

/**
 * Checking whether the given path is a dynamic one.
 *
 * @param  {mixed} path - The path to test.
 * @return {boolean}
 */
type.dynamicPath = function (path) {
  return path.some(function (step) {
    return type['function'](step) || type.object(step);
  });
};

/**
 * Retrieve any monkey subpath in the given path or null if the path never comes
 * across computed data.
 *
 * @param  {mixed} data - The data to test.
 * @param  {array} path - The path to test.
 * @return {boolean}
 */
type.monkeyPath = function (data, path) {
  var subpath = [];

  var c = data,
      i = undefined,
      l = undefined;

  for (i = 0, l = path.length; i < l; i++) {
    subpath.push(path[i]);

    if (typeof c !== 'object') return null;

    c = c[path[i]];

    if (c instanceof _monkey.Monkey) return subpath;
  }

  return null;
};

/**
 * Check if the given object property is a lazy getter used by a monkey.
 *
 * @param  {mixed}   o           - The target object.
 * @param  {string}  propertyKey - The property to test.
 * @return {boolean}
 */
type.lazyGetter = function (o, propertyKey) {
  var descriptor = Object.getOwnPropertyDescriptor(o, propertyKey);

  return descriptor && descriptor.get && descriptor.get.isLazyGetter === true;
};

/**
 * Returns the type of the given monkey definition or `null` if invalid.
 *
 * @param  {mixed} definition - The definition to check.
 * @return {string|null}
 */
type.monkeyDefinition = function (definition) {

  if (type.object(definition)) {
    if (!type['function'](definition.get) || definition.cursors && (!type.object(definition.cursors) || !Object.keys(definition.cursors).every(function (k) {
      return type.path(definition.cursors[k]);
    }))) return null;

    return 'object';
  } else if (type.array(definition)) {
    if (!type['function'](definition[definition.length - 1]) || !definition.slice(0, -1).every(function (p) {
      return type.path(p);
    })) return null;

    return 'array';
  }

  return null;
};

/**
 * Checking whether the given watcher definition is valid.
 *
 * @param  {mixed}   definition - The definition to check.
 * @return {boolean}
 */
type.watcherMapping = function (definition) {
  return type.object(definition) && Object.keys(definition).every(function (k) {
    return type.path(definition[k]);
  });
};

/**
 * Checking whether the given string is a valid operation type.
 *
 * @param  {mixed} string - The string to test.
 * @return {boolean}
 */

// Ordered by likeliness
var VALID_OPERATIONS = ['set', 'apply', 'push', 'unshift', 'concat', 'deepMerge', 'merge', 'splice', 'unset'];

type.operationType = function (string) {
  return typeof string === 'string' && !! ~VALID_OPERATIONS.indexOf(string);
};

exports['default'] = type;
module.exports = exports['default'];

},{"./monkey":5}],7:[function(require,module,exports){
/**
 * Baobab Update
 * ==============
 *
 * The tree's update scheme.
 */
'use strict';

exports.__esModule = true;
exports['default'] = update;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _helpers = require('./helpers');

function err(operation, expectedTarget, path) {
  return _helpers.makeError('Baobab.update: cannot apply the "' + operation + '" on ' + ('a non ' + expectedTarget + ' (path: /' + path.join('/') + ').'), { path: path });
}

/**
 * Function aiming at applying a single update operation on the given tree's
 * data.
 *
 * @param  {mixed}  data      - The tree's data.
 * @param  {path}   path      - Path of the update.
 * @param  {object} operation - The operation to apply.
 * @param  {object} [opts]    - Optional options.
 * @return {mixed}            - Both the new tree's data and the updated node.
 */

function update(data, path, operation) {
  var opts = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
  var operationType = operation.type;
  var value = operation.value;

  // Dummy root, so we can shift and alter the root
  var dummy = { root: data },
      dummyPath = ['root'].concat(path),
      currentPath = [];

  // Walking the path
  var p = dummy,
      i = undefined,
      l = undefined,
      s = undefined;

  for (i = 0, l = dummyPath.length; i < l; i++) {

    // Current item's reference is therefore p[s]
    // The reason why we don't create a variable here for convenience
    // is because we actually need to mutate the reference.
    s = dummyPath[i];

    // Updating the path
    if (i > 0) currentPath.push(s);

    // If we reached the end of the path, we apply the operation
    if (i === l - 1) {

      /**
       * Set
       */
      if (operationType === 'set') {

        // Purity check
        if (opts.pure && p[s] === value) return { node: p[s] };

        if (_type2['default'].lazyGetter(p, s)) {
          Object.defineProperty(p, s, {
            value: value,
            enumerable: true,
            configurable: true
          });
        } else if (opts.persistent) {
          p[s] = _helpers.shallowClone(value);
        } else {
          p[s] = value;
        }
      }

      /**
       * Monkey
       */
      else if (operationType === 'monkey') {
          Object.defineProperty(p, s, {
            get: value,
            enumerable: true,
            configurable: true
          });
        }

        /**
         * Apply
         */
        else if (operationType === 'apply') {
            var result = value(p[s]);

            // Purity check
            if (opts.pure && p[s] === result) return { node: p[s] };

            if (_type2['default'].lazyGetter(p, s)) {
              Object.defineProperty(p, s, {
                value: result,
                enumerable: true,
                configurable: true
              });
            } else if (opts.persistent) {
              p[s] = _helpers.shallowClone(result);
            } else {
              p[s] = result;
            }
          }

          /**
           * Push
           */
          else if (operationType === 'push') {
              if (!_type2['default'].array(p[s])) throw err('push', 'array', currentPath);

              if (opts.persistent) p[s] = p[s].concat([value]);else p[s].push(value);
            }

            /**
             * Unshift
             */
            else if (operationType === 'unshift') {
                if (!_type2['default'].array(p[s])) throw err('unshift', 'array', currentPath);

                if (opts.persistent) p[s] = [value].concat(p[s]);else p[s].unshift(value);
              }

              /**
               * Concat
               */
              else if (operationType === 'concat') {
                  if (!_type2['default'].array(p[s])) throw err('concat', 'array', currentPath);

                  if (opts.persistent) p[s] = p[s].concat(value);else p[s].push.apply(p[s], value);
                }

                /**
                 * Splice
                 */
                else if (operationType === 'splice') {
                    if (!_type2['default'].array(p[s])) throw err('splice', 'array', currentPath);

                    if (opts.persistent) p[s] = _helpers.splice.apply(null, [p[s]].concat(value));else p[s].splice.apply(p[s], value);
                  }

                  /**
                   * Unset
                   */
                  else if (operationType === 'unset') {
                      if (_type2['default'].object(p)) delete p[s];else if (_type2['default'].array(p)) p.splice(s, 1);
                    }

                    /**
                     * Merge
                     */
                    else if (operationType === 'merge') {
                        if (!_type2['default'].object(p[s])) throw err('merge', 'object', currentPath);

                        if (opts.persistent) p[s] = _helpers.shallowMerge({}, p[s], value);else p[s] = _helpers.shallowMerge(p[s], value);
                      }

                      /**
                       * Deep merge
                       */
                      else if (operationType === 'deepMerge') {
                          if (!_type2['default'].object(p[s])) throw err('deepMerge', 'object', currentPath);

                          if (opts.persistent) p[s] = _helpers.deepMerge({}, p[s], value);else p[s] = _helpers.deepMerge(p[s], value);
                        }

      if (opts.immutable) _helpers.deepFreeze(p);

      break;
    }

    // If we reached a leaf, we override by setting an empty object
    else if (_type2['default'].primitive(p[s])) {
        p[s] = {};
      }

      // Else, we shift the reference and continue the path
      else if (opts.persistent) {
          p[s] = _helpers.shallowClone(p[s]);
        }

    // Should we freeze the current step before continuing?
    if (opts.immutable && l > 0) _helpers.freeze(p);

    p = p[s];
  }

  // If we are updating a dynamic node, we need not return the affected node
  if (_type2['default'].lazyGetter(p, s)) return { data: dummy.root };

  // Returning new data object
  return { data: dummy.root, node: p[s] };
}

module.exports = exports['default'];

},{"./helpers":4,"./type":6}],8:[function(require,module,exports){
/**
 * Baobab Watchers
 * ================
 *
 * Abstraction used to listen and retrieve data from multiple parts of a
 * Baobab tree at once.
 */
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _emmett = require('emmett');

var _emmett2 = _interopRequireDefault(_emmett);

var _cursor = require('./cursor');

var _cursor2 = _interopRequireDefault(_cursor);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _helpers = require('./helpers');

/**
 * Watcher class.
 *
 * @constructor
 * @param {Baobab} tree     - The watched tree.
 * @param {object} mapping  - A mapping of the paths to watch in the tree.
 */

var Watcher = (function (_Emitter) {
  _inherits(Watcher, _Emitter);

  function Watcher(tree, mapping) {
    var _this = this;

    _classCallCheck(this, Watcher);

    _Emitter.call(this);

    // Properties
    this.tree = tree;
    this.mapping = null;

    this.state = {
      killed: false
    };

    // Initializing
    this.refresh(mapping);

    // Listening
    this.handler = function (e) {
      if (_this.state.killed) return;

      var watchedPaths = _this.getWatchedPaths();

      if (_helpers.solveUpdate(e.data.paths, watchedPaths)) return _this.emit('update');
    };

    this.tree.on('update', this.handler);
  }

  /**
   * Method used to get the current watched paths.
   *
   * @return {array} - The array of watched paths.
   */

  Watcher.prototype.getWatchedPaths = function getWatchedPaths() {
    var _this2 = this;

    var rawPaths = Object.keys(this.mapping).map(function (k) {
      var v = _this2.mapping[k];

      // Watcher mappings can accept a cursor
      if (v instanceof _cursor2['default']) return v.solvedPath;

      return _this2.mapping[k];
    });

    return rawPaths.reduce(function (cp, p) {

      // Handling path polymorphisms
      p = [].concat(p);

      // Dynamic path?
      if (_type2['default'].dynamicPath(p)) p = _helpers.getIn(_this2.tree._data, p).solvedPath;

      if (!p) return cp;

      // Facet path?
      var monkeyPath = _type2['default'].monkeyPath(_this2.tree._monkeys, p);

      if (monkeyPath) return cp.concat(_helpers.getIn(_this2.tree._monkeys, monkeyPath).data.relatedPaths());

      return cp.concat([p]);
    }, []);
  };

  /**
   * Method used to return a map of the watcher's cursors.
   *
   * @return {object} - TMap of relevant cursors.
   */

  Watcher.prototype.getCursors = function getCursors() {
    var _this3 = this;

    var cursors = {};

    Object.keys(this.mapping).forEach(function (k) {
      var path = _this3.mapping[k];

      if (path instanceof _cursor2['default']) cursors[k] = path;else cursors[k] = _this3.tree.select(path);
    });

    return cursors;
  };

  /**
   * Method used to refresh the watcher's mapping.
   *
   * @param  {object}  mapping  - The new mapping to apply.
   * @return {Watcher}          - Itself for chaining purposes.
   */

  Watcher.prototype.refresh = function refresh(mapping) {

    if (!_type2['default'].watcherMapping(mapping)) throw _helpers.makeError('Baobab.watch: invalid mapping.', { mapping: mapping });

    this.mapping = mapping;

    // Creating the get method
    var projection = {};

    for (var k in mapping) {
      projection[k] = mapping[k] instanceof _cursor2['default'] ? mapping[k].path : mapping[k];
    }this.get = this.tree.project.bind(this.tree, projection);
  };

  /**
   * Methods releasing the watcher from memory.
   */

  Watcher.prototype.release = function release() {

    this.tree.off('update', this.handler);
    this.state.killed = true;
    this.kill();
  };

  return Watcher;
})(_emmett2['default']);

exports['default'] = Watcher;
module.exports = exports['default'];

},{"./cursor":3,"./helpers":4,"./type":6,"emmett":1}]},{},[2])(2)
});