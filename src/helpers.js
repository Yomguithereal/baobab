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

// Get first item matching predicate in list
function first(a, fn) {
  var i, l;
  for (i = 0, l = a.length; i < l; i++) {
    if (fn(a[i]))
      return a[i];
  }
  return;
}

// Compare object to spec
function compare(object, spec) {
  var ok = true,
      k;

  for (k in spec) {
    if (types.get(spec[k]) === 'object') {
      ok = ok && compare(object[k]);
    }
    else if (types.get(spec[k]) === 'array') {
      ok = ok && !!~spec[k].indexOf(object[k]);
    }
    else {
      if (object[k] !== spec[k])
        return false;
    }
  }

  return ok;
}

function firstByComparison(object, spec) {
  return first(object, function(e) {
    return compare(e, spec);
  });
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

    if (typeof path[i] === 'function') {
      if (types.get(c) !== 'array')
        return;

      c = first(c, path[i]);
    }
    else if (typeof path[i] === 'object') {
      if (types.get(c) !== 'array')
        return;

      c = firstByComparison(c, path[i]);
    }
    else {
      c = c[path[i]];
    }
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
