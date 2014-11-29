/**
 * Precursors Helpers
 * ===================
 *
 * Miscellaneous helper functions.
 */
var Immutable = require('immutable'),
    Map = Immutable.Map;

// Return a fake object relative to the given path
function pathObject(path, def) {
  var l = path.length,
      o = {},
      c = o,
      i;

  for (i = 0; i < l; i++) {
    c[path[i]] = (i + 1 === l) ? def : {};
    c = c[path[i]];
  }

  return Map(o);
}

// Update immutable data following the given pattern
var COMMANDS = {};
['$set', '$push'].forEach(function(c) {
  COMMANDS[c] = true;
});

function mutator(o, def, last) {
  var k;

  for (k in def) {
    if (COMMANDS[k]) {
      switch (k) {
        case '$set':
          o[last] = def[k];
          break;
      }
    }
    else {
      if (typeof o[k] === 'undefined')
        o[k] = {};
      mutator(o[k] instanceof Object ? o[k] : o, def[k], k);
    }
  }
}

function update(target, def) {
  var o = target.toJS(),
      d = (def.toJS) ? def.toJS() : def,
      k;

  mutator(o, d);

  return Immutable.fromJS(o);
}

// Delay execution until next tick or frame
var later = (typeof window === 'undefined') ?
  process.nextTick :
  ('requestAnimationFrame' in window) ?
    window.requestAnimationFrame :
    function(fn) {setTimeout(fn, 0);};

module.exports = {
  later: later,
  pathObject: pathObject,
  update: update
};
