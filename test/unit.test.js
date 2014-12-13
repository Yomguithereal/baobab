/**
 * Baobab Unit Tests
 * ==================
 *
 * Testing the library.
 */
var assert = require('assert'),
    Typology = require('typology'),
    Baobab = require('../src/baobab.js'),
    Cursor = require('../src/cursor.js'),
    async = require('async'),
    helpers = require('../src/helpers.js'),
    update = require('../src/update.js'),
    types = require('../src/typology.js'),
    clone = require('lodash.clonedeep');

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
  setLater: null,
  list: [[1, 2], [3, 4]]
};

// Tests
describe('Baobab', function() {

  describe('Helpers', function() {

    describe('Composition', function() {

      it('should be able to compose two simple functions.', function() {

        var inc = function(i) { return i + 1; },
          add2 = helpers.compose(inc, inc);

        assert.strictEqual(add2(1), 3);
      });
    });

    describe('Typology', function() {

      it('the immutable type should work.', function() {
        var baobab = new Baobab({hello: 'world'});
        assert(types.check(baobab, 'baobab'));
        assert(types.check(baobab.select('hello'), 'cursor'));
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
        var o1 = {hello: {world: 'one'}},
            o2 = clone(o1);
        update(o2, {hello: {world: {$set: 'two'}}});

        assert.deepEqual(o1, {hello: {world: 'one'}});
        assert.deepEqual(o2, {hello: {world: 'two'}});
      });

      it('should be possible to push to nested values.', function() {
        var o1 = {colors: ['orange']},
            o2 = clone(o1);
        update(o2, {colors: {$push: 'blue'}});

        assert.deepEqual(o1, {colors: ['orange']});
        assert.deepEqual(o2, {colors: ['orange', 'blue']});
      });

      it('should be possible to unshift to nested values.', function() {
        var o1 = {colors: ['orange']},
            o2 = clone(o1);
        update(o2, {colors: {$unshift: 'blue'}});

        assert.deepEqual(o1, {colors: ['orange']});
        assert.deepEqual(o2, {colors: ['blue', 'orange']});
      });

      it('should be possible to append to nested values.', function() {
        var o1 = {colors: ['orange']},
            o2 = clone(o1);
        update(o2, {colors: {$push: ['blue', 'purple']}});

        assert.deepEqual(o1, {colors: ['orange']});
        assert.deepEqual(o2, {colors: ['orange', 'blue', 'purple']});

        var o3 = {colors: ['orange']},
            o4 = clone(o1);
        update(o4, {colors: {$push: 'blue'}});

        assert.deepEqual(o3, {colors: ['orange']});
        assert.deepEqual(o4, {colors: ['orange', 'blue']});
      });

      it('should be possible to prepend to nested values.', function() {
        var o1 = {colors: ['orange']},
            o2 = clone(o1);
        update(o2, {colors: {$unshift: ['blue', 'purple']}});

        assert.deepEqual(o1, {colors: ['orange']});
        assert.deepEqual(o2, {colors: ['blue', 'purple', 'orange']});

        var o3 = {colors: ['orange']},
            o4 = clone(o1);
        update(o4, {colors: {$unshift: 'blue'}});

        assert.deepEqual(o3, {colors: ['orange']});
        assert.deepEqual(o4, {colors: ['blue', 'orange']});
      });

      it('should be possible to apply a function to nested values.', function() {
        var o1 = {number: 10},
            o2 = clone(o1);
        update(o2, {number: {$apply: function(n) { return n * 2; }}});

        assert.deepEqual(o1, {number: 10});
        assert.deepEqual(o2, {number: 20});
      });
    });
  });

  describe('Baobab API', function() {

    describe('Basics', function() {
      var baobab = new Baobab(state);

      it('should be possible to retrieve full data.', function() {
        var data = baobab.get();
        assert.deepEqual(data, state);
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = baobab.get(['one', 'subtwo', 'colors']);
        assert.deepEqual(colors, state.one.subtwo.colors);

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
          assert.deepEqual(e.data.log, [['one', 'subtwo', 'colors']]);
          done();
        });

        baobab.update({one: {subtwo: {colors: {$push: 'purple'}}}});
      });

      it('should be possible to instantiate without the "new" keyword.', function() {
        var special = Baobab(state);

        assert(special.get('two'), baobab.get('two'));
      });
    });

    describe('Options', function() {
      it('should be possible to commit changes immediately.', function() {
        var baobab = new Baobab({hello: 'world'}, {delay: false});
        baobab.set('hello', 'you');
        assert.strictEqual(baobab.get('hello'), 'you');
      });

      it('should be possible to let the user commit himself.', function(done) {
        var baobab = new Baobab({number: 1}, {autoCommit: false});
        baobab.set('number', 2);

        process.nextTick(function() {
          assert.strictEqual(baobab.get('number'), 1);
          baobab.commit();
          process.nextTick(function() {
            assert.strictEqual(baobab.get('number'), 2);
            done();
          });
        });
      });

      it('should be possible to serve cloned data.', function() {
        var baobab1 = new Baobab({hello: 'world'}),
            baobab2 = new Baobab({hello: 'world'}, {clone: true});

        assert(baobab1.get() === baobab1.data);
        assert(baobab1.clone() !== baobab1.data);
        assert.deepEqual(baobab1.clone(), baobab1.data);
        assert(baobab2.get() !== baobab2.data);
        assert(baobab2.reference() === baobab2.data);
        assert.deepEqual(baobab2.get(), {hello: 'world'});
      });

      it('should be possible to shunt the singleton cursors.', function() {
        var baobab1 = new Baobab({hello: 'world'}),
            baobab2 = new Baobab({hello: 'world'}, {cursorSingletons: false});

        assert(baobab1.select('hello') === baobab1.select('hello'));
        assert(baobab2.select('hello') !== baobab2.select('hello'));
      });

      it('should be possible to provide your own cloning function to the tree.', function() {
        var baobab = new Baobab({hello: 'world'}, {cloningFunction: clone});

        assert(baobab._cloner === clone);
        assert.deepEqual(baobab.clone(), baobab.data);
      });
    });

    describe('Custom typology', function() {

      it('a baobab should have an internal typology.', function() {
        var baobab = new Baobab({hello: 'world'});
        assert(baobab.typology instanceof Typology);
      });

      it('should be possible to pass a custom typology at instantiation.', function() {
        var typology = new Typology({user: '?object'}),
            baobab = new Baobab({hello: 'world'}, {typology: typology});

        assert(baobab.typology instanceof Typology);
        assert(baobab.typology.isValid('user'));
      });

      it('should be possible to pass an object defining custom types at instantiation.', function() {
        var definitions = {user: '?object'},
            baobab = new Baobab({hello: 'world'}, {typology: definitions});

        assert(baobab.typology instanceof Typology);
        assert(baobab.typology.isValid('user'));
      });

      it('invalid initial data should throw an error.', function() {

        assert.throws(function() {
          new Baobab(
            {hello: 'world'},
            {
              validate: {hello: 'word'},
              typology: {word: 'object'}
            }
          );
        }, /invalid data/);
      });

      it('should emit an "invalid" event when data validation fails on commit.', function(done) {
        var baobab = new Baobab({hello: 'world'}, {validate: {hello: 'string'}});

        baobab.on('invalid', function() {
          done();
        });
        baobab.set('hello', 42);
      });
    });

    describe('History', function() {

      it('should be possible to record passed states.', function(done) {
        var baobab = new Baobab({name: 'Maria'}, {maxHistory: 1});

        baobab.set('name', 'Estelle');

        process.nextTick(function() {
          assert(baobab.hasHistory());
          assert.deepEqual(baobab.getHistory(), [{log: [['name']], data: {name: 'Maria'}}]);
          done();
        });
      });

      it('should throw an error if trying to undo without history.', function() {
        var baobab = new Baobab({hello: 'world'});

        assert.throws(function() {
          baobab.undo();
        }, /no history/);
      });

      it('should be possible to go back in time.', function(done) {
        var baobab = new Baobab({name: 'Maria'}, {maxHistory: 2});

        async.series([
          function(next) {
            baobab.set('name', 'Estelle');
            process.nextTick(next);
          },
          function(next) {
            assert(baobab.hasHistory());
            baobab.undo();
            assert.deepEqual(baobab.get(), {name: 'Maria'});
            done();
          }
        ], function() {
          done();
        });
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

        assert(colors instanceof Array);
        assert.deepEqual(colors, state.one.subtwo.colors);
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = oneCursor.get(['subtwo', 'colors']);

        assert.deepEqual(colors, state.one.subtwo.colors);
      });

      it('should be possible to use some polymorphism on the selection.', function() {
        var altCursor = baobab.select('one', 'subtwo', 'colors');

        assert.deepEqual(altCursor.get(), colorCursor.get());
      });

      it('should be possible to use some polymorphism on the getter.', function() {
        var altCursor = baobab.select('one');

        assert.deepEqual(altCursor.get('subtwo', 'colors'), state.one.subtwo.colors);
      });

      it('should be possible to listen to updates.', function(done) {
        colorCursor.on('update', function() {
          assert.deepEqual(colorCursor.get(), ['blue', 'yellow', 'purple']);
          done();
        });

        colorCursor.push('purple');
      });
    });

    describe('Traversal', function() {
      var baobab = new Baobab(state);

      var colorCursor = baobab.select(['one', 'subtwo', 'colors']),
          oneCursor = baobab.select('one');

      it('should be possible to create subcursors.', function() {
        var sub = oneCursor.select(['subtwo', 'colors']);
        assert.deepEqual(sub.get(), state.one.subtwo.colors);
      });

      it('should be possible to go up.', function() {
        var parent = colorCursor.up();
        assert.deepEqual(parent.get(), state.one.subtwo);
      });

      it('a cusor going up to root cannot go higher.', function() {
        var up = baobab.select('one').up(),
            upper = up.up();

        assert.deepEqual(up.get(), baobab.get());
        assert.deepEqual(upper.get(), up.get());
      });

      it('should be possible to go left.', function() {
        var left = colorCursor.select(1).left();

        assert.strictEqual(left.get(), 'blue');
        assert.strictEqual(left.up().select(0).left().get(), undefined);

        assert.throws(function() {
          colorCursor.left();
        }, /left/);
      });

      it('should be possible to go right.', function() {
        var left = colorCursor.select(0).right();

        assert.strictEqual(left.get(), 'yellow');
        assert.strictEqual(left.up().select(1).right().get(), undefined);

        assert.throws(function() {
          colorCursor.right();
        }, /right/);
      });

      it('should be possible to descend.', function() {
        var list = baobab.select('list');

        assert.deepEqual(list.down().get(), [1, 2]);
        assert.strictEqual(colorCursor.down().get(), 'blue');
        assert.strictEqual(colorCursor.down().up().up().select('colors').down().get(), 'blue');
        assert.strictEqual(list.down().right().down().right().get(), 4);

        assert.throws(function() {
          oneCursor.down();
        }, /descend/);
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
              assert.deepEqual({firstname: 'Napoleon', lastname: 'Bonaparte'}, this.get());
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
          assert.deepEqual(baobab.get(), {one: 'cece', two: 'keke'});
          done();
        });
      });

      it('should be possible to merge push-like specifications.', function(done) {
        var baobab = new Baobab({list: [1]}),
            cursor = baobab.select('list');

        cursor.push(2).push(3).unshift([-1, 0]).unshift(-2);

        helpers.later(function() {
          assert.deepEqual(cursor.get(), [-2, -1, 0, 1, 2, 3]);
          done();
        });
      });

      it('should be possible to push several values through polymorphism.', function(done) {
        var baobab = new Baobab({colors: ['blue']}),
            colorCursor = baobab.select('colors');

        colorCursor.push('yellow', 'green');

        process.nextTick(function() {
          assert.deepEqual(colorCursor.get(), ['blue', 'yellow', 'green']);
          done();
        });
      });

      it('an upper set should correctly resolve.', function(done) {
        var baobab = new Baobab({hello: {color: 'blue'}});

        baobab.select('hello', 'color').set('yellow');
        baobab.set('hello', 'purple');

        baobab.on('update', function() {
          assert.deepEqual(baobab.get(), {hello: 'purple'});
          done();
        });
      });

      it('a $set/$apply conflict should correctly resolve.', function(done) {
        var baobab = new Baobab({number: 1});

        baobab.set('number', 2);
        baobab.update({number: {$apply: function(d) { return d + 2; }}});

        baobab.on('update', function() {
          assert.strictEqual(baobab.get('number'), 3);
          done();
        });
      });

      it('should be possible to chain mutations.', function(done) {
        var baobab = new Baobab({number: 1}),
            inc = function(i) { return i + 1; };

        baobab.update({number: {$chain: inc}});
        baobab.update({number: {$chain: inc}});

        baobab.on('update', function() {
          assert.strictEqual(baobab.get('number'), 3);
          done();
        });
      });
    });
  });
});
