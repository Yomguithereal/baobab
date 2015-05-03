/**
 * Baobab Update
 * ==============
 *
 * A handy method to mutate an atom according to the given specification.
 * Mostly inspired by http://facebook.github.io/react/docs/update.html
 */
var helpers = require('./helpers.js'),
    type = require('./type.js');

// Helpers
function makeError(path, message) {
  var e = new Error('baobab.update: ' + message + ' at path /' +
                    path.slice(1).join('/'));

  e.path = path;
  return e;
}

module.exports = function(data, spec, opts) {
  opts = opts || {};

  var log = {};

  // Shifting root
  data = {root: helpers.shallowClone(data)};

  // Closure performing the updates themselves
  var mutator = function(o, spec, path, parent) {
    path = path || ['root'];

    var hash = path.join('|λ|'),
        lastKey = path[path.length - 1],
        oldValue = o[lastKey],
        fn,
        k,
        v,
        i,
        l;

    // Are we at leaf level?
    var leafLevel = Object.keys(spec).some(function(k) {
      return k.charAt(0) === '$';
    });

    // Leaf level updates
    if (leafLevel) {
      log[hash] = true;

      for (k in spec) {

        // $unset
        if (k === '$unset') {
          var olderKey = path[path.length - 2];

          if (!type.Object(parent[olderKey]))
            throw makeError(path.slice(0, -1), 'using command $unset on a non-object');

          parent[olderKey] = helpers.shallowClone(o);
          delete parent[olderKey][lastKey];

          if (opts.immutable)
            helpers.freeze(parent[olderKey]);
          break;
        }

        // $set
        if (k === '$set') {
          v = spec.$set;

          o[lastKey] = v;
        }

        // $apply
        else if (k === '$apply' || k === '$chain') {
          fn = spec.$apply || spec.$chain;

          if (typeof fn !== 'function')
            throw makeError(path, 'using command $apply with a non function');

          o[lastKey] = fn.call(null, oldValue);
        }

        // $merge
        else if (k === '$merge') {
          v = spec.$merge;

          if (!type.Object(o[lastKey]) || !type.Object(v))
            throw makeError(path, 'using command $merge with a non object');

          o[lastKey] = helpers.shallowMerge(o[lastKey], v);
        }

        // $splice
        if (k === '$splice') {
          v = spec.$splice;

          if (!type.Array(o[lastKey]))
            throw makeError(path, 'using command $push to a non array');

          for (i = 0, l = v.length; i < l; i++)
            o[lastKey] = helpers.splice.apply(null, [o[lastKey]].concat(v[i]));
        }

        // $push
        if (k === '$push') {
          v = spec.$push;

          if (!type.Array(o[lastKey]))
            throw makeError(path, 'using command $push to a non array');

          o[lastKey] = o[lastKey].concat(v);
        }

        // $unshift
        if (k === '$unshift') {
          v = spec.$unshift;

          if (!type.Array(o[lastKey]))
            throw makeError(path, 'using command $unshift to a non array');

          o[lastKey] = [].concat(v).concat(o[lastKey]);
        }

        // Deep freezing the new value?
        if (opts.immutable)
          helpers.deepFreeze(o);
      }
    }
    else {

      // If nested object does not exist, we create it
      if (type.Primitive(o[lastKey]))
        o[lastKey] = {};
      else
        o[lastKey] = helpers.shallowClone(o[lastKey]);

      // Should we freeze the parent?
      if (opts.immutable)
        helpers.freeze(o);

      for (k in spec)  {

        // Recur
        mutator(
          o[lastKey],
          spec[k],
          path.concat(k),
          o
        );
      }
    }
  };

  mutator(data, spec);

  // Returning data and path log
  return {
    data: data.root,

    // SHIFT LOG
    log: Object.keys(log).map(function(hash) {
      return hash.split('|λ|').slice(1);
    })
  };
};
