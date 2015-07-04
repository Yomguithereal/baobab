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
  });
});
