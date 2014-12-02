/**
 * Precursors Update
 * ==================
 *
 * A handy method to mutate an atom according to the given specification.
 * Mostly inspired by http://facebook.github.io/react/docs/update.html
 */
var Immutable = require('immutable'),
    types = require('./typology.js');

var COMMANDS = {};
[
  '$set',
  '$push',
  '$unshift',
  '$merge',
  '$apply'
].forEach(function(c) {
  COMMANDS[c] = true;
});

// Helpers
function makeError(path, message) {
  var e = new Error('precursors.update: ' + message + ' at path "/' +
                    path.toString() + '"');

  e.path = path;
  return e;
}

// Function mutating the object for performance reasons
function mutator(log, o, spec, path) {
  path = path || [];

  var hash = path.join('$$'),
      fn,
      h,
      k,
      v,
      i,
      l;

  for (k in spec) {
    if (COMMANDS[k]) {
      v = spec[k];

      // Logging update
      if (!~log.indexOf(hash))
        log.push(hash);

      // Applying
      switch (k) {
        case '$push':
          if (!types.check(o, 'array'))
            throw makeError(path, 'using command $push to a non array');

          if (!types.check(v, 'array'))
            o.push(v);
          else
            o.push.apply(o, v);
          break;
        case '$unshift':
          if (!types.check(o, 'array'))
            throw makeError(path, 'using command $unshift to a non array');

          if (!types.check(v, 'array'))
            o.unshift(v);
          else
            o.unshift.apply(o, v);
          break;
      }
    }
    else {

      if ('$set' in (spec[k] || {})) {
        h = hash ? hash + '$$' + k : k;
        v = spec[k].$set;

        // Logging update
        if (!~log.indexOf(h))
          log.push(h);
        o[k] = v;
      }
      else if ('$apply' in (spec[k] || {})) {
        h = hash ? hash + '$$' + k : k;
        fn = spec[k].$apply;

        if (typeof fn !== 'function')
          throw makeError(path.concat(k), 'using command $apply with a non function');

        // Logging update
        if (!~log.indexOf(h))
          log.push(h);

        // NOTE: should we send an immutable variable here?
        o[k] = fn.call(null, o[k]);
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
