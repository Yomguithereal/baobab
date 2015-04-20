/**
 * Baobab Facet Abstraction
 * =========================
 *
 * Facets enable the user to define views on a given Baobab tree.
 */
var EventEmitter = require('emmett'),
    Cursor = require('./cursor.js'),
    helpers = require('./helpers.js'),
    type = require('./type.js');

function Facet(tree, definition) {
  var self = this;

  var map = definition.cursors,
      solved = false,
      solver = definition.get,
      data = null;

  if (!type.FacetCursors(map))
    throw Error('baobab.Facet: incorrect cursors mapping.');

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.tree = tree;
  this.cursors = {};

  // Path solving
  var paths = Object.keys(map).map(function(k) {
    if (map[k] instanceof Cursor) {
      this.cursors[k] = map[k];
      return map[k].path;
    }
    else {
      this.cursors[k] = tree.select(map[k]);
      return map[k];
    }
  }, this);

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

    for (var k in self.cursors)
      cursorsData[k] = self.cursors[k].get();

    data = typeof solver === 'function' ?
      solver.call(null, cursorsData) :
      cursorsData;

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
