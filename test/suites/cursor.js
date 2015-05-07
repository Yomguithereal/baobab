/**
 * Baobab Cursors Unit Tests
 * ==========================
 */
var assert = require('assert'),
    state = require('../state.js'),
    helpers = require('../../src/helpers.js'),
    Baobab = require('../../src/baobab.js'),
    async = require('async');

describe('Cursor API', function() {

  describe('Getters', function() {
    var baobab = new Baobab(state);

    describe('Root cursor', function() {
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

      it('should be possible to retrieve items with a function in path.', function() {
        var yellow = baobab.get('one', 'subtwo', 'colors', function(i) { return i === 'yellow'; });

        assert.strictEqual(yellow, 'yellow');
      });

      it('should be possible to retrieve items with a descriptor object.', function() {
        var firstItem = baobab.get('items', {id: 'one'}),
            secondItem = baobab.get('items', {id: 'two', user: {name: 'John'}}),
            thirdItem = baobab.get('items', {id: ['one', 'two']});

        assert.deepEqual(firstItem, {id: 'one'});
        assert.deepEqual(secondItem, {id: 'two', user: {name: 'John', surname: 'Talbot'}});
        assert.deepEqual(firstItem, {id: 'one'});
      });

      it('should not fail when retrieved data is null on the path.', function() {
        var nullValue = baobab.get('setLater');
        assert.strictEqual(nullValue, null);

        var inexistant = baobab.get('setLater', 'a');
        assert.strictEqual(inexistant, undefined);
      });

      it('should be able to resolve a cursor pointer.', function() {
        var color = baobab.get('one', 'subtwo', 'colors', {$cursor: ['pointer']});

        assert.strictEqual(color, 'yellow');
      });

      it('should fail when providing a wrong path to the $cursor command.', function() {
        assert.throws(function() {
          var color = baobab.get('one', 'subtwo', 'colors', {$cursor: null});
        }, /\$cursor/);
      });
    });

    describe('Standard cursors', function() {
      var colorCursor = baobab.select(['one', 'subtwo', 'colors']),
          oneCursor = baobab.select('one');

      it('should be possible to retrieve data at cursor.', function() {
        var colors = colorCursor.get();

        assert(colors instanceof Array);
        assert.deepEqual(colors, state.one.subtwo.colors);
      });

      it('should be possible to retrieve data with a 0 key.', function() {
        var sub = new Baobab([1, 2]);
        assert.strictEqual(sub.get(0), 1);
        assert.strictEqual(colorCursor.get(0), 'blue');
      });

      it('should be possible to retrieve nested data.', function() {
        var colors = oneCursor.get(['subtwo', 'colors']);

        assert.deepEqual(colors, state.one.subtwo.colors);
      });

      it('should be possible to use some polymorphism on the getter.', function() {
        var altCursor = baobab.select('one');

        assert.deepEqual(altCursor.get('subtwo', 'colors'), state.one.subtwo.colors);
      });
    });
  });

  describe('Setters', function() {

    describe('Root cursor', function() {
      it('should be possible to set a key using a path rather than a key.', function() {
        var baobab = new Baobab(state, {asynchronous: false});

        baobab.set(['two', 'age'], 34);
        assert.strictEqual(baobab.get().two.age, 34);
      });

      it('should be possible to set a key at an nonexistent path.', function() {
        var baobab = new Baobab(state, {asynchronous: false});

        baobab.set(['nonexistent', 'key'], 'hello');
        assert.strictEqual(baobab.get().nonexistent.key, 'hello');
      });

      it('should be possible to set a key using a dynamic path.', function() {
        var baobab = new Baobab(state, {asynchronous: false});

        baobab.set(['items', {id: 'two'}, 'user', 'age'], 34);
        assert.strictEqual(baobab.get().items[1].user.age, 34);
      });

      it('should fail when setting a nonexistent dynamic path.', function() {
        var baobab = new Baobab(state, {asynchronous: false});

        assert.throws(function() {
          baobab.set(['items', {id: 'four'}, 'user', 'age'], 34);
        }, /solve/);
      });
    });

    describe('Standard cursors', function() {
      it('should warn the user when too many arguments are applied to a setter.', function() {
        var baobab = new Baobab(state),
            cursor = baobab.select('items');

        assert.throws(function() {
          cursor.set('this', 'is', 'my', 'destiny!');
        }, /too many/);
      });

      it('should throw an error when the provided path is incorrect.', function() {
        var baobab = new Baobab(state),
            cursor = baobab.select('items');

        assert.throws(function() {
          cursor.set(null, '45');
        }, /invalid path/);
      });

      it('should be possible to set a key using a path rather than a key.', function() {
        var baobab = new Baobab(state, {asynchronous: false}),
            cursor = baobab.select('items');

        cursor.set([1, 'user', 'age'], 34);
        assert.strictEqual(cursor.get()[1].user.age, 34);
      });

      it('should be possible to set a key at an nonexistent path.', function() {
        var baobab = new Baobab(state, {asynchronous: false}),
            cursor = baobab.select('two');

        cursor.set(['nonexistent', 'key'], 'hello');
        assert.strictEqual(cursor.get().nonexistent.key, 'hello');
      });

      it('should be possible to set a key using a dynamic path.', function() {
        var baobab = new Baobab(state, {asynchronous: false}),
            cursor = baobab.select('items');

        cursor.set([{id: 'two'}, 'user', 'age'], 34);
        assert.strictEqual(cursor.get()[1].user.age, 34);
      });

      it('should fail when setting a nonexistent dynamic path.', function() {
        var baobab = new Baobab(state, {asynchronous: false}),
            cursor = baobab.select('items');

        assert.throws(function() {
          cursor.set([{id: 'four'}, 'user', 'age'], 34);
        }, /solve/);
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

      it('a single $chain command should work like an $apply.', function() {
        var baobab = new Baobab({number: 1}, {asynchronous: false}),
            cursor = baobab.select('number'),
            inc = function(i) { return i + 1; };

        assert.strictEqual(cursor.get(), 1);
        cursor.chain(inc);
        assert.strictEqual(cursor.get(), 2);
      });

      it('should be possible to shallow merge two objects.', function(done) {
        var baobab = new Baobab({o: {hello: 'world'}, string: 'test'});

        var cursor = baobab.select('o');
        cursor.merge({hello: 'jarl'});

        baobab.on('update', function() {
          assert.deepEqual(baobab.get('o'), {hello: 'jarl'});
          done();
        });
      });

      it('should be possible to remove keys from a cursor.', function() {
        var tree = new Baobab({one: 1, two: {subone: 1, subtwo: 2}}, {asynchronous: false}),
            cursor = tree.select('two');

        assert.deepEqual(cursor.get(), {subone: 1, subtwo: 2});
        cursor.unset('subone');
        assert.deepEqual(cursor.get(), {subtwo: 2});
      });

      it('should be possible to remove data at cursor.', function() {
        var tree = new Baobab({one: 1, two: {subone: 1, subtwo: 2}}, {asynchronous: false}),
            cursor = tree.select('two');

        assert.deepEqual(cursor.get(), {subone: 1, subtwo: 2});
        cursor.unset();
        assert.strictEqual(cursor.get(), undefined);
      });

      it('should be possible to splice an array.', function() {
        var tree1 = new Baobab({list: [1, 2, 3]}, {asynchronous: false}),
            tree2 = new Baobab(tree1.get(), {asynchronous: false}),
            cursor1 = tree1.select('list'),
            cursor2 = tree2.select('list');

        assert.deepEqual(cursor1.get(), [1, 2, 3]);

        cursor1.splice([[0, 1], [1, 1, 4]]);
        cursor2.splice([0, 1]);
        cursor2.splice([1, 1, 4]);

        assert.deepEqual(cursor1.get(), [2, 4]);
        assert.deepEqual(cursor1.get(), cursor2.get());
      });

      it('should be possible to set a falsy value.', function() {
        var tree = new Baobab({hello: 'world'}, {asynchronous: false});

        tree.set('hello', '');

        assert.strictEqual(tree.get('hello'), '');

        tree.set('hello', false);

        assert.strictEqual(tree.get('hello'), false);
      });

      it('should throw errors when updating with wrong values.', function() {
        var cursor = (new Baobab()).root;

        assert.throws(function() {
          cursor.merge('John');
        }, /value/);

        assert.throws(function() {
          cursor.splice('John');
        });

        assert.throws(function() {
          cursor.apply('John');
        });

        assert.throws(function() {
          cursor.chain('John');
        });
      });
    });
  });

  describe('Events', function() {
    var baobab = new Baobab(state);

    it('should be possible to listen to updates.', function(done) {
      var colorCursor = baobab.select('one', 'subtwo', 'colors');

      colorCursor.on('update', function() {
        assert.deepEqual(colorCursor.get(), ['blue', 'yellow', 'purple']);
        done();
      });

      colorCursor.push('purple');
    });

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

    it('should be possible to listen to changes in an array.', function(done) {
      var baobab = new Baobab({list: ['hello', 'world']}),
          cursor = baobab.select('list', 1);

      assert.strictEqual(cursor.get(), 'world');

      cursor.on('update', function() {
        assert.strictEqual(cursor.get(), 'jacky');
        done();
      });

      cursor.set('jacky');
    });

    it('should fire update correctly even when root node is affected.', function(done) {
      var baobab = new Baobab({first: 1, second: 2});

      baobab.select('first').on('update', function() {
        assert.deepEqual(
          baobab.get(),
          {first: 1.1, second: 2.2}
        );

        done();
      });

      baobab.root.set({first: 1.1, second: 2.2});
    });

    it('should be possible to listen to new selections.', function(done) {
      var baobab = new Baobab({one: {two: 'hello'}}),
          cursor = baobab.select('one');

      cursor.on('select', function(e) {
        assert.deepEqual(e.data.path, ['two']);
        assert.strictEqual(e.data.cursor.get(), 'hello');
        done();
      });

      baobab.select('one', 'two');
    });

    it('should be possible to listen to get events.', function(done) {
      var baobab = new Baobab({one: {two: 'hello'}}),
          cursor = baobab.select('one');

      cursor.on('get', function(e) {
        assert.deepEqual(e.data.path, ['two']);
        assert.strictEqual(e.data.data, 'hello');
        done();
      });

      baobab.get('one', 'two');
    });
  });

  describe('Predicates', function() {
    var baobab = new Baobab(state);

    it('should be possible to tell whether cursor is root.', function() {
      assert(baobab.select('one').up().isRoot());
      assert(!baobab.select('one').isRoot());
    });

    it('should be possible to tell whether cursor is leaf.', function() {
      assert(baobab.select('primitive').isLeaf());
      assert(!baobab.select('one').isLeaf());
    });

    it('should be possible to tell whether cursor is branch.', function() {
      assert(baobab.select('one').isBranch());
      assert(!baobab.select('one').up().isBranch());
      assert(!baobab.select('primitive').isBranch());
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

    it('a cusor going up to root cannot go higher and returns null.', function() {
      var up = baobab.select('one').up(),
          upper = up.up();

      assert.strictEqual(upper, null);
    });

    it('should be possible to go left.', function() {
      var left = colorCursor.select(1).left();

      assert.strictEqual(left.get(), 'blue');
      assert.strictEqual(left.left(), null);

      assert.throws(function() {
        colorCursor.left();
      }, /left/);
    });

    it('should be possible to go right.', function() {
      var right = colorCursor.select(0).right();

      assert.strictEqual(right.get(), 'yellow');
      assert.strictEqual(right.right(), null);

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
      assert.strictEqual(oneCursor.down(), null);
    });

    it('should be possible to get to the leftmost item of a list.', function() {
      var listItem = baobab.select('longList', 2);

      assert.strictEqual(listItem.get(), 3);
      assert.strictEqual(listItem.leftmost().get(), 1);
    });

    it('should be possible to get to the rightmost item of a list.', function() {
      var listItem = baobab.select('longList', 2);

      assert.strictEqual(listItem.get(), 3);
      assert.strictEqual(listItem.rightmost().get(), 4);
    });

    it('should be possible to map an array.', function() {
      var count = 0;

      var array = colorCursor.map(function(cursor, i) {
        assert(this === colorCursor);
        assert(count++ === i);

        return cursor;
      });

      assert.deepEqual(
        array.map(function(cursor) {
          return cursor.get();
        }),
        state.one.subtwo.colors
      );

      var scope = {hello: 'world'};
      colorCursor.map(function(cursor, i) {
        assert(this === scope);
      }, scope);

      assert.throws(function() {
        oneCursor.map(Function.prototype);
      }, /non-list/);
    });
  });

  describe('History', function() {

    it('should be possible to record updates.', function() {
      var baobab = new Baobab({item: 1}, {asynchronous: false}),
          cursor = baobab.select('item');

      assert(!cursor.recording);
      assert(!cursor.hasHistory());
      assert.deepEqual(cursor.getHistory(), []);

      cursor.startRecording();

      assert(cursor.recording);

      [1, 2, 3, 4, 5, 6].forEach(function() {
        cursor.apply(function(e) { return e + 1; });
      });

      assert(cursor.hasHistory());
      assert.strictEqual(cursor.get(), 7);
      assert.deepEqual(cursor.getHistory(), [2, 3, 4, 5, 6].reverse());

      cursor.stopRecording();
      cursor.clearHistory();

      assert(!cursor.recording);
      assert(!cursor.hasHistory());
      assert.deepEqual(cursor.getHistory(), []);
    });

    it('should throw an error if trying to undo a recordless cursor.', function() {
      var baobab = new Baobab({item: 1}, {asynchronous: false}),
          cursor = baobab.select('item');

      assert.throws(function() {
        cursor.undo();
      }, /recording/);
    });

    it('should be possible to go back in time.', function() {
      var baobab = new Baobab({item: 1}, {asynchronous: false}),
          cursor = baobab.select('item');

      cursor.startRecording();

      [1, 2, 3, 4, 5, 6].forEach(function() {
        cursor.apply(function(e) { return e + 1; });
      });

      assert.strictEqual(cursor.get(), 7);

      cursor.undo();
      assert.strictEqual(cursor.get(), 6);
      assert.deepEqual(cursor.getHistory(), [2, 3, 4, 5].reverse());

      cursor.undo().undo();

      assert.strictEqual(cursor.get(), 4);
      assert.deepEqual(cursor.getHistory(), [2, 3].reverse());

      cursor.set(4).set(5);

      cursor.undo(3);

      assert.strictEqual(cursor.get(), 3);
      assert.deepEqual(cursor.getHistory(), [2]);

      assert.throws(function() {
        cursor.undo(5);
      }, /relevant/);

      assert.throws(function() {
        cursor.undo(-5);
      }, /positive/);
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

      setTimeout(function() {
        assert.deepEqual(baobab.get(), {one: 'cece', two: 'keke'});
        done();
      }, 0);
    });

    it('should be possible to merge push-like specifications.', function(done) {
      var baobab = new Baobab({list: [1]}),
          cursor = baobab.select('list');

      cursor.push(2).push(3).unshift([-1, 0]).unshift(-2);

      setTimeout(function() {
        assert.deepEqual(cursor.get(), [-2, -1, 0, 1, 2, 3]);
        done();
      }, 0);
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

    it('should be possible to set a nested key on a primitive path.', function() {
      var baobab = new Baobab({
        hello: 42
      }, {asynchronous: false});

      baobab.set(['hello', 'cowabunga'], 43);

      assert.deepEqual(baobab.get(), {
        hello: {
          cowabunga: 43
        }
      });
    });
  });
});
