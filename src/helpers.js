/**
 * Precursors Helpers
 * ===================
 *
 * Miscellaneous helper functions.
 */
var Immutable = require('immutable');

// Return a fake object relative to the given path
function pathObject(path, spec) {
  var l = path.length,
      o = {},
      c = o,
      i;

  for (i = 0; i < l; i++) {
    c[path[i]] = (i + 1 === l) ? spec : {};
    c = c[path[i]];
  }

  return Immutable.fromJS(o);
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
    window.requestAnimationFrame :
    function(fn) {setTimeout(fn, 0);};

module.exports = {
  inherits: inherits,
  later: later,
  pathObject: pathObject
};
