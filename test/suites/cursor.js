/**
 * Baobab Core Unit Tests
 * =======================
 */
import assert from 'assert';
import async from 'async';
import Baobab, {monkey} from '../../src/baobab';
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
              secondItem = tree.get('items', {id: 'two', user: {name: 'John'}});

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

      it('should throw when using an invalid path in getters.', function() {
        assert.throws(function() {
          tree.get([null, false]);
        }, /invalid/);
      });

      it('should be possible to use some projection.', function() {
        const altTree = new Baobab({
          one: 1,
          two: 2
        });

        assert.deepEqual(
          altTree.project({a: ['one'], b: ['two']}),
          {
            a: 1,
            b: 2
          }
        );

        assert.deepEqual(
          altTree.project([['one'], ['two']]),
          [1, 2]
        );
      });

      it('an unsolved dynamic cursor should get undefined.', function() {
        const cursor = tree.select('one', 'subtwo', 'colors', {id: 4});

        assert.strictEqual(cursor.solvedPath, null);
        assert.strictEqual(cursor.get(), undefined);
      });

      it('should be possible to tell whether a path exists or not.', function() {
        assert.strictEqual(tree.exists(), true);
        assert.strictEqual(tree.exists('one'), true);
        assert.strictEqual(tree.exists('three'), false);
        assert.strictEqual(tree.exists(['one', 'subtwo']), true);
        assert.strictEqual(tree.exists('one', 'subtwo'), true);
        assert.strictEqual(tree.exists('one', 'subthree'), false);
      });

      it('should be possible to assess whether an undefined value exists.', function() {
        assert.strictEqual(tree.exists('undefinedValue'), true);
        assert.strictEqual(tree.exists('setLater'), true);
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

      it('should be possible to shallow clone data at cursor.', function() {
        const clonedData = colorCursor.clone();

        assert(clonedData !== colorCursor.get());
        assert(clonedData !== colorCursor.clone());
        assert(tree.clone().one === tree.get().one);
      });

      it('should be possible to deep clone data at cursor.', function() {
        const clonedData = tree.deepClone();

        assert(clonedData !== tree.get());
        assert(tree.deepClone().one !== tree.get().one);
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

      it('should be possible to tell whether a cursor exists or not.', function() {
        assert.strictEqual(oneCursor.exists(), true);
        assert.strictEqual(oneCursor.select('subtwo', 'colors').exists(), true);
        assert.strictEqual(oneCursor.select('subtwo').exists('colors'), true);
        assert.strictEqual(oneCursor.select('hey').exists(), false);
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

      it('should be possible to write the tree synchronously.', function(done) {
        const tree = new Baobab({hello: 'John'}, {syncwrite: true});

        tree.on('update', function() {
          done();
        });

        assert.strictEqual(tree.get('hello'), 'John');
        tree.set('hello', 'Jack');
        assert.strictEqual(tree.get('hello'), 'Jack');
      });

      it('using an unknown operation type should throw.', function() {
        const tree = new Baobab();

        assert.throws(function() {
          tree.update([], {type: 'shawarma', value: 'hey'});
        }, /unknown/);
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

      it('should fail consistently across possibilities when setting a nonexistent dynamic path.', function() {
        const tree = new Baobab({items: [{id: 1}]}, {asynchronous: true});

        assert.throws(function() {
          tree.set(['items', {id: 2}, 'id'], 3);
        }, /solve/);

        assert.throws(function() {
          tree.select('items', {id: 2}).set('id', 3);
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

      it('should be possible to deep merge two objects.', function(done) {
        const tree = new Baobab({
          data: {
            items: {
              one: 1
            }
          }
        });

        const cursor = tree.select('data');
        cursor.deepMerge({items: {two: 2}, hello: 'world'});

        tree.on('update', function(e) {

          assert.strictEqual(e.data.transaction[0].type, 'deepMerge');

          assert.deepEqual(
            cursor.get(),
            {
              items: {
                one: 1,
                two: 2
              },
              hello: 'world'
            }
          );

          done();
        });
      });

      it('should be possible to remove keys from a cursor.', function() {
        const tree = new Baobab({one: 1, two: {subone: 1, subtwo: 2}}, {asynchronous: false}),
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

      it('should be possible to unset an array\'s item.', function() {
        const tree = new Baobab({list: [1, 2, 3]}),
              cursor = tree.select('list');

        cursor.unset(1);
        assert.deepEqual(cursor.get(), [1, 3]);
        assert.strictEqual(cursor.get().length, 2);
      });

      it('should do nothing to unset an inexistant key.', function() {
        const tree = new Baobab();

        tree.unset(['one', 'two']);

        assert.deepEqual(tree.get(), {});
      });

      it('should be possible to unset null/undefined values.', function() {
        const tree = new Baobab({nullValue: null, undefinedValue: null});

        assert(tree.exists('nullValue'));
        assert(tree.exists('undefinedValue'));

        tree.unset('nullValue');
        tree.unset('undefinedValue');

        assert.deepEqual(tree.get(), {});
        assert(!tree.exists('nullValue'));
        assert(!tree.exists('undefinedValue'));
      });

      it('should be possible to push/unshift/concat to an array.', function() {
        const tree = new Baobab([]);

        tree.push(2);
        tree.unshift(1);
        tree.concat([3, 4]);

        assert.deepEqual(tree.get(), [1, 2, 3, 4]);
      });

      it('should be possible to splice an array.', function() {
        const tree = new Baobab({list: [1, 2, 3]}, {asynchronous: false}),
              cursor = tree.select('list');

        assert.deepEqual(cursor.get(), [1, 2, 3]);

        cursor.splice([0, 1]);
        cursor.splice([1, 1, 4]);

        assert.deepEqual(cursor.get(), [2, 4]);
      });

      it('should be possible to pop an array.', function() {
        const ptree = new Baobab({list: [1, 2, 3]}, {asynchronous: false}),
              tree = new Baobab({list: [1, 2, 3]}, {asynchronous: false, persistent: false});

        ptree.pop('list');
        tree.pop('list');

        assert.deepEqual(
          ptree.get('list'),
          [1, 2]
        );

        assert.deepEqual(
          tree.get('list'),
          [1, 2]
        );
      });

      it('should be possible to shift an array.', function() {
        const ptree = new Baobab({list: [1, 2, 3]}, {asynchronous: false}),
              tree = new Baobab({list: [1, 2, 3]}, {asynchronous: false, persistent: false});

        ptree.shift('list');
        tree.shift('list');

        assert.deepEqual(
          ptree.get('list'),
          [2, 3]
        );

        assert.deepEqual(
          tree.get('list'),
          [2, 3]
        );
      });

      it('should be possible to set a falsy value.', function() {
        const tree = new Baobab({hello: 'world'}, {asynchronous: false});

        tree.set('hello', '');

        assert.strictEqual(tree.get('hello'), '');

        tree.set('hello', false);

        assert.strictEqual(tree.get('hello'), false);
      });

      it('should be possible to set values using a falsy path.', function() {
        const tree = new Baobab({list: ['hey'], dict: {}}, {asynchronous: false});

        tree.select('dict').set('', 'hello');
        tree.select('list').set(0, 'ho');

        assert.deepEqual(tree.get(), {list: ['ho'], dict: {'': 'hello'}});
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

      let count = 0;
      const handler = () => count++;

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

    it('should not notify siblings in an array when pushing.', function() {
      const tree = new Baobab({list: ['one']}, {asynchronous: false}),
            cursor = tree.select('list', 0);

      let count = 0;
      const listener = () => count++;

      cursor.on('update', listener);

      tree.push('list', 'two');
      tree.set('list', ['three']);

      assert.strictEqual(count, 1);
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

    it('update events should expose the cursor\'s data.', function(done) {
      const tree = new Baobab({one: {hello: 'world'}});

      tree.select('one').on('update', function(e) {
        assert.deepEqual(e.data.previousData, {hello: 'world'});
        assert.deepEqual(e.data.currentData, {hello: 'monde'});
        done();
      });

      tree.set(['one', 'hello'], 'monde');
    });

    it('update events should expose previous computed data.', function(done) {
      const tree = new Baobab({
        list: ['hey', 'ho'],
        currentItem: 0,
        current: monkey([
          ['list'],
          ['currentItem'],
          function(list, i) {
            return list[i];
          }
        ])
      });

      const cursor = tree.select('current');

      cursor.on('update', function({data}) {
        assert.strictEqual(data.currentData, 'ho');
        assert.strictEqual(data.previousData, 'hey');
        done();
      });

      tree.set('currentItem', 1);
    });

    it('dynamic cursors should see their solvedPath correctly update on writes.', function(done) {
      const tree = new Baobab({colors: []}),
            cursor = tree.select('colors', {id: 0});

      assert.strictEqual(cursor.get(), undefined);

      tree.push('colors', {id: 0, name: 'yellow'});

      assert.deepEqual(cursor.get(), {id: 0, name: 'yellow'});

      cursor.on('update', done.bind(null, null));
    });
  });

  /**
   * Predicates
   */
  describe('Predicates', function() {
    const tree = new Baobab(state);

    it('should be possible to tell whether cursor is root.', function() {
      assert(tree.select('one').up().isRoot());
      assert(!tree.select('one').isRoot());
    });

    it('should be possible to tell whether cursor is leaf.', function() {
      assert(tree.select('primitive').isLeaf());
      assert(!tree.select('one').isLeaf());
    });

    it('should be possible to tell whether cursor is branch.', function() {
      assert(tree.select('one').isBranch());
      assert(!tree.select('one').up().isBranch());
      assert(!tree.select('primitive').isBranch());
    });
  });

  /**
   * Traversal
   */
  describe('Traversal', function() {
    const tree = new Baobab(state);

    const colorCursor = tree.select(['one', 'subtwo', 'colors']),
          oneCursor = tree.select('one');

    it('should be possible to create subcursors.', function() {
      const sub = oneCursor.select(['subtwo', 'colors']);
      assert.deepEqual(sub.get(), state.one.subtwo.colors);
    });

    it('should be possible to go up.', function() {
      const parent = colorCursor.up();
      assert.deepEqual(parent.get(), state.one.subtwo);
    });

    it('a cusor going up to root cannot go higher and returns null.', function() {
      const up = tree.select('one').up(),
            upper = up.up();

      assert.strictEqual(upper, null);
    });

    it('should be possible to go left.', function() {
      const left = colorCursor.select(1).left();

      assert.strictEqual(left.get(), 'blue');
      assert.strictEqual(left.left(), null);

      assert.throws(function() {
        colorCursor.left();
      }, /left/);
    });

    it('should be possible to go right.', function() {
      const right = colorCursor.select(0).right();

      assert.strictEqual(right.get(), 'yellow');
      assert.strictEqual(right.right(), null);

      assert.throws(function() {
        colorCursor.right();
      }, /right/);
    });

    it('should be possible to descend.', function() {
      const list = tree.select('list');

      assert.deepEqual(list.down().get(), [1, 2]);
      assert.strictEqual(colorCursor.down().get(), 'blue');
      assert.strictEqual(colorCursor.down().up().up().select('colors').down().get(), 'blue');
      assert.strictEqual(list.down().right().down().right().get(), 4);

      assert.throws(function() {
        oneCursor.down();
      }, /down/);
    });

    it('should be possible to get to the leftmost item of a list.', function() {
      const listItem = tree.select('longList', 2);

      assert.strictEqual(listItem.get(), 3);
      assert.strictEqual(listItem.leftmost().get(), 1);
    });

    it('should be possible to get to the rightmost item of a list.', function() {
      const listItem = tree.select('longList', 2);

      assert.strictEqual(listItem.get(), 3);
      assert.strictEqual(listItem.rightmost().get(), 4);
    });

    it('should be possible to iterate over an array.', function() {
      const result = [];

      for (const i of colorCursor) {
        result.push(i.get());
      }

      assert.deepEqual(result, state.one.subtwo.colors);

      assert.throws(function() {
        for (const i of oneCursor) {
          result.push(i);
        }
      }, /non-list/);
    });

    it('should be possible to map an array.', function() {
      let count = 0;

      const array = colorCursor.map(function(cursor, i) {
        assert(this === colorCursor);
        assert(count++ === i);

        return cursor;
      });

      assert.deepEqual(
        array.map(c => c.get()),
        state.one.subtwo.colors
      );

      const scope = {hello: 'world'};
      colorCursor.map(function() {
        assert(this === scope);
      }, scope);

      assert.throws(function() {
        oneCursor.map(Function.prototype);
      }, /non-list/);
    });

    it('should be supported correctly with dynamic cursors.', function() {
      const cursor = tree.select('one', 'subtwo', 'colors', {id: 23});

      assert.deepEqual(cursor.up().path, ['one', 'subtwo', 'colors']);
      assert.deepEqual(cursor.select('test').path, ['one', 'subtwo', 'colors', {id: 23}, 'test']);
      assert.deepEqual(cursor.root().get(), tree.root.get());

      assert.throws(function() {
        cursor.left();
      }, /left/);

      assert.throws(function() {
        cursor.right();
      }, /right/);

      assert.throws(function() {
        cursor.down();
      }, /down/);

      assert.throws(function() {
        cursor.leftmost();
      }, /leftmost/);

      assert.throws(function() {
        cursor.rightmost();
      }, /rightmost/);

      assert.throws(function() {
        cursor.map();
      }, /map/);
    });
  });

  /**
   * History
   */
  describe('History', function() {

    it('should be possible to record updates.', function() {
      const tree = new Baobab({item: 1}, {asynchronous: false}),
            cursor = tree.select('item');

      assert(!cursor.state.recording);
      assert(!cursor.hasHistory());
      assert.deepEqual(cursor.getHistory(), []);

      cursor.startRecording(5);

      assert(cursor.state.recording);

      [1, 2, 3, 4, 5, 6].forEach(function() {
        cursor.apply(e => e + 1);
      });

      assert(cursor.hasHistory());
      assert.strictEqual(cursor.get(), 7);
      assert.deepEqual(cursor.getHistory(), [2, 3, 4, 5, 6].reverse());

      cursor.stopRecording();
      cursor.clearHistory();

      assert(!cursor.state.recording);
      assert(!cursor.hasHistory());
      assert.deepEqual(cursor.getHistory(), []);
    });

    it('should throw an error if trying to undo a recordless cursor.', function() {
      const tree = new Baobab({item: 1}, {asynchronous: false}),
            cursor = tree.select('item');

      assert.throws(function() {
        cursor.undo();
      }, /recording/);
    });

    it('should be possible to go back in time.', function() {
      const tree = new Baobab({item: 1}, {asynchronous: false}),
            cursor = tree.select('item');

      cursor.startRecording(5);

      [1, 2, 3, 4, 5, 6].forEach(function() {
        cursor.apply(e => e + 1);
      });

      assert.strictEqual(cursor.get(), 7);

      cursor.undo();
      assert.strictEqual(cursor.get(), 6);
      assert.deepEqual(cursor.getHistory(), [2, 3, 4, 5].reverse());

      cursor.undo().undo();

      assert.strictEqual(cursor.get(), 4);
      assert.deepEqual(cursor.getHistory(), [2, 3].reverse());

      cursor.set(5);
      cursor.set(6);

      cursor.undo(3);

      assert.strictEqual(cursor.get(), 3);
      assert.deepEqual(cursor.getHistory(), [2]);

      assert.throws(function() {
        cursor.undo(5);
      }, /relevant/);
    });
  });

  it('should be possible to restart a history after having stopped it before.', function() {
    const tree = new Baobab({item: 1}, {asynchronous: false}),
          cursor = tree.select('item');

    cursor.startRecording();
    cursor.stopRecording();
    cursor.startRecording();
    cursor.set(2);

    assert(cursor.state.recording);
    assert.deepEqual(cursor.getHistory(), [1]);
  });

  /**
   * Advanced issues
   */
  describe('Advanced', function() {
    it('should be possible to execute several orders within a single stack.', function(done) {
      const tree = new Baobab({
        one: 'coco',
        two: 'koko'
      });

      tree.set('one', 'cece');
      tree.set('two', 'keke');

      setTimeout(function() {
        assert.deepEqual(tree.get(), {one: 'cece', two: 'keke'});
        done();
      }, 0);
    });

    it('should be possible to merge push-like specifications.', function(done) {
      const tree = new Baobab({list: [1]}),
            cursor = tree.select('list');

      cursor.push(2);
      cursor.push(3);
      cursor.unshift(-1);
      cursor.concat([4, 5]);

      setTimeout(function() {
        assert.deepEqual(cursor.get(), [-1, 1, 2, 3, 4, 5]);
        done();
      }, 0);
    });

    it('an upper set should correctly resolve.', function(done) {
      const tree = new Baobab({hello: {color: 'blue'}});

      tree.select('hello', 'color').set('yellow');
      tree.set('hello', 'purple');

      tree.on('update', function() {
        assert.deepEqual(tree.get(), {hello: 'purple'});
        done();
      });
    });

    it('a $set/$apply conflict should correctly resolve.', function(done) {
      const tree = new Baobab({number: 1});

      tree.set('number', 2);
      tree.update(['number'], {type: 'apply', value: x => x + 2});

      tree.on('update', function() {
        assert.strictEqual(tree.get('number'), 4);
        done();
      });
    });

    it('should be possible to set a nested key on a primitive path.', function() {
      const tree = new Baobab({
        hello: 42
      }, {asynchronous: false});

      tree.set(['hello', 'cowabunga'], 43);

      assert.deepEqual(tree.get(), {
        hello: {
          cowabunga: 43
        }
      });
    });
  });
});
