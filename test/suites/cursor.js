/**
 * Baobab Core Unit Tests
 * =======================
 */
import assert from 'assert';
import Baobab from '../../src/baobab';
import Cursor from '../../src/cursor';
import state from '../state';

describe('Cursor API', function() {

  /**
   * Getter
   */
  describe('Getters', function() {

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
  });
});
