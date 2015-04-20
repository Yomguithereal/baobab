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

function Facet(tree, definition, scope) {
  var self = this;

  var solved = false,
      mapping = definition.cursors,
      complex = typeof definition.cursors === 'function',
      getter = definition.get,
      data = null;

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.tree = tree;
  this.cursors = null;

  // Refreshing the internal mapping
  this.refresh = function() {
    if (!complex && this.cursors)
      return;

    solved = false;

    var solvedMapping = mapping;

    if (complex) {
      solvedMapping = mapping.call(scope);
    }

    if (!type.FacetCursors(solvedMapping))
      throw Error('baobab.Facet: incorrect cursors mapping.');

    this.cursors = {};

    Object.keys(solvedMapping).forEach(function(k) {

      if (solvedMapping[k] instanceof Cursor) {
        self.cursors[k] = solvedMapping[k];
        return;
      }

      if (type.Path(solvedMapping[k])) {
        self.cursors[k] = tree.select(solvedMapping[k]);
        return;
      }

      throw Error('baobab.Facet: invalid path returned by function in cursors mapping.');
    });
  };

  // Data solving
  this.get = function() {
    if (solved)
      return data;

    // Solving
    var cursorsData = {};

    for (var k in self.cursors)
      cursorsData[k] = self.cursors[k].get();

    data = typeof getter === 'function' ?
      getter.call(null, cursorsData) :
      cursorsData;

    solved = true;

    return data;
  };

  // Tracking the tree's updates
  this.updateHandler = function(e) {
    var paths = Object.keys(self.cursors).map(function(k) {
      return self.cursors[k].solvedPath;
    })

    if (helpers.solveUpdate(e.data.log, paths)) {
      solved = false;
      self.emit('update');
    }
  };

  // Init routine
  this.refresh();
  this.tree.on('update', this.updateHandler);
}

helpers.inherits(Facet, EventEmitter);

Facet.prototype.release = function() {
  this.tree.off('update', this.updateHandler);

  this.tree = null;
  this.cursors = null;
  this.kill();
};

module.exports = Facet;
