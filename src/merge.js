/**
 * Baobab Merge
 * =============
 *
 * A function used to merge updates in the stack.
 */
var types = require('typology');

// Helpers
function conflict(a, b, key) {
  return (key in (a || {}) && (key in (b || {})));
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

module.exports = merge;
