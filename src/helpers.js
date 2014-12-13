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

// Deep clone an object
function clone(item) {
  if (!item)
    return item;

  var result,
      i,
      k,
      l;

  if (types.check(item, 'array')) {
    result = [];
    for (i = 0, l = item.length; i < l; i++)
      result.push(clone(item[i]));

  } else if (types.check(item, 'date')) {
    result = new Date(item.getTime());

  } else if (types.check(item, 'object')) {
    if (item.nodeType && typeof item.cloneNode === 'function')
      result = item;
    else if (!item.prototype) {
      result = {};
      for (i in item)
        result[i] = clone(item[i]);
    } else
      result = item;
  } else {
    result = item;
  }

  return result;
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
    if (typeof c[path[i]] === 'undefined')
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
  clone: clone,
  compose: compose,
  getIn: getIn,
  inherits: inherits,
  later: later,
  pathObject: pathObject
};
