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

      // Run Baobab mixin first to allow mixins to access cursors
      mixins: [{
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
            if (!types.check(this.cursor, 'string|number|array|cursor'))
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

          // A factory that creates the function to update the state of cursors to the
          // component state. This is needed due to Reacts PureRenderMixin check of 
          // equality. 
          var getState = (function (component) {

            var state = {};

            // Prepare reference for state values. This will ensure that
            // the state holders (array|object) will never change reference.
            // This is important for predictability using the PureRenderMixin
            if (component.__type === 'single') {
              state.cursor = null;
            } else {
              state.cursors = component.__type === 'array' ? [] : {};
            }

            return function () {

              switch(component.__type) {
                case 'single':
                  state.cursor = component.cursor.get();
                  break;
                case 'array':
                  component.cursors.forEach(function (cursor, index) {
                    state.cursors[index] = cursor.get();
                  }.bind(this));
                  break;
                case 'object':
                  Object.keys(component.cursors).forEach(function (cursorKey) {
                    state.cursors[cursorKey] = component.cursors[cursorKey].get();
                  }.bind(this));
                  break;
              }

              return state;

            };
          }(this));
          
          this.setState(getState());

          // Making update handler
          var fired = false;
          this.__updateHandler = (function() {
            if (!fired) {
              this.setState(getState(), function () {
                fired = false;
              });
              fired = true;
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
      }].concat(baobab.options.mixins) 
    };
  },
  cursor: function(cursor) {
    return {

      // Run cursor mixin first to allow mixins to access cursors
      mixins: [{
        componentWillMount: function() {

          // Binding cursor to instance
          this.cursor = cursor;

          // Set the initial state
          this.setState({
            cursor: cursor.get()
          });

          // Making update handler
          this.__updateHandler = (function() {
            this.setState({
              cursor: cursor.get()
            });
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
      }].concat(cursor.root.options.mixins)
    };
  }
};
