/**
 * Baobab Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */
var types = require('typology');

// Make a real array of an array-like object
function arrayOf(o) {
  return Array.prototype.slice.call(o);
}

// Shallow clone
function shallowClone(item) {
  if (!item || !(item instanceof Object))
    return item;

  // Array
  if (types.get(item) === 'array')
    return item.slice(0);

  // Date
  if (types.get(item) === 'date')
    return new Date(item.getTime());

  // Object
  if (types.get(item) === 'object') {
    var k, o = {};
    for (k in item)
      o[k] = item[k];
    return o;
  }

  return item;
}

// Deep clone
function deepClone(item) {
  if (!item || !(item instanceof Object))
    return item;

  // Array
  if (types.get(item) === 'array') {
    var i, l, a = [];
    for (i = 0, l = item.length; i < l; i++)
      a.push(deepClone(item[i]));
    return a;
  }

  // Date
  if (types.get(item) === 'date')
    return new Date(item.getTime());

  // Object
  if (types.get(item) === 'object') {
    var k, o = {};
    for (k in item)
      o[k] = deepClone(item[k]);
    return o;
  }

  return item;
}

// Simplistic composition
function compose(fn1, fn2) {
  return function(arg) {
    return fn2(fn1(arg));
  };
}

// Retrieve nested objects
function getIn(object, path) {
  path = path || [];

  var c = object,
      i,
      l;

  for (i = 0, l = path.length; i < l; i++) {
    if (!c)
      return;
    c = c[path[i]];
  }

  return c;
}

// Return a fake object relative to the given path
function pathObject(path, spec) {
  var l = path.length,
      o = {},
      c = o,
      i;

  if (!l)
    o = spec;

  for (i = 0; i < l; i++) {
    c[path[i]] = (i + 1 === l) ? spec : {};
    c = c[path[i]];
  }

  return o;
}

function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  var TempCtor = function () {};
  TempCtor.prototype = superCtor.prototype;
  ctor.prototype = new TempCtor();
  ctor.prototype.constructor = ctor;
}

// Delay execution until next tick or frame
var later = (typeof window === 'undefined') ?
  process.nextTick :
  ('requestAnimationFrame' in window) ?
    window.requestAnimationFrame.bind(window) :
    function(fn) {setTimeout(fn, 0);};

module.exports = {
  arrayOf: arrayOf,
  deepClone: deepClone,
  shallowClone: shallowClone,
  compose: compose,
  getIn: getIn,
  inherits: inherits,
  later: later,
  pathObject: pathObject
};
