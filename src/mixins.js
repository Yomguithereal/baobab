/**
 * React Mixins
 * =============
 *
 * Compilation of react mixins designed to deal with cursors integration.
 */
var types = require('./typology.js');

module.exports = {
  atom: function(atom) {
    return {
      componentWillMount: function() {

        // Binding atom to instance
        this.atom = atom;

        // Is there any cursors to create?
        if (this.cursor && this.cursors)
          throw Error('precursors.Atom.mixin: you cannot have both ' +
                      '`component.cursor` and `component.cursors`. Please ' +
                      'make up your mind.');

        if (this.cursor) {
          if (!types.check(this.cursor, 'string|array|cursor'))
            throw Error('precursors.Atom.mixin.cursor: invalid data (string or array).');

          this.cursor = atom.select(this.cursor);
        }
        else if (this.cursors) {
          if (!types.check(this.cursors, 'object|array'))
            throw Error('precursors.Atom.mixin.cursor: invalid data (object or array).');

          if (types.check(this.cursors, 'array')) {
            this.cursors = this.cursors.map(function(path) {
              return types.check(path, 'cursor') ? path : atom.select(path);
            });
          }
          else {
            for (var k in this.cursors) {
              if (!types.check(path, 'cursor'))
                this.cursors[k] = atom.select(this.cursors[k]);
            }
          }
        }
      }
    };
  },
  cursor: function(cursor) {
    return {
      componentWillMount: function() {

        // Binding cursor to instance
        this.cursor = cursor;

        // Making update handler
        this.__updateHandler = this.forceUpdate.bind(this);
      },
      componentDidMount: function() {

        // Listening to updates
        this.cursor.on('update', this.__updateHandler);
      },
      componentWillUnmount: function() {

        // Unbinding handler
        this.cursor.off('update', this.__updateHandler);
      }
    };
  }
};
