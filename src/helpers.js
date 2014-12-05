/**
 * Baobab Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */

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
  getIn: getIn,
  inherits: inherits,
  later: later,
  pathObject: pathObject
};
