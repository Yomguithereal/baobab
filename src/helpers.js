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
// TODO: optimize obviously...
function merge() {
  var i,
      k,
      res = {},
      l = arguments.length;

  for (i = l - 1; i >= 0; i--)
    for (k in arguments[i])
      if (res[k] && types.check(arguments[i][k], 'object')) {

        if (('$push' in (res[k] || {})) &&
            ('$push' in arguments[i][k])) {
          if (types.check(res[k].$push, 'array'))
            res[k].$push = res[k].$push.concat(arguments[i][k].$push);
          else
            res[k].$push = [res[k].$push].concat(arguments[i][k].$push);
        }
        else if (('$unshift' in (res[k] || {})) &&
                 ('$unshift' in arguments[i][k])) {
          if (types.check(arguments[i][k].$unshift, 'array'))
            res[k].$unshift = arguments[i][k].$unshift.concat(res[k].$unshift);
          else
            res[k].$unshift = [arguments[i][k].$unshift].concat(res[k].$unshift);
        }
        else {
          res[k] = merge(arguments[i][k], res[k]);
        }
      }
      else {
        res[k] = arguments[i][k];
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
