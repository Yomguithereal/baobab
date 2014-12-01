/**
 * Precursors Update
 * ==================
 *
 * A handy method to mutate an atom according to the given specification.
 * Mostly inspired by http://facebook.github.io/react/docs/update.html
 */
var Immutable = require('immutable');

var COMMANDS = {};
[
  '$set',
  '$push'
].forEach(function(c) {
  COMMANDS[c] = true;
});

// Helpers
function makeError() {

}

// Function mutating the object for performance reasons
function mutator(log, o, spec, path) {
  path = path || [];

  var hash = path.join('$$'),
      h,
      k,
      v;

  for (k in spec) {
    if (COMMANDS[k]) {
      v = spec[k];

      // Logging update
      if (!~log.indexOf(hash))
        log.push(hash);

      // Applying
      switch (k) {
        case '$push':
          if (!(o instanceof Array))
            throw Error('precursors.update: applying command $push to a non array.');
          o.push(v);
          break;
      }
    }
    else {
      if ('$set' in (spec[k] || {})) {
        h = hash ? hash + '$$' + k : k;
        v = spec[k]['$set'];

        // Logging update
        if (!~log.indexOf(h))
          log.push(h);
        o[k] = v;
      }
      else {

        // If nested object does not exist, we create it
        if (typeof o[k] === 'undefined')
          o[k] = {};

        // Recur
        mutator(
          log,
          o[k],
          spec[k],
          path.concat(k)
        );
      }
    }
  }
}

// Core function
function update(target, spec) {
  var o = target.toJS(),
      d = (spec.toJS) ? spec.toJS() : spec,
      log = [],
      k;

  mutator(log, o, d);

  return {
    log: log.map(function(s) {
      return s.split('$$');
    }),
    data: Immutable.fromJS(o)
  };
}

// Exporting
module.exports = update;
