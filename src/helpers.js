/**
 * Precursors Helpers
 * ===================
 *
 * Miscellaneous helper functions.
 */
var Immutable = require('immutable'),
    Map = Immutable.Map;

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

// Update immutable data following the given pattern
var COMMANDS = {};
['$set', '$push'].forEach(function(c) {
  COMMANDS[c] = true;
});

function mutator(o, spec, last) {
  var k,
      v;

  for (k in spec) {
    if (COMMANDS[k]) {
      v = spec[k];

      switch (k) {
        case '$set':
          o[last] = v;
          break;
        case '$push':
          if (!(o instanceof Array))
            throw Error('precursors.update: applying command $push to a non array.');
          o.push(v);
          break;
      }
    }
    else {
      if (typeof o[k] === 'undefined')
        o[k] = {};
      mutator(o[k] instanceof Object ? o[k] : o, spec[k], k);
    }
  }
}

function update(target, spec) {
  var o = target.toJS(),
      d = (spec.toJS) ? spec.toJS() : spec,
      k;

  mutator(o, d);

  return Immutable.fromJS(o);
}

function inherits(ctor, superCtor) {
  ctor.super_ = superCtor
  var TempCtor = function () {}
  TempCtor.prototype = superCtor.prototype
  ctor.prototype = new TempCtor()
  ctor.prototype.constructor = ctor
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
  pathObject: pathObject,
  update: update
};
