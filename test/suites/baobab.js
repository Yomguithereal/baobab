/**
 * Baobab Core Unit Tests
 * =======================
 */
import assert from 'assert';
import Baobab from '../../src/baobab';
import Cursor from '../../src/cursor';
import state from '../state';

describe('Baobab API', function() {

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
});
