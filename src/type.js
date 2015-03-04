/**
 * Baobab Type Checking
 * =====================
 *
 * Misc helpers functions used throughout the library to perform some type
 * tests at runtime.
 *
 * @christianalfoni
 */

// Not reusing methods as it will just be an extra
// call on the stack
var type = function (value) {
  if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object' && value !== null) {
    return 'object';
  } else if (typeof value === 'string') {
    return 'string';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (typeof value === 'function') {
    return 'function';
  } else if (value === null) {
    return 'null';
  } else if (value === undefined) {
    return 'undefined';
  } else if (value instanceof Date) {
    return 'date';
  } else {
    return 'invalid';
  }
};

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

type.Boolean = function (value) {
  return typeof value === 'boolean';
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

type.Step = function (value) {
  var valueType = type(value);
  var notValid = ['null', 'undefined', 'invalid', 'date'];
  return notValid.indexOf(valueType) === -1;
};

// Should undefined be allowed?
type.Path = function (value) {
  var types = ['object', 'string', 'number', 'function', 'undefined'];
  if (type.Array(value)) {
    for (var x = 0; x < value.length; x++) {
      if (types.indexOf(type(value[x])) === -1) {
        return false;
      }
    }
  } else {
    return types.indexOf(type(value)) >= 0;
  }
  return true;

};

// string|number|array|cursor
type.MixinCursor = function (value) {
  var allowedValues = ['string', 'number', 'array'];
  return allowedValues.indexOf(type(value)) >= 0 || type.Cursor(value);
};

// Already know this is an array
type.ComplexPath = function (value) {
  var complexTypes = ['object', 'function'];
  for (var x = 0; x < value.length; x++) {
    if (complexTypes.indexOf(type(value[x])) >= 0) {
      return true;
    }
  }
  return false;
};

module.exports = type;
