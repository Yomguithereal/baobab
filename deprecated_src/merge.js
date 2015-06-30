/**
 * Baobab Merge
 * =============
 *
 * A function used to merge updates in the stack.
 */
var helpers = require('./helpers.js'),
    type = require('./type.js');

// Helpers
var COMMANDS = ['$unset', '$set', '$apply'];

function only(command, commandValue) {
  var o = {};
  o[command] = commandValue;
  return o;
}

// Main function
function merge(a, b) {
  var o = helpers.shallowClone(a || {}),
      leafLevel = false,
      k,
      i;

  COMMANDS.forEach(function(c) {
    if (c in b) {
      o = only(c, b[c]);
      leafLevel = true;
    }
  });

  if (b.$chain) {

    if (o.$apply)
      o.$apply = helpers.compose(o.$apply, b.$chain);
    else
      o.$apply = b.$chain;

    o = only('$apply', o.$apply);
    leafLevel = true;
  }

  if (b.$merge) {
    o.$merge = helpers.shallowMerge(o.$merge || {}, b.$merge);
    leafLevel = true;
  }

  if (b.$splice || b.$splice) {
    o.$splice = [].concat(o.$splice || []).concat(b.$splice || []);
    leafLevel = true;
  }

  if (b.$push || o.$push) {
    o.$push = [].concat(o.$push || []).concat(b.$push || []);
    leafLevel = true;
  }

  if (b.$unshift || o.$unshift) {
    o.$unshift = [].concat(b.$unshift || []).concat(o.$unshift || []);
    leafLevel = true;
  }

  if (leafLevel)
    return o;

  for (k in o) {
    if (k.charAt(0) === '$')
      delete o[k];
  }

  for (k in b) {
    if (type.Object(b[k]))
      o[k] = merge(o[k], b[k]);
  }

  return o;
}

module.exports = merge;
