var assert = require('assert'),
    Immutable = require('immutable'),
    Atom = require('../src/atom.js'),
    Cursor = require('../src/cursor.js'),
    async = require('async'),
    helpers = require('../src/helpers.js'),
    update = require('../src/update.js'),
    types = require('../src/typology.js');

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

    describe('Typology', function() {

      it('the immutable type should work.', function() {
        assert(types.check(new Immutable.Map(), 'immutable'));
        assert(types.check(new Immutable.List(), 'immutable'));
        assert(types.check('string', 'immutable'));
        assert(types.check(42, 'immutable'));
        assert(!types.check({}, 'immutable'));
      });
    });

    describe('Object path', function() {

      it('should be possible to retrieve path objects.', function() {
        var o = helpers.pathObject(['one', 'subtwo'], {$set: ['purple']});
        assert.deepEqual(o.toJS(), {one: {subtwo: {$set: ['purple']}}});
      });
    });

    describe('Update API', function() {

      it('should be possible to set nested values.', function() {
        var o1 = Immutable.fromJS({hello: {world: 'one'}}),
            o2 = update(o1, {hello: {world: {$set: 'two'}}}).data;

        assert.deepEqual(o1.toJS(), {hello: {world: 'one'}});
        assert.deepEqual(o2.toJS(), {hello: {world: 'two'}});
      });

      it('should be possible to push to nested values.', function() {
        var o1 = Immutable.fromJS({colors: ['orange']}),
            o2 = update(o1, {colors: {$push: 'blue'}}).data;

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
        assert(data instanceof Immutable.Map);
        assertImmutable(data, state);
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = atom.get(['one', 'subtwo', 'colors']);
        assert(colors instanceof Immutable.List);
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

      it('should be possible to instantiate without the "new" keyword.', function() {
        var special = Atom(state);

        assert(Immutable.is(special.get('two'), atom.get('two')));
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

        assert(colors instanceof Immutable.List);
        assertImmutable(colors, state.colors);
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = oneCursor.get(['subtwo', 'colors']);

        assertImmutable(colors, state.colors);
      });

      it('should be possible to listen to updates.', function(done) {
        colorCursor.on('update', function() {
          assertImmutable(colorCursor.get(), ['blue', 'yellow', 'purple']);
          done();
        });

        colorCursor.push('purple');
      });
    });

    describe('Traversal', function() {
      var atom = new Atom(state);

      var colorCursor = atom.select(['one', 'subtwo', 'colors']),
          oneCursor = atom.select('one');

      it('should be possible to create subcursors.', function() {
        var sub = oneCursor.select(['subtwo', 'colors']);
        assertImmutable(sub.get(), state.colors)
      });

      it('should be possible to go up.', function() {
        var parent = colorCursor.up();
        assertImmutable(parent.get(), state.subtwo);
      });

      it('a cusor going up to root cannot go higher.', function() {
        var up = atom.select('one').up(),
            upper = up.up();

        assertImmutable(up.get(), atom.get());
        assertImmutable(upper.get(), up.get());
      });
    });

    describe('Events', function() {

      it('when a parent updates, so does the child.', function(done) {
        var atom = new Atom(state),
            parent = atom.select('two'),
            child = atom.select(['two', 'firstname']);

        var count = 0;

        async.parallel({
          parent: function(next) {
            parent.on('update', function() {
              assertImmutable({firstname: 'Napoleon', lastname: 'Bonaparte'}, this.get());
              count++;
              next();
            });
          },
          child: function(next) {
            child.on('update', function() {
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

      it('when a child updates, so does the parent.', function(done) {
        var atom = new Atom(state),
            parent = atom.select('two'),
            child = atom.select(['two', 'firstname']);

        var count = 0;

        async.parallel({
          parent: function(next) {
            parent.on('update', function() {
              count++;
              next();
            });
          },
          child: function(next) {
            child.on('update', function() {
              count++;
              next();
            });
          }
        }, function() {
          assert.strictEqual(count, 2);
          done();
        });

        child.set('Napoleon');
      });

      it('when a leave updates, it should not update its siblings.', function(done) {
        var atom = new Atom({
          node: {
            leaf1: 'hey',
            leaf2: 'ho'
          }
        });

        var parent = atom.select('node'),
            leaf1 = parent.select('leaf1'),
            leaf2 = parent.select('leaf2');

        var count = 0,
            handler = function() {count++;};

        async.parallel({
          node: function(next) {
            parent.on('update', handler);
            setTimeout(next, 30);
          },
          leaf1: function(next) {
            leaf1.on('update', handler);
            setTimeout(next, 30);
          },
          leaf2: function(next) {
            leaf2.on('update', handler);
            setTimeout(next, 30);
          }
        }, function() {
          assert.strictEqual(count, 2);
          done();
        });

        leaf1.set('tada');
      });

      it('should be possible to listen to the cursor\'s relevancy.', function(done) {
        var atom = new Atom({
          one: {
            two: 'hello'
          }
        });

        var cursor = atom.select(['one', 'two']);

        var irrelevant = false,
            relevant = false;

        cursor.on('irrelevant', function() {
          irrelevant = true;
        });

        cursor.on('relevant', function() {
          relevant = true;
          assert(relevant && irrelevant);
          done();
        });

        atom.set('one', {other: 'thing'});
        setTimeout(function() {
          atom.set('one', {two: 'hello'});
        }, 30);
      });
    });

    describe('Advanced', function() {
      it('should be possible to execute several orders within a synchronous stack.', function(done) {
        var atom = new Atom({
          one: 'coco',
          two: 'koko'
        });

        atom.set('one', 'cece');
        atom.set('two', 'keke');

        helpers.later(function() {
          assertImmutable(atom, {one: 'cece', two: 'keke'});
          done();
        });
      });
    });
  });
});
