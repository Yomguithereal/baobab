/**
 * Baobab Merge
 * =============
 *
 * A function used to merge updates in the stack.
 */
var helpers = require('./helpers.js'),
    type = require('./type.js');

// Helpers
function hasKey(o, key) {
  return key in (o || {});
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

    // Upper $set/$apply... and conflicts
    // When solving conflicts, here is the priority to apply:
    // -- 1) $set
    // -- 2) $merge
    // -- 3) $apply
    // -- 4) $chain
    if (arguments[i].$set) {
      delete res.$apply;
      delete res.$merge;
      res.$set = arguments[i].$set;
      continue;
    }
    else if (arguments[i].$merge) {
      delete res.$set;
      delete res.$apply;
      res.$merge = arguments[i].$merge;
      continue;
    }
    else if (arguments[i].$apply){
      delete res.$set;
      delete res.$merge;
      res.$apply = arguments[i].$apply;
      continue;
    }
    else if (arguments[i].$chain) {
      delete res.$set;
      delete res.$merge;

      if (res.$apply)
        res.$apply = helpers.compose(res.$apply, arguments[i].$chain);
      else
        res.$apply = arguments[i].$chain;
      continue;
    }

    for (k in arguments[i]) {
      current = res[k];
      next = arguments[i][k];

      if (current && type.Object(next)) {

        // $push conflict
        if (conflict(current, next, '$push')) {
          if (type.Array(current.$push))
            current.$push = current.$push.concat(next.$push);
          else
            current.$push = [current.$push].concat(next.$push);
        }

        // $unshift conflict
        else if (conflict(current, next, '$unshift')) {
          if (type.Array(next.$unshift))
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
