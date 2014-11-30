/**
 * React Mixins
 * =============
 *
 * Compilation of react mixins designed to deal with cursors integration into
 * the components logic.
 */

module.exports = {
  cursor: function(instance) {
    return {
      componentWillMount: function() {

        // Binding cursor to instance
        this.cursor = instance;

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
