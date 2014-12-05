/**
 * Baobab Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */
var types = require('typology');

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

// Merge objects
function conflict(a, b, key) {
  return (key in (a || {}) && (key in (b || {})));
}

function merge() {
  var res = {},
      current,
      next,
      l = arguments.length,
      i,
      k;

  for (i = l - 1; i >= 0; i--) {
    for (k in arguments[i]) {
      current = res[k];
      next = arguments[i][k];

      if (current && types.check(next, 'object')) {

        if (conflict(current, next, '$push')) {
          if (types.check(current.$push, 'array'))
            current.$push = current.$push.concat(next.$push);
          else
            current.$push = [current.$push].concat(next.$push);
        }
        else if (conflict(current, next, '$unshift')) {
          if (types.check(next.$unshift, 'array'))
            current.$unshift = next.$unshift.concat(current.$unshift);
          else
            current.$unshift = [next.$unshift].concat(current.$unshift);
        }
        else {
          res[k] = merge(next, current);
        }
      }
      else {
        res[k] = next;
      }
    }
  }

  return res;
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
  merge: merge,
  pathObject: pathObject
};
