/**
 * Baobab Facet Abstraction
 * =========================
 *
 * Facets enable the user to define views on a given Baobab tree.
 */
var EventEmitter = require('emmett'),
    Watcher = require('./watcher.js'),
    helpers = require('./helpers.js'),
    type = require('./type.js');

function identity(v) {
  return v;
}

function Facet(tree, definition) {
  var self = this;

  // // Extending event emitter
  // EventEmitter.call(this);

  // // Properties
  // this.tree = tree;



  // ...



  // Private
  var data = null,
      solved = false,
      solver = definition.get || identity,
      map = definition.cursors;

  var paths = Object.keys(map).map(function(k) {
    return map[k];
  });

  // Watcher
  var watcher = new Watcher(tree, paths);

  function bind(name) {
    self[name] = watcher[name].bind(watcher);
  }

  ['on', 'once', 'release'].forEach(bind);

  // Getting facet data
  this.get = function() {
    if (solved)
      return data;

    // Solving
    var cursorsData = {};

    for (var k in map)
      cursorsData[k] = tree.get(map[k]);

    data = solver.call(null, cursorsData);
    solved = true;

    return data;
  };

  // Resetting flag on cursor update
  this.on('update', function() {
    solved = false;
  });
}

// helpers.inherits(Facet, EventEmitter);

module.exports = Facet;
