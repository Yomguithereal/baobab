/**
 * Baobab Core Unit Tests
 * =======================
 */
import assert from 'assert';
import Baobab from '../../src/baobab';
import Cursor from '../../src/cursor';
import state from '../state';

describe('Baobab API', function() {

  /**
   * Testing the very basics of the API like tree instantiation.
   */
  describe('Basics', function() {

    it('should throw an error when trying to instantiate an baobab with incorrect data.', function() {
      assert.throws(function() {
        new Baobab(undefined);
      }, /invalid data/);
    });
  });

  /**
   * Selection and cursor creation
   */
  describe('Selection', function() {
    const tree = new Baobab(state);

    it('selecting data in the baobab should return a cursor.', function() {
      assert(tree.select(['one']) instanceof Cursor);
    });

    it('should be possible to use some polymorphism on the selection.', function() {
      const altCursor = tree.select('one', 'subtwo', 'colors');

      assert.deepEqual(altCursor.get(), state.one.subtwo.colors);
    });

    it('should be possible to select data using a function.', function() {
      const cursor = tree.select('one', 'subtwo', 'colors', v => v === 'yellow');

      assert.strictEqual(cursor.get(), 'yellow');
    });

    it('should be possible to select data using a descriptor object.', function() {
      const cursor = tree.select('items', {id: 'one'});

      assert.deepEqual(cursor.get(), {id: 'one'});
    });
  });

  /**
   * Events
   */
  describe('Events', function() {

    it('should be possible to listen to update events.', function(done) {
      const tree = new Baobab(state);

      tree.on('update', function(e) {
        assert.deepEqual(e.data.paths, [['one', 'subtwo', 'colors']]);
        done();
      });

      tree.update(
        ['one', 'subtwo', 'colors'],
        {type: 'set', value: 'whatever'}
      );
    });

    it('should only fire updates once when committing synchronously but when not in synchronous mode.', function(done) {
      let tree = new Baobab({hello: 'world'}),
          count = 0;

      tree.on('update', () => count++);

      tree.set('hello', 'tada');
      tree.commit();

      setTimeout(function() {
        assert.strictEqual(count, 1);
        assert.strictEqual(tree.get('hello'), 'tada');
        done();
      }, 30);
    });

    it('should be possible to listen to new selections.', function(done) {
      let tree = new Baobab({one: {two: 'hello'}}),
          count = 0;

      tree.on('select', function(e) {
        assert.deepEqual(e.data.path, ['one', 'two']);
        assert.strictEqual(e.data.cursor.get(), 'hello');
        count++;
      });

      process.nextTick(function() {
        assert.strictEqual(count, 1);
        done();
      });

      tree.select('one', 'two');
    });

    it('should be possible to listen to get events.', function(done) {
      let tree = new Baobab({one: {two: 'hello'}}),
          count = 0;

      tree.on('get', function(e) {
        assert.deepEqual(e.data.path, ['one', 'two']);
        assert.strictEqual(e.data.data, 'hello');
        count++;
      });

      process.nextTick(function() {
        assert.strictEqual(count, 1);
        done();
      });

      tree.get('one', 'two');
    });

    it('should be possible to listen to failed dynamic get events.', function(done) {
      const tree = new Baobab({data: [{id: 34, txt: 'Hey'}]});

      let count = 0;

      tree.on('get', function({data: {path, solvedPath, data}}) {
        count++;

        if (count === 1) {
          assert.strictEqual(solvedPath, null);
          assert.strictEqual(data, undefined);
          return;
        }
        else if (count === 2) {
          assert.deepEqual(path, ['data']);
          return;
        }

        assert.deepEqual(solvedPath, ['data', 0]);

        if (count > 2)
          done();
      });

      tree.get('data', {id: 45});
      tree.get('data');
      tree.get('data', x => x.id === 34);
    });

    it('update events should expose the tree\'s data.', function(done) {
      const tree = new Baobab({hello: 'world'});

      tree.on('update', function(e) {
        assert.deepEqual(e.data.previousData, {hello: 'world'});
        assert.deepEqual(e.data.data, {hello: 'monde'});
        done();
      });

      tree.set('hello', 'monde');
    });
  });

  /**
   * Advanced issues
   */
  describe('Advanced', function() {
    it('should be possible to release a tree.', function() {
      const tree = new Baobab(state),
            one = tree.select('one'),
            two = tree.select('two');

      tree.on('update', Function.prototype);
      one.on('update', Function.prototype);
      two.on('update', Function.prototype);

      one.release();
      tree.release();

      assert(tree.data === undefined);
    });

    it('the tree should shift references on updates.', function() {
      const list = [1],
            tree = new Baobab({list: list}, {asynchronous: false});

      tree.select('list').push(2);
      assert.deepEqual(tree.get('list'), [1, 2]);
      assert(list !== tree.get('list'));
    });

    it('the tree should also shift parent references.', function() {
      const shiftingTree = new Baobab({root: {admin: {items: [1], other: [2]}}}, {asynchronous: false});

      const shiftingOriginal = shiftingTree.get();

      shiftingTree.select('root', 'admin', 'items').push(2);

      assert.deepEqual(shiftingTree.get('root', 'admin', 'items'), [1, 2]);

      assert(shiftingTree.get() !== shiftingOriginal);
      assert(shiftingTree.get().root !== shiftingOriginal.root);
      assert(shiftingTree.get().root.admin !== shiftingOriginal.root.admin);
      assert(shiftingTree.get().root.admin.items !== shiftingOriginal.root.admin.items);
      assert(shiftingTree.get().root.admin.other === shiftingOriginal.root.admin.other);
    });
  });

  /**
   * Options
   */
  describe('Options', function() {
    it('should be possible to commit changes immediately.', function() {
      const tree = new Baobab({hello: 'world'}, {asynchronous: false});
      tree.set('hello', 'you');
      assert.strictEqual(tree.get('hello'), 'you');
    });

    it('should be possible to let the user commit himself.', function() {
      const tree = new Baobab({number: 1}, {autoCommit: false, asynchronous: false});

      let txCount = 0;

      tree.on('update', () => txCount++);
      tree.set('number', 2);
      tree.apply('number', x => x + 1);
      tree.commit();
      tree.set('number', 5);

      assert.strictEqual(txCount, 1);
    });

    it('should be possible to validate the tree and rollback on fail.', function() {
      let invalidCount = 0;

      function v(state, nextState, paths) {
        assert(this === tree);

        if (typeof nextState.hello !== 'string')
          return new Error('Invalid tree!');
      }

      const tree = new Baobab({hello: 'world'}, {validate: v, asynchronous: false});

      tree.on('invalid', function(e) {
        const error = e.data.error;

        assert.strictEqual(error.message, 'Invalid tree!');
        invalidCount++;
      });

      tree.set('hello', 'John');

      assert.strictEqual(invalidCount, 0);
      assert.strictEqual(tree.get('hello'), 'John');

      tree.set('hello', 4);

      assert.strictEqual(invalidCount, 1);
      assert.strictEqual(tree.get('hello'), 'John');
    });

    it('should be possible to validate the tree and let the tree update on fail.', function() {
      let invalidCount = 0;

      function v(state, nextState, paths) {
        assert(this === tree);

        if (typeof nextState.hello !== 'string')
          return new Error('Invalid tree!');
      }

      const tree = new Baobab({hello: 'world'}, {validate: v, asynchronous: false, validationBehavior: 'notify'});

      tree.on('invalid', function(e) {
        const error = e.data.error;

        assert.strictEqual(error.message, 'Invalid tree!');
        invalidCount++;
      });

      tree.set('hello', 'John');

      assert.strictEqual(invalidCount, 0);
      assert.strictEqual(tree.get('hello'), 'John');

      tree.set('hello', 4);

      assert.strictEqual(invalidCount, 1);
      assert.strictEqual(tree.get('hello'), 4);
    });

    it('the tree should be immutable by default.', function() {
      let data;

      const tree = new Baobab(
        {
          one: {
            two: {
              three: 'Hello'
            }
          }
        },
        {
          immutable: true,
          asynchronous: false
        }
      );

      function checkFridge() {
        const targetData = tree.get();

        assert.isFrozen(targetData);
        assert.isFrozen(targetData.one);
        assert.isFrozen(targetData.one.two);
        assert.isFrozen(targetData.one.two.three);

        if (targetData.one.two.three.four)
          assert.isFrozen(targetData.one.two.three.four);
      }

      checkFridge();

      tree.set(['one', 'two', 'three'], 'world');

      checkFridge();

      tree.set(['one', 'two', 'three', 'four'], {five: 'hey'});

      checkFridge();

      tree.set({one: {two: {three: {four: 'hey'}}}});

      tree.unset(['one', 'two']);

      data = tree.get();

      assert.isFrozen(data);
      assert.isFrozen(data.one);

      // Arrays
      tree.set([{nb: 1}, {nb: 2}]);

      data = tree.get();

      assert.isFrozen(data);
      assert.isFrozen(data[0]);
      assert.isFrozen(data[1]);

      tree.set(0, {nb: 3});

      assert.isFrozen(data);
      assert.isFrozen(data[0]);
      assert.isFrozen(data[1]);

      tree.set({one: {}});

      // Complex update
      tree.set('one', {
        subone: 'hey',
        subtwo: 'ho'
      });

      data = tree.get();

      assert.isFrozen(data);
      assert.isFrozen(data.one);
      assert.isFrozen(data.one.subone);
      assert.isFrozen(data.one.subtwo);
    });

    it('should be possible to disable immutability.', function() {
      const immutableTree = new Baobab({hello: 'John'}),
            mutableTree = new Baobab({hello: 'John'}, {immutable: false});

      const immutableData = immutableTree.get();

      assert.throws(function() {
        immutableData.hello = 'Jack';
      }, Error);

      const mutableData = mutableTree.get();
      mutableData.hello = 'Jack';
      assert.strictEqual(mutableTree.get('hello'), 'Jack');
    });

    it('if persitence is disabled, so should immutability.', function() {
      const tree = new Baobab({}, {persistent: false});

      assert.strictEqual(tree.options.persistent, false);
      assert.strictEqual(tree.options.immutable, false);
    });

    it('turning persistence off should work.', function() {
      const tree = new Baobab(
        {
          list: [],
          object: {
            one: 1
          }
        },
        {
          asynchronous: false,
          persistent: false
        }
      );

      var initialList = tree.get('list'),
          initialObject = tree.get('object');

      tree.push('list', 2);

      assert.deepEqual(tree.get('list'), [2]);
      assert.strictEqual(tree.get('list'), initialList);

      tree.unshift('list', 1);

      assert.deepEqual(tree.get('list'), [1, 2]);
      assert.strictEqual(tree.get('list'), initialList);

      tree.concat('list', [3, 4]);

      assert.deepEqual(tree.get('list'), [1, 2, 3, 4]);
      assert.strictEqual(tree.get('list'), initialList);

      tree.splice('list', [0, 1]);

      assert.deepEqual(tree.get('list'), [2, 3, 4]);
      assert.strictEqual(tree.get('list'), initialList);

      tree.merge('object', {two: 2});

      assert.deepEqual(tree.get('object'), {one: 1, two: 2});
      assert.strictEqual(tree.get('object'), initialObject);
    });
  });
});
