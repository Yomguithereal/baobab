/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
import assert from 'assert';
import {
  deepMerge,
  shallowMerge,
  splice
} from '../../src/helpers';

describe('Helpers', function() {

  /**
   * Merge
   */
  describe('Merge', function() {
    it('should be possible to shallow merge objects.', function() {
      const data = {a: 1, c: 3},
            nestedData = {a: 1, b: {c: 2}};

      assert.deepEqual(shallowMerge(data, {b: 2}), {a: 1, b: 2, c: 3});
      assert.deepEqual(shallowMerge(nestedData, {b: {d: 3}}), {a: 1, b: {d: 3}});
    });

    it('should be possible to deep merge objects.', function() {
      const data = {inner: {a: 1, c: 3}};

      assert.deepEqual(deepMerge(data, {inner: {b: 2}}), {inner: {a: 1, b: 2, c: 3}});
    });

    it('deep merge should avoid computed node keys.', function() {
      const data = {a: 1, b: {c: 2, $facet: {d: 3}}};

      assert.deepEqual(
        deepMerge(data, {a: 5, b: {$facet: 'test'}}),
        {a: 5, b: {c: 2, $facet: 'test'}}
      );
    });
  });

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
