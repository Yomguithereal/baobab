/**
 * Baobab Type Checking
 * =====================
 *
 * Misc helpers functions used throughout the library to perform some type
 * tests at runtime.
 *
 * @christianalfoni
 */
var type = {};

/**
 * Helpers
 */
function anyOf(value, allowed) {
  return allowed.some(function(t) {
    return type[t](value);
  });
}

/**
 * Simple types
 */
type.Array = function (value) {
  return Array.isArray(value);
};

type.Object = function (value) {
  return !Array.isArray(value) && typeof value === 'object' && value !== null;
};

type.String = function (value) {
  return typeof value === 'string';
};

type.Number = function (value) {
  return typeof value === 'number';
};

type.PositiveInteger = function(value) {
  return typeof value === 'number' && value > 0 && !(value % 1);
};

type.Function = function (value) {
  return typeof value === 'function';
};

type.Primitive = function (value) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
};

type.Date = function (value) {
  return value instanceof Date;
};

/**
 * Complex types
 */
type.NonScalar = function(value) {
  return type.Object(value) || type.Array(value);
};

type.Path = function (value) {
  var allowed = ['String', 'Number', 'Function', 'Object'];

  if (type.Array(value)) {
    return value.every(function(step) {
      return anyOf(step, allowed);
    });
  }
  else {
    return anyOf(value, allowed);
  }
};

type.MixinCursor = function (value) {
  return anyOf(value, ['String', 'Number', 'Array', 'Function', 'Cursor']);
};

type.MixinCursors = function (value) {
  return anyOf(value, ['Object', 'Array', 'Function']);
};

type.ComplexPath = function (value) {
  return value.some(function(v) {
    return anyOf(v, ['Object', 'Function']);
  });
};

module.exports = type;
