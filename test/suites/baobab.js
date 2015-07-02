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
      var altCursor = tree.select('one', 'subtwo', 'colors');

      assert.deepEqual(altCursor.get(), state.one.subtwo.colors);
    });
  });
});
