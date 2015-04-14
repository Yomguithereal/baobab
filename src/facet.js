/**
 * Baobab Facet Abstraction
 * =========================
 *
 * Facets enable the user to define views on a given Baobab tree.
 */
var Watcher = require('./watcher.js');

function Facet(tree, definition) {
  var self = this;

  // Private
  var data = null,
      solved = false
      solver = definition.get;

  var paths = Object.keys(definition.cursors).map(function(k) {
    return definition.cursors[k];
  });

  // Watcher
  var watcher = new Watcher(tree, paths);

  function bind(name) {
    self[name] = watcher[name].bind(watcher);
  }

  ['on', 'once'].forEach(bind);

  this.get = function() {
    if (this.solved)
      return data;

    // Solving
  };
}

module.exports = Facet;
