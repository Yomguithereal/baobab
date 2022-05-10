"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _monkey = require("./monkey");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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
  return target && _typeof(target) === 'object' && !Array.isArray(target) && !(target instanceof Date) && !(target instanceof RegExp) && !(typeof Map === 'function' && target instanceof Map) && !(typeof Set === 'function' && target instanceof Set);
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


type["function"] = function (target) {
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
  if (!type.array(target) || target.length < 1) return false;
  if (target.length > 1 && isNaN(+target[1])) return false;
  return anyOf(target[0], ['number', 'function', 'object']);
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
    return type["function"](step) || type.object(step);
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
      i,
      l;

  for (i = 0, l = path.length; i < l; i++) {
    subpath.push(path[i]);
    if (_typeof(c) !== 'object') return null;
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
    if (!type["function"](definition.get) || definition.cursors && (!type.object(definition.cursors) || !Object.keys(definition.cursors).every(function (k) {
      return type.path(definition.cursors[k]);
    }))) return null;
    return 'object';
  } else if (type.array(definition)) {
    var offset = 1;
    if (type.object(definition[definition.length - 1])) offset++;
    if (!type["function"](definition[definition.length - offset]) || !definition.slice(0, -offset).every(function (p) {
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


var VALID_OPERATIONS = ['set', 'apply', 'push', 'unshift', 'concat', 'pop', 'shift', 'deepMerge', 'merge', 'splice', 'unset'];

type.operationType = function (string) {
  return typeof string === 'string' && !!~VALID_OPERATIONS.indexOf(string);
};

var _default = type;
exports["default"] = _default;