/**
 * Baobab Facet Abstraction
 * =========================
 *
 * Facets enable the user to define views on a given Baobab tree.
 */
var EventEmitter = require('emmett'),
    helpers = require('./helpers.js'),
    type = require('./type.js');

function identity(v) {
  return v;
}

function Facet(tree, definition) {
  var self = this;

  var map = definition.cursors,
      solved = false,
      solver = type.Function(definition.get) ? definition.get : identity,
      data = null;

  if (!type.FacetCursors(map))
    throw Error('baobab.Facet: incorrect cursors mapping.');

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.tree = tree;

  // Path solving
  var paths = Object.keys(map).map(function(k) {
    return map[k];
  });

  var solvedPaths = paths,
      complex = paths.some(type.ComplexPath);

  function solvePaths() {
    if (complex)
      solvedPaths = paths.map(function(p) {
        return helpers.solvePath(self.tree.data, p, self.tree);
      });
  }

  this.updateHandler = function(e) {
    if (helpers.solveUpdate(e.data.log, solvedPaths)) {
      solved = false;
      self.emit('update');
    }
  };

  solvePaths();
  this.tree.on('update', this.updateHandler);

  // Data solving
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
}

helpers.inherits(Facet, EventEmitter);

Facet.prototype.release = function() {
  this.tree.off('update', this.updateHandler);

  this.tree = null;
  this.kill();
};

module.exports = Facet;
