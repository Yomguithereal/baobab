/**
 * Baobab Update
 * ==============
 *
 * A handy method to mutate an atom according to the given specification.
 * Mostly inspired by http://facebook.github.io/react/docs/update.html
 */
var types = require('./typology.js');

var COMMANDS = {};
[
  '$set',
  '$push',
  '$unshift',
  '$apply'
].forEach(function(c) {
  COMMANDS[c] = true;
});

// Helpers
function makeError(path, message) {
  var e = new Error('precursors.update: ' + message + ' at path /' +
                    path.toString());

  e.path = path;
  return e;
}

// Core function
function update(target, spec, opts) {
  var log = {};

  // Closure mutating the internal object
  (function mutator(o, spec, path) {
    path = path || [];

    var hash = path.join('λ'),
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
        if (hash && !log[hash])
          log[hash] = true;

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
          h = hash ? hash + 'λ' + k : k;
          v = spec[k].$set;

          // Logging update
          if (h && !log[h])
            log[h] = true;
          o[k] = v;
        }
        else if ('$apply' in (spec[k] || {})) {
          h = hash ? hash + 'λ' + k : k;
          fn = spec[k].$apply;

          if (typeof fn !== 'function')
            throw makeError(path.concat(k), 'using command $apply with a non function');

          // Logging update
          if (h && !log[h])
            log[h] = true;
          o[k] = fn.call(null, o[k]);
        }
        else {

          // If nested object does not exist, we create it
          if (typeof o[k] === 'undefined')
            o[k] = {};

          // Recur
          mutator(
            o[k],
            spec[k],
            path.concat(k)
          );
        }
      }
    }
  })(target, spec);

  return Object.keys(log).map(function(hash) {
    return hash.split('λ');
  });
}

// Exporting
module.exports = update;
