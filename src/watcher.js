/**
 * Baobab Paths Watcher
 * =====================
 *
 * A simple abstraction that will fire if any watched path updates.
 */
var EventEmitter = require('emmett'),
    helpers = require('./helpers.js'),
    type = require('./type.js');

/**
 * Main Class
 */
function Watcher(tree, paths) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.tree = tree;

  // Privates
  var solvedPaths = paths,
      complex = paths.some(type.ComplexPath);

  function solvePaths() {
    if (complex)
      solvedPaths = paths.map(function(p) {
        return helpers.solvePath(self.tree.data, p, self.tree);
      });
  }

  this.updateHandler = function(e) {
    var shoudlFire = helpers.solveUpdate(e.data.log, solvedPaths);

    if (shoudlFire)
      self.emit('update');
  };

  solvePaths();
  this.tree.on('update', this.updateHandler);
}

helpers.inherits(Watcher, EventEmitter);

Watcher.prototype.release = function() {
  this.tree.off('update', this.updateHandler);

  this.tree = null;
  this.kill();
};

module.exports = Watcher;
