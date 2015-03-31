/**
 * Baobab Merge
 * =============
 *
 * A function used to merge updates in the stack.
 */
var helpers = require('./helpers.js'),
    type = require('./type.js');

// Helpers
var COMMANDS = ['$unset', '$set', '$merge', '$apply'];

// TODO: delete every keys
function only(o, n, keep) {
  COMMANDS.forEach(function(c) {
    if (keep !== c)
      delete o[c];
  });

  o[keep] = n[keep];
}

// Main function
// TODO: use a better way than shallow cloning b?
function merge(a, b) {
  var o = helpers.shallowClone(b || {}),
      k,
      i;

  COMMANDS.forEach(function(c) {
    if (a[c])
      only(o, a, c);
  });

  if (a.$chain) {
    COMMANDS.slice(0, -1).forEach(function(c) {
      delete o[c];
    });

    if (o.$apply)
      o.$apply = helpers.compose(o.$apply, a.$chain);
    else
      o.$apply = a.$chain;
  }

  if (a.$push && o.$push) {
    if (type.Array(o.$push))
      o.$push = o.$push.concat(a.$push);
    else
      o.$push = [o.$push].concat(a.$push);
  }
  else if (a.$push) {
    o.$push = a.$push;
  }

  if (a.$unshift && o.$unshift) {
    if (type.Array(a.$unshift))
      o.$unshift = a.$unshift.concat(o.$unshift);
    else
      o.$unshift = [a.$unshift].concat(o.$unshift);
  }
  else if (a.$unshift) {
    o.$unshift = a.$unshift;
  }

  for (k in a) {

    if (type.Object(a[k]))
      o[k] = merge(a[k], o[k]);
    else if (k[0] !== '$')
      o[k] = a[k];
  }

  return o;
}

module.exports = merge;
