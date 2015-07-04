/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
import assert from 'assert';
import {
  splice
} from '../../src/helpers';

describe('Helpers', function() {

  /**
   * Non-mutative splice
   */
  describe('Splice', function() {

    it('should work in a non-mutative fashion.', function() {
      var array = ['yellow', 'blue', 'purple'];

      assert.deepEqual(
        splice(array, 0, 0),
        array
      );

      assert.deepEqual(
        splice(array, 0, 1),
        ['blue', 'purple']
      );

      assert.deepEqual(
        splice(array, 1, 1),
        ['yellow', 'purple']
      );

      assert.deepEqual(
        splice(array, 2, 1),
        ['yellow', 'blue']
      );

      assert.deepEqual(
        splice(array, 2, 0),
        array
      );

      assert.deepEqual(
        splice(array, 1, 2),
        ['yellow']
      );

      assert.deepEqual(
        splice(array, 2, 1, 'orange', 'gold'),
        ['yellow', 'blue', 'orange', 'gold']
      );

      assert.deepEqual(
        splice(array, 5, 3),
        array
      );

      assert.deepEqual(
        splice(array, 5, 3, 'orange', 'gold'),
        ['yellow', 'blue', 'purple', 'orange', 'gold']
      );

      assert.deepEqual(
        splice(array, 1, 0, 'gold'),
        ['yellow', 'gold', 'blue', 'purple']
      );

      assert.deepEqual(
        splice(array, 1, 1, 'gold'),
        ['yellow', 'gold', 'purple']
      );
    });
  });
});
