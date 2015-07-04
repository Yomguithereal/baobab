/**
 * Baobab Core Unit Tests
 * =======================
 */
import assert from 'assert';
import async from 'async';
import Baobab from '../../src/baobab';
import Cursor from '../../src/cursor';
import state from '../state';

describe('Cursor API', function() {

  /**
   * Getters
   */
  describe('Getters', function() {

    /**
     * Root level
     */
    describe('Root cursor', function() {
      const tree = new Baobab(state);

      it('should be possible to retrieve full data.', function() {
        assert.deepEqual(tree.get(), state);
      });

      it('should be possible to retrieve nested data.', function() {
        const colors = tree.get(['one', 'subtwo', 'colors']);
        assert.deepEqual(colors, state.one.subtwo.colors);

        // Polymorphism
        const primitive = tree.get('primitive');
        assert.strictEqual(primitive, 3);
      });

      it('should be possible to get data from both maps and lists.', function() {
        const yellow = tree.get(['one', 'subtwo', 'colors', 1]);

        assert.strictEqual(yellow, 'yellow');
      });

      it('should return undefined when data is not to be found through path.', function() {
        const inexistant = tree.get(['no']);
        assert.strictEqual(inexistant, undefined);

        // Nesting
        const nestedInexistant = tree.get(['no', 'no']);
        assert.strictEqual(nestedInexistant, undefined);
      });

      it('should be possible to retrieve items using a function in path.', function() {
        const yellow = tree.get('one', 'subtwo', 'colors', i => i === 'yellow');

        assert.strictEqual(yellow, 'yellow');
      });

      it('should be possible to retrieve items with a descriptor object.', function() {
        const firstItem = tree.get('items', {id: 'one'}),
              secondItem = tree.get('items', {id: 'two', user: {name: 'John'}}),
              thirdItem = tree.get('items', {id: ['one', 'two']});

        assert.deepEqual(firstItem, {id: 'one'});
        assert.deepEqual(secondItem, {id: 'two', user: {name: 'John', surname: 'Talbot'}});
        assert.deepEqual(firstItem, {id: 'one'});
      });

      it('should not fail when retrieved data is null on the path.', function() {
        const nullValue = tree.get('setLater');
        assert.strictEqual(nullValue, null);

        const inexistant = tree.get('setLater', 'a');
        assert.strictEqual(inexistant, undefined);
      });
    });

    /**
     * Branch & leaf level
     */
    describe('Standard cursors', function() {
      const tree = new Baobab(state),
            colorCursor = tree.select(['one', 'subtwo', 'colors']),
            oneCursor = tree.select('one');

      it('should be possible to retrieve data at cursor.', function() {
        const colors = colorCursor.get();

        assert(colors instanceof Array);
        assert.deepEqual(colors, state.one.subtwo.colors);
      });

      it('should be possible to retrieve data with a 0 key.', function() {
        const specificTree = new Baobab([1, 2]);
        assert.strictEqual(specificTree.get(0), 1);
        assert.strictEqual(colorCursor.get(0), 'blue');
      });

      it('should be possible to retrieve nested data.', function() {
        const colors = oneCursor.get(['subtwo', 'colors']);

        assert.deepEqual(colors, state.one.subtwo.colors);
      });

      it('should be possible to use some polymorphism on the getter.', function() {
        const colors = oneCursor.get('subtwo', 'colors');

        assert.deepEqual(colors, state.one.subtwo.colors);
      });
    });
  });

  /**
   * Setters
   */
  describe('Setters', function() {

    /**
     * Root level
     */
    describe('Root cursor', function() {
      it('should be possible to set a key using a path rather than a key.', function() {
        const tree = new Baobab(state, {asynchronous: false});

        tree.set(['two', 'age'], 34);
        assert.strictEqual(tree.get().two.age, 34);
      });

      it('should be possible to set a key at an nonexistent path.', function() {
        const tree = new Baobab(state, {asynchronous: false});

        tree.set(['nonexistent', 'key'], 'hello');
        assert.strictEqual(tree.get().nonexistent.key, 'hello');
      });

      it('should be possible to set a key using a dynamic path.', function() {
        const tree = new Baobab(state, {asynchronous: false});

        tree.set(['items', {id: 'two'}, 'user', 'age'], 34);
        assert.strictEqual(tree.get().items[1].user.age, 34);
      });

      it('should fail when setting a nonexistent dynamic path.', function() {
        const tree = new Baobab(state, {asynchronous: false});

        assert.throws(function() {
          tree.set(['items', {id: 'four'}, 'user', 'age'], 34);
        }, /solve/);
      });
    });

    /**
     * Branch & leaf level
     */
    describe('Standard cursor', function() {
      it('should warn the user when too many arguments are applied to a setter.', function() {
        const tree = new Baobab(state),
            cursor = tree.select('items');

        assert.throws(function() {
          cursor.set('this', 'is', 'my', 'destiny!');
        }, /too many/);
      });

      it('should throw an error when the provided path is incorrect.', function() {
        const tree = new Baobab(state),
            cursor = tree.select('items');

        assert.throws(function() {
          cursor.set(/test/, '45');
        }, /invalid path/);
      });

      it('should be possible to set a key using a path rather than a key.', function() {
        const tree = new Baobab(state, {asynchronous: false}),
              cursor = tree.select('items');

        cursor.set([1, 'user', 'age'], 34);
        assert.strictEqual(cursor.get()[1].user.age, 34);
      });

      it('should be possible to set a key at an nonexistent path.', function() {
        const tree = new Baobab(state, {asynchronous: false}),
              cursor = tree.select('two');

        cursor.set(['nonexistent', 'key'], 'hello');
        assert.strictEqual(cursor.get().nonexistent.key, 'hello');
      });

      it('should be possible to set a key using a dynamic path.', function() {
        const tree = new Baobab(state, {asynchronous: false}),
              cursor = tree.select('items');

        cursor.set([{id: 'two'}, 'user', 'age'], 34);
        assert.strictEqual(cursor.get()[1].user.age, 34);
      });

      it('should fail when setting a nonexistent dynamic path.', function() {
        const tree = new Baobab(state, {asynchronous: false}),
              cursor = tree.select('items');

        assert.throws(function() {
          cursor.set([{id: 'four'}, 'user', 'age'], 34);
        }, /solve/);
      });

      it('should be possible to shallow merge two objects.', function(done) {
        const tree = new Baobab({o: {hello: 'world'}, string: 'test'});

        const cursor = tree.select('o');
        cursor.merge({hello: 'jarl'});

        tree.on('update', function() {
          assert.deepEqual(tree.get('o'), {hello: 'jarl'});
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
        const tree = new Baobab({one: 1, two: {subone: 1, subtwo: 2}}, {asynchronous: false}),
              cursor = tree.select('two');

        assert.deepEqual(cursor.get(), {subone: 1, subtwo: 2});
        cursor.unset();
        assert.strictEqual(cursor.get(), undefined);
      });

      it('should be possible to splice an array.', function() {
        const tree = new Baobab({list: [1, 2, 3]}, {asynchronous: false}),
              cursor = tree.select('list');

        assert.deepEqual(cursor.get(), [1, 2, 3]);

        cursor.splice([0, 1]);
        cursor.splice([1, 1, 4])

        assert.deepEqual(cursor.get(), [2, 4]);
      });

      it('should be possible to set a falsy value.', function() {
        const tree = new Baobab({hello: 'world'}, {asynchronous: false});

        tree.set('hello', '');

        assert.strictEqual(tree.get('hello'), '');

        tree.set('hello', false);

        assert.strictEqual(tree.get('hello'), false);
      });

      it('should throw errors when updating with wrong values.', function() {
        const cursor = (new Baobab()).root;

        assert.throws(function() {
          cursor.merge('John');
        }, /value/);

        assert.throws(function() {
          cursor.splice('John');
        });

        assert.throws(function() {
          cursor.apply('John');
        });
      });
    });
  });

  /**
   * Events
   */
  describe('Events', function() {

    it('should be possible to listen to updates.', function(done) {
      const tree = new Baobab(state),
            colorCursor = tree.select('one', 'subtwo', 'colors');

      colorCursor.on('update', function() {
        assert.deepEqual(colorCursor.get(), ['blue', 'yellow', 'purple']);
        done();
      });

      colorCursor.push('purple');
    });

    it('when a parent updates, so does the child.', function(done) {
      const tree = new Baobab(state),
            parent = tree.select('two'),
            child = tree.select(['two', 'firstname']);

      let count = 0;

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
      const tree = new Baobab(state),
            parent = tree.select('two'),
            child = tree.select(['two', 'firstname']);

      let count = 0;

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
      const tree = new Baobab({
        node: {
          leaf1: 'hey',
          leaf2: 'ho'
        }
      });

      const parent = tree.select('node'),
            leaf1 = parent.select('leaf1'),
            leaf2 = parent.select('leaf2');

      let count = 0,
          handler = () => count++;

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

    it('should be possible to listen to changes in an array.', function(done) {
      const tree = new Baobab({list: ['hello', 'world']}),
            cursor = tree.select('list', 1);

      assert.strictEqual(cursor.get(), 'world');

      cursor.on('update', function() {
        assert.strictEqual(cursor.get(), 'jacky');
        done();
      });

      cursor.set('jacky');
    });

    it('should fire update correctly even when root node is affected.', function(done) {
      const tree = new Baobab({first: 1, second: 2});

      tree.select('first').on('update', function() {
        assert.deepEqual(
          tree.get(),
          {first: 1.1, second: 2.2}
        );

        done();
      });

      tree.root.set({first: 1.1, second: 2.2});
    });
  });
});
