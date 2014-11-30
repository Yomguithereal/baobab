var assert = require('assert'),
    Immutable = require('immutable'),
    Map = Immutable.Map,
    List = Immutable.List,
    Atom = require('../src/atom.js'),
    Cursor = require('../src/cursor.js'),
    async = require('async'),
    helpers = require('../src/helpers.js');

// TODO LIST
//-- 1) Update (with stack)
//-- 2) Events
//-- 3) Recording
//-- 4) Options cloning/stack resolution
//-- 6) Immutable types and so on... fit into typology and instantiation
//-- 7) Mixins
//-- 8) Go up in selection
//-- 9) Merging pushes etc.
//-- 0) Better error messages
//-- 0) Selection in lists
//-- 0) New should be optional
//-- 0) Nice toJSON like Immutable
//-- 0) Select polymorphisms
//-- 0) refactor update --> Atom

// Helpers
function assertImmutable(v1, v2) {
  return Immutable.is(Immutable.fromJS(v1), Immutable.fromJS(v2));
}

// Samples
var state = {
  primitive: 3,
  one: {
    subone: {
      hello: 'world'
    },
    subtwo: {
      colors: ['blue', 'yellow']
    }
  },
  two: {
    firstname: 'John',
    lastname: 'Dillinger'
  },
  setLater: null
};

// Tests
describe('Precursors', function() {

  describe('Helpers', function() {

    describe('Object path', function() {

      it('should be possible to retrieve path objects.', function() {
        var o = helpers.pathObject(['one', 'subtwo'], {$set: ['purple']});
        assert.deepEqual(o.toJS(), {one: {subtwo: {$set: ['purple']}}});
      });
    });

    describe('Update API', function() {

      // it('should be possible to set primitive values.', function() {

      // });

      it('should be possible to set nested values.', function() {
        var o1 = Immutable.fromJS({hello: {world: 'one'}}),
            o2 = helpers.update(o1, {hello: {world: {$set: 'two'}}}).data;

        assert.deepEqual(o1.toJS(), {hello: {world: 'one'}});
        assert.deepEqual(o2.toJS(), {hello: {world: 'two'}});
      });

      it('should be possible to push to nested values.', function() {
        var o1 = Immutable.fromJS({colors: ['orange']}),
            o2 = helpers.update(o1, {colors: {$push: 'blue'}}).data;

        assert.deepEqual(o1.toJS(), {colors: ['orange']});
        assert.deepEqual(o2.toJS(), {colors: ['orange', 'blue']});
      });
    });
  });

  describe('Atom API', function() {

    describe('Basics', function() {
      var atom = new Atom(state);

      it('should be possible to retrieve full data.', function() {
        var data = atom.get();
        assert(data instanceof Map);
        assertImmutable(data, state);
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = atom.get(['one', 'subtwo', 'colors']);
        assert(colors instanceof List);
        assertImmutable(colors, state.colors);

        // Polymorphism
        var primitive = atom.get('primitive');
        assert.strictEqual(primitive, 3);
      });

      it('should be possible to get data from both maps and lists.', function() {
        var yellow = atom.get(['one', 'subtwo', 'colors', 1]);

        assert.strictEqual(yellow, 'yellow');
      });

      it('should return undefined when data is not to be found through path.', function() {
        var inexistant = atom.get(['no']);
        assert.strictEqual(inexistant, undefined);

        // Nesting
        var nestedInexistant = atom.get(['no', 'no']);
        assert.strictEqual(nestedInexistant, undefined);
      });

      it('should throw an error when trying to instantiate an atom with incorrect data.', function() {
        assert.throws(function() {
          new Atom(undefined);
        }, /invalid data/);
      });

      it('selecting data in the atom should return a cursor.', function() {
        assert(atom.select(['one']) instanceof Cursor);
      });

      it('should be possible to listen to update events.', function(done) {
        atom.on('update', function(e) {
          var oldData = e.data.oldData,
              newData = e.data.newData,
              c = ['on', 'subtwo', 'colors'];

          assertImmutable(oldData.getIn(c), ['blue', 'yellow']);
          assertImmutable(newData.getIn(c), ['blue', 'yellow', 'purple']);
          done();
        });

        atom.update({one: {subtwo: {colors: {$push: 'purple'}}}});
      });
    });
  });

  describe('Cursor API', function() {

    describe('Basics', function() {
      var atom = new Atom(state);

      var colorCursor = atom.select(['one', 'subtwo', 'colors']),
          oneCursor = atom.select('one');


      it('should be possible to retrieve data at cursor.', function() {
        var colors = colorCursor.get();

        assert(colors instanceof List);
        assertImmutable(colors, state.colors);
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = oneCursor.get(['subtwo', 'colors']);

        assertImmutable(colors, state.colors);
      });

      it('should be possible to create subcursors.', function() {
        var sub = oneCursor.select(['subtwo', 'colors']);
        assertImmutable(sub.get(), state.colors)
      });

      it('should be possible to listen to updates.', function(done) {
        colorCursor.on('update', function() {
          assertImmutable(colorCursor.get(), ['blue', 'yellow', 'purple']);
          done();
        });

        colorCursor.push('purple');
      });
    });

    describe('Advanced', function() {

      // NOTES: if parent update > children update
      // NOTES: if child updates > parent updates
      // NOTES: maybe I should let the parent propagate events (but only once. hard)

      it('when a parent updates, so does the child.', function(done) {
        var atom = new Atom(state),
            parent = atom.select('two'),
            child = atom.select(['two', 'firstname']);

        var count = 0;

        async.parallel({
          parent: function(next) {
            parent.on('update', function() {
              console.log('ici')
              count++;
              next();
            });
          },
          child: function(next) {
            child.on('update', function() {
              console.log('ici')
              count++;
              next();
            });
          }
        }, function() {
          assert.strictEqual(count, 2);
          done();
        });

        parent.set({firstname: 'Napoleon', lastname: 'Bonaparte'});
      });
    });
  });
});
