/**
 * Baobab React Mixins
 * ====================
 *
 * Compilation of react mixins designed to deal with cursors integration.
 */
var types = require('./typology.js');

module.exports = {
  baobab: function(baobab) {
    return {
      componentWillMount: function() {

        // Binding baobab to instance
        this.baobab = baobab;
        this.__type = null;

        // Is there any cursors to create?
        if (this.cursor && this.cursors)
          throw Error('baobab.mixin: you cannot have both ' +
                      '`component.cursor` and `component.cursors`. Please ' +
                      'make up your mind.');

        if (this.cursor) {
          if (!types.check(this.cursor, 'string|array|cursor'))
            throw Error('baobab.mixin.cursor: invalid data (cursor, string or array).');

          if (!types.check(this.cursor, 'cursor'))
            this.cursor = baobab.select(this.cursor);
          this.__type = 'single';
        }
        else if (this.cursors) {
          if (!types.check(this.cursors, 'object|array'))
            throw Error('baobab.mixin.cursor: invalid data (object or array).');

          if (types.check(this.cursors, 'array')) {
            this.cursors = this.cursors.map(function(path) {
              return types.check(path, 'cursor') ? path : baobab.select(path);
            });
            this.__type = 'array';
          }
          else {
            // TODO: better validation
            for (var k in this.cursors) {
              if (!types.check(this.cursors[k], 'cursor'))
                this.cursors[k] = baobab.select(this.cursors[k]);
            }
            this.__type = 'object';
          }
        }

        // Making update handler
        var fired = false;
        this.__updateHandler = (function() {
          if (!fired) {
            this.forceUpdate();
            fired = true;
            setTimeout(function() {
              fired = false;
            }, 0);
          }
        }).bind(this);
      },
      componentDidMount: function() {
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
            this.cursors[k].on('update', this.__updateHandler);
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
            this.cursors[k].off('update', this.__updateHandler);
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
        this.__updateHandler = (function() {
          this.forceUpdate();
        }).bind(this);
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
