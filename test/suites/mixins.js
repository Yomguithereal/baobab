/**
 * Baobab Mixins Unit Tests
 * =========================
 */
var assert = require('assert'),
    React = require('react/addons'),
    Baobab = require('../../src/baobab.js'),
    jsdom = require('jsdom').jsdom;

var testMixin = {
  getInitialState: function() {
    return {greeting: 'Yeah'};
  }
};

describe('React Mixins', function() {

  before(function() {

    // Setting jsdom
    var dom = jsdom('');
    global.document = dom;
    global.window = dom.parentWindow;

    require('react/lib/ExecutionEnvironment').canUseDOM = true;
  });

  after(function() {
    delete global.document;
    delete global.window;
  });

  describe('Cursor Mixin', function() {

    it('the mixin should work as stated.', function(done) {
      var baobab = new Baobab({hello:'world'}),
          cursor = baobab.select('hello');

      var Component = React.createClass({
        mixins: [cursor.mixin],
        render: function() {
          return React.createElement('div', {id: 'cursor'}, this.cursor.get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#cursor').textContent, 'world');

        baobab.set('hello', 'john');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#cursor').textContent, 'john');
          done();
        });
      });
    });

    it('should allow mixins in options to access the cursors', function () {
      var baobab = new Baobab({
        foo: {
          bar: []
        }
      }, {
        mixins: [{
          componentWillMount: function () {
            assert.strictEqual(this.cursor.get(), baobab.select('foo', 'bar').get());
          }
        }]
      }); 
    
      var Component = React.createClass({
        mixins: [baobab.select('foo', 'bar').mixin],
        render: function() {
          return React.createElement('div', {}, null);
        }
      });

      React.render(React.createElement(Component, null), document.body);

    });

  });

  describe('Tree mixin', function() {

    it('should be possible to pass a single path.', function(done) {
      var baobab = new Baobab({hello:'world'});

      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursor: ['hello'],
        render: function() {
          return React.createElement('div', {id: 'treepath'}, this.cursor.get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#treepath').textContent, 'world');

        baobab.set('hello', 'john');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#treepath').textContent, 'john');
          done();
        });
      });
    });

    it('should be possible to pass a single cursor.', function(done) {
      var baobab = new Baobab({hello:'world'});

      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursor: baobab.select('hello'),
        render: function() {
          return React.createElement('div', {id: 'treecursor'}, this.cursor.get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#treecursor').textContent, 'world');

        baobab.set('hello', 'john');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#treecursor').textContent, 'john');
          done();
        });
      });
    });

    it('should be possible to pass an array of paths.', function(done) {
      var baobab = new Baobab({name:'John', surname: 'Talbot'});

      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursors: [['name'], ['surname']],
        render: function() {
          return React.createElement('div', {id: 'treepathlist'}, this.cursors[0].get() + ' ' + this.cursors[1].get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#treepathlist').textContent, 'John Talbot');

        baobab.set('name', 'Jack');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#treepathlist').textContent, 'Jack Talbot');
          done();
        });
      });
    });

    it('should be possible to pass an array of cursors.', function(done) {
      var baobab = new Baobab({name:'John', surname: 'Talbot'});

      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursors: [['name'], baobab.select('surname')],
        render: function() {
          return React.createElement('div', {id: 'treepathcursors'}, this.cursors[0].get() + ' ' + this.cursors[1].get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#treepathcursors').textContent, 'John Talbot');

        baobab.set('name', 'Jack');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#treepathcursors').textContent, 'Jack Talbot');
          done();
        });
      });
    });

    it('should be possible to pass an object of paths.', function(done) {
      var baobab = new Baobab({name:'John', surname: 'Talbot'});

      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursors: {
          name: ['name'],
          surname: ['surname']
        },
        render: function() {
          return React.createElement('div', {id: 'treepathobject'}, this.cursors.name.get() + ' ' + this.cursors.surname.get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#treepathobject').textContent, 'John Talbot');

        baobab.set('name', 'Jack');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#treepathobject').textContent, 'Jack Talbot');
          done();
        });
      });
    });

    it('should be possible to pass an object of cursors.', function(done) {
      var baobab = new Baobab({name:'John', surname: 'Talbot'});

      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursors: {
          name: ['name'],
          surname: baobab.select('surname')
        },
        render: function() {
          return React.createElement('div', {id: 'treepathoc'}, this.cursors.name.get() + ' ' + this.cursors.surname.get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#treepathoc').textContent, 'John Talbot');

        baobab.set('name', 'Jack');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#treepathoc').textContent, 'Jack Talbot');
          done();
        });
      });
    });

    it('should be possible to pass custom mixins.', function(done) {
      var baobab = new Baobab({name:'John', surname: 'Talbot'}, {mixins: [testMixin]});

      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursor: ['name'],
        render: function() {
          return React.createElement('div', {id: 'treepathmixin'}, this.state.greeting + ' ' + this.cursor.get());
        }
      });

      React.render(React.createElement(Component, null), document.body, function() {
        assert.strictEqual(document.querySelector('#treepathmixin').textContent, 'Yeah John');

        baobab.set('name', 'Jack');
        process.nextTick(function() {
          assert.strictEqual(document.querySelector('#treepathmixin').textContent, 'Yeah Jack');
          done();
        });
      });
    });

    it('should allow mixins in options to access the tree', function () {
      var baobab = new Baobab({
        items: []
      }, {
        mixins: [{
          componentWillMount: function () {
            assert.strictEqual(this.cursor.get(), baobab.select('items').get());
          }
        }]
      }); 
    
      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursor: ['items'],
        render: function() {
          return React.createElement('div', {}, null);
        }
      });

      React.render(React.createElement(Component, null), document.body);

    });

    it('should move state from CURSOR to state object of component', function () {

      var baobab = new Baobab({
        items: []
      }); 
    
      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursor: ['items'],
        render: function() {
          assert.strictEqual(this.state.cursor, this.cursor.get());
          return React.createElement('div', {}, null);
        }
      });

      React.render(React.createElement(Component, null), document.body);

    });

    it('should move state from CURSORS array to state object of component', function () {

      var baobab = new Baobab({
        items: []
      }); 
    
      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursors: [['items']],
        render: function() {
          assert.strictEqual(this.state.cursors[0], this.cursors[0].get());
          return React.createElement('div', {}, null);
        }
      });

      React.render(React.createElement(Component, null), document.body);

    });

    it('should move state from CURSORS map to state object of component', function () {

      var baobab = new Baobab({
        items: []
      }); 
    
      var Component = React.createClass({
        mixins: [baobab.mixin],
        cursors: {
          items: ['items']
        },
        render: function() {
          assert.strictEqual(this.state.cursors.items, this.cursors.items.get());
          return React.createElement('div', {}, null);
        }
      });

      React.render(React.createElement(Component, null), document.body);

    });

    it('should move state from a single CURSOR to state object of component', function () {

      var baobab = new Baobab({
        items: []
      }); 
    
      var Component = React.createClass({
        mixins: [baobab.select('items').mixin],
        render: function() {
          assert.strictEqual(this.state.cursor, this.cursor.get());
          return React.createElement('div', {}, null);
        }
      });

      React.render(React.createElement(Component, null), document.body);

    });

  });
});
