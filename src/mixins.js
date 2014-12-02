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
        this.__type = null;

        // Is there any cursors to create?
        if (this.cursor && this.cursors)
          throw Error('precursors.Atom.mixin: you cannot have both ' +
                      '`component.cursor` and `component.cursors`. Please ' +
                      'make up your mind.');

        if (this.cursor) {
          if (!types.check(this.cursor, 'string|array|cursor'))
            throw Error('precursors.Atom.mixin.cursor: invalid data (string or array).');

          this.cursor = atom.select(this.cursor);
          this.__type = 'single';
        }
        else if (this.cursors) {
          if (!types.check(this.cursors, 'object|array'))
            throw Error('precursors.Atom.mixin.cursor: invalid data (object or array).');

          if (types.check(this.cursors, 'array')) {
            this.cursors = this.cursors.map(function(path) {
              return types.check(path, 'cursor') ? path : atom.select(path);
            });
            this.__type = 'array';
          }
          else {
            for (var k in this.cursors) {
              if (!types.check(path, 'cursor'))
                this.cursors[k] = atom.select(this.cursors[k]);
            }
            this.__type = 'object';
          }
        }

        // Making update handler
        this.__updateHandler = this.forceUpdate.bind(this);
      },
      componentDidMount: function() {
        if (this.__type === 'single') {
          this.cursor.on('update', this.__updateHandler);
        }
        else if (this.__type === 'array') {
          this.cursors.forEach(function(cursor) {
            cursor.on('update', this.__updateHandler);
          }, this);
        }
        else if (this.__type === 'object') {
          for (var k in this.cursors)
            cursors[k].on('update', this.__updateHandler);
        }
      },
      componentWillUnmount: function() {
        if (this.__type === 'single') {
          this.cursor.off('update', this.__updateHandler);
        }
        else if (this.__type === 'array') {
          this.cursors.forEach(function(cursor) {
            cursor.off('update', this.__updateHandler);
          }, this);
        }
        else if (this.__type === 'object') {
          for (var k in this.cursors)
            cursors[k].off('update', this.__updateHandler);
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
