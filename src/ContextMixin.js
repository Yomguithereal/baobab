var React = require('react/addons');
var isBrowser = !(global && Object.prototype.toString.call(global.process) === '[object process]');

var ContextMixin = {
  
  // We add the PureRenderMixin for optimized rendering
  mixins: [React.addons.PureRenderMixin],
  
  // We grab the store from the context
  contextTypes: {
    store: React.PropTypes.object,
    actions: React.PropTypes.object
  },
  componentWillMount: function () {

    if (!this.context || !this.context.store) {
      throw new Error('You have to pass a store to you app wrapper');
    }
     
    this.actions = this.context.actions;

    if (!this.cursors) {
      return;
    }

    this.subscriptions = {};
    
    // This is where we create subscriptions to cursors so that
    // the component knows about changes
    var component = this;
    var createSubscription = function (key, cursor) {
      return function (value) {
        var state = {};
        state[key] = cursor.get();
        component.setState(state);
      };
    };

    // We go through the cursors
    var state = {};
    Object.keys(this.cursors).forEach(function (cursorKey) {

      // If we are in the browser we move the current state of the
      // cursor over to the state object, using the key defined on
      // the cursor as the key on our state object. We also register
      // a listener for state changes
      if (isBrowser) {

        var cursor = this.context.store.select(this.cursors[cursorKey]);
        var callback = createSubscription(cursorKey, cursor)
        state[cursorKey] = cursor.get();
        this.subscriptions[cursorKey] = {
          cursor: cursor,
          callback: callback
        };
        cursor.on('update', callback);

      // If we are on the server we use the same cursor path defined,
      // but instead of using the Baobab API, as on the server this is just
      // a plain object, we use the path to drill into the state object and
      // set the state
      } else {

        var path = this.cursors[cursorKey];
        var value = path.reduce(function (contextPath, pathKey, index) {
          return contextPath[pathKey];
        }, this.context.store);
        state[cursorKey] = value;

      }

    }, this);
    
    // Then we actually put that state on the component
    this.setState(state);

  },
  
  // Unregisters listeners of state change
  componentWillUnmount: function () {
    Object.keys(this.subscriptions).forEach(function (subscription) {
      this.subscriptions[subscription].cursor.off('update', subscription.callback);
    }, this);
  }
};

module.exports = ContextMixin;
