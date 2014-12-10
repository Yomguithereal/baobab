/**
 * Baobab Merge
 * =============
 *
 * A function used to merge updates in the stack.
 */
var types = require('typology'),
    helpers = require('./helpers.js');

// Helpers
function hasKey(o, key) {
  return key in (o || {});
}

function hasOneOf(o, keys) {
  for (var i = 0, l = keys.length; i < l; i++)
    if (hasKey(o, keys[i]))
      return true;
  return false;
}

function hasCommand(o) {
  return Object.keys(o).some(function(k) {
    return k.charAt(0) === '$';
  });
}

function conflict(a, b, key) {
  return hasKey(a, key) && hasKey(b, key);
}

// Main function
function merge() {
  var res = {},
      current,
      next,
      l = arguments.length,
      i,
      k;

  for (i = l - 1; i >= 0; i--) {

    // Upper $set/$apply and conflicts
    // TODO: Boooo! Ugly...
    if (hasOneOf(arguments[i], ['$set', '$apply', '$chain'])) {
      if (res.$set && (arguments[i].$apply || arguments[i].$chain)) {
        delete res.$set;
        res.$apply = arguments[i].$apply || arguments[i].$chain;
      }
      else if (res.$apply && arguments[i].$set) {
        delete res.$apply;
        res.$set = arguments[i].$set;
      }
      else if (arguments[i].$set) {
        res.$set = arguments[i].$set;
      }
      else if (arguments[i].$apply) {
        res.$apply = arguments[i].$apply;
      }
      else if (arguments[i].$chain) {
        if (res.$apply)
          res.$apply = helpers.compose(res.$apply, arguments[i].$chain);
        else
          res.$apply = arguments[i].$chain;
      }

      continue;
    }

    for (k in arguments[i]) {
      current = res[k];
      next = arguments[i][k];

      if (current && types.check(next, 'object')) {

        // $push conflict
        if (conflict(current, next, '$push')) {
          if (types.check(current.$push, 'array'))
            current.$push = current.$push.concat(next.$push);
          else
            current.$push = [current.$push].concat(next.$push);
        }

        // $unshift conflict
        else if (conflict(current, next, '$unshift')) {
          if (types.check(next.$unshift, 'array'))
            current.$unshift = next.$unshift.concat(current.$unshift);
          else
            current.$unshift = [next.$unshift].concat(current.$unshift);
        }

        // No conflict
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

module.exports = merge;
