/**
 * Baobab Unit Tests
 * ==================
 *
 * Testing the library.
 */
var assert = require('assert'),
    Immutable = require('immutable'),
    Baobab = require('../src/baobab.js'),
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

    describe('Nested get', function() {
      it('should be possible to retrieve nested items through the helper.', function() {
        assert.deepEqual(helpers.getIn(state, ['one', 'subtwo', 'colors']), state.one.subtwo.colors);
        assert.strictEqual(helpers.getIn(state, ['primitive']), 3);
        assert.deepEqual(helpers.getIn(state), state);
        assert.strictEqual(helpers.getIn(state, ['one', 'subtwo', 'colors', 1]), 'yellow');
        assert.strictEqual(helpers.getIn(state, ['one', 'subtwo', 'colors', '1']), 'yellow');
        assert.strictEqual(helpers.getIn(state, ['inexistant', 'path']), undefined);
      });
    });

    describe('Object path', function() {

      it('should be possible to retrieve path objects.', function() {
        var o = helpers.pathObject(['one', 'subtwo'], {$set: ['purple']});
        assert.deepEqual(o, {one: {subtwo: {$set: ['purple']}}});
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

      it('should be possible to unshift to nested values.', function() {
        var o1 = Immutable.fromJS({colors: ['orange']}),
            o2 = update(o1, {colors: {$unshift: 'blue'}}).data;

        assert.deepEqual(o1.toJS(), {colors: ['orange']});
        assert.deepEqual(o2.toJS(), {colors: ['blue', 'orange']});
      });

      it('should be possible to append to nested values.', function() {
        var o1 = Immutable.fromJS({colors: ['orange']}),
            o2 = update(o1, {colors: {$push: ['blue', 'purple']}}).data;

        assert.deepEqual(o1.toJS(), {colors: ['orange']});
        assert.deepEqual(o2.toJS(), {colors: ['orange', 'blue', 'purple']});

        var o3 = Immutable.fromJS({colors: ['orange']}),
            o4 = update(o1, {colors: {$push: 'blue'}}).data;

        assert.deepEqual(o3.toJS(), {colors: ['orange']});
        assert.deepEqual(o4.toJS(), {colors: ['orange', 'blue']});
      });

      it('should be possible to prepend to nested values.', function() {
        var o1 = Immutable.fromJS({colors: ['orange']}),
            o2 = update(o1, {colors: {$unshift: ['blue', 'purple']}}).data;

        assert.deepEqual(o1.toJS(), {colors: ['orange']});
        assert.deepEqual(o2.toJS(), {colors: ['blue', 'purple', 'orange']});

        var o3 = Immutable.fromJS({colors: ['orange']}),
            o4 = update(o1, {colors: {$unshift: 'blue'}}).data;

        assert.deepEqual(o3.toJS(), {colors: ['orange']});
        assert.deepEqual(o4.toJS(), {colors: ['blue', 'orange']});
      });

      it('should be possible to apply a function to nested values.', function() {
        var o1 = Immutable.fromJS({number: 10}),
            o2 = update(o1, {number: {$apply: function(n) { return n * 2; }}}).data;

        assert.deepEqual(o1.toJS(), {number: 10});
        assert.deepEqual(o2.toJS(), {number: 20});
      });
    });
  });

  describe('Baobab API', function() {

    describe('Basics', function() {
      var baobab = new Baobab(state);

      it('should be possible to retrieve full data.', function() {
        var data = baobab.get();
        assert(data instanceof Immutable.Map);
        assertImmutable(data, state);
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = baobab.get(['one', 'subtwo', 'colors']);
        assert(colors instanceof Immutable.List);
        assertImmutable(colors, state.colors);

        // Polymorphism
        var primitive = baobab.get('primitive');
        assert.strictEqual(primitive, 3);
      });

      it('should be possible to get data from both maps and lists.', function() {
        var yellow = baobab.get(['one', 'subtwo', 'colors', 1]);

        assert.strictEqual(yellow, 'yellow');
      });

      it('should return undefined when data is not to be found through path.', function() {
        var inexistant = baobab.get(['no']);
        assert.strictEqual(inexistant, undefined);

        // Nesting
        var nestedInexistant = baobab.get(['no', 'no']);
        assert.strictEqual(nestedInexistant, undefined);
      });

      it('should throw an error when trying to instantiate an baobab with incorrect data.', function() {
        assert.throws(function() {
          new Baobab(undefined);
        }, /invalid data/);
      });

      it('selecting data in the baobab should return a cursor.', function() {
        assert(baobab.select(['one']) instanceof Cursor);
      });

      it('should be possible to listen to update events.', function(done) {
        baobab.on('update', function(e) {
          var oldData = e.data.oldData,
              newData = e.data.newData,
              c = ['on', 'subtwo', 'colors'];

          assertImmutable(oldData.getIn(c), ['blue', 'yellow']);
          assertImmutable(newData.getIn(c), ['blue', 'yellow', 'purple']);
          done();
        });

        baobab.update({one: {subtwo: {colors: {$push: 'purple'}}}});
      });

      it('should be possible to instantiate without the "new" keyword.', function() {
        var special = Baobab(state);

        assert(Immutable.is(special.get('two'), baobab.get('two')));
      });
    });

    describe('Options', function() {
      it('should be possible to commit changes immediately.', function() {
        var baobab = new Baobab({hello: 'world'}, {delay: false});
        baobab.set('hello', 'you');
        assert.strictEqual(baobab.get('hello'), 'you');
      });

      it('should be possible to get data as raw JavaScript.', function() {
        var baobab = new Baobab({hello: 'world'}, {toJS: true});
        assert(types.check(baobab.get(), 'object'));
      });
    });
  });

  describe('Cursor API', function() {

    describe('Basics', function() {
      var baobab = new Baobab(state);

      var colorCursor = baobab.select(['one', 'subtwo', 'colors']),
          oneCursor = baobab.select('one');

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

      it('should be possible to use some polymorphism on the selection.', function() {
        var altCursor = baobab.select('one', 'subtwo', 'colors');

        assertImmutable(altCursor.get(), colorCursor.get());
      });

      it('should be possible to use some polymorphism on the getter.', function() {
        var altCursor = baobab.select('one');

        assertImmutable(altCursor.get('subtwo', 'colors'), state.colors);
      });
    });

    describe('Traversal', function() {
      var baobab = new Baobab(state);

      var colorCursor = baobab.select(['one', 'subtwo', 'colors']),
          oneCursor = baobab.select('one');

      it('should be possible to create subcursors.', function() {
        var sub = oneCursor.select(['subtwo', 'colors']);
        assertImmutable(sub.get(), state.colors);
      });

      it('should be possible to go up.', function() {
        var parent = colorCursor.up();
        assertImmutable(parent.get(), state.subtwo);
      });

      it('a cusor going up to root cannot go higher.', function() {
        var up = baobab.select('one').up(),
            upper = up.up();

        assertImmutable(up.get(), baobab.get());
        assertImmutable(upper.get(), up.get());
      });
    });

    describe('Events', function() {

      it('when a parent updates, so does the child.', function(done) {
        var baobab = new Baobab(state),
            parent = baobab.select('two'),
            child = baobab.select(['two', 'firstname']);

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
        var baobab = new Baobab(state),
            parent = baobab.select('two'),
            child = baobab.select(['two', 'firstname']);

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
        var baobab = new Baobab({
          node: {
            leaf1: 'hey',
            leaf2: 'ho'
          }
        });

        var parent = baobab.select('node'),
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
        var baobab = new Baobab({
          one: {
            two: 'hello'
          }
        });

        var cursor = baobab.select(['one', 'two']);

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

        baobab.set('one', {other: 'thing'});
        setTimeout(function() {
          baobab.set('one', {two: 'hello'});
        }, 30);
      });
    });

    describe('Advanced', function() {
      it('should be possible to execute several orders within a single stack.', function(done) {
        var baobab = new Baobab({
          one: 'coco',
          two: 'koko'
        });

        baobab.set('one', 'cece');
        baobab.set('two', 'keke');

        helpers.later(function() {
          assertImmutable(baobab, {one: 'cece', two: 'keke'});
          done();
        });
      });

      it('should be possible to merge push-like specifications.', function(done) {
        var baobab = new Baobab({list: [1]});
            cursor = baobab.select('list');

        cursor.push(2).push(3).unshift([-1, 0]).unshift(-2);

        helpers.later(function() {
          assert.deepEqual(cursor.get().toJS(), [-2, -1, 0, 1, 2, 3]);
          done();
        });
      });
    });
  });
});
