/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
import assert from 'assert';
import {
  deepMerge,
  getIn,
  shallowMerge,
  splice,
  solveRelativePath
} from '../../src/helpers';

describe('Helpers', function() {

  /**
   * Nested getter
   */
  describe('GetIn', function() {
    it('should return both data at path and solved path.', function() {
      const data = {a: {b: {c: 'hey'}}};

      assert.deepEqual(
        getIn(data, ['a', 'b', 'c']),
        {data: 'hey', solvedPath: ['a', 'b', 'c'], exists: true}
      );
    });

    it('should also work with dynamic paths.', function() {
      const data = {a: {b: [null, {id: 34}]}};

      assert.deepEqual(
        getIn(data, ['a', 'b', {id: 34}]),
        {data: {id: 34}, solvedPath: ['a', 'b', 1], exists: true}
      );
    });

    it('should return a not-found object when the data cannot be accessed.', function() {
      const data = {a: null};

      assert.deepEqual(
        getIn(data, ['a', 'b', 'c']),
        {data: undefined, solvedPath: ['a', 'b', 'c'], exists: false}
      );

      const otherData = {a: [{id: 45}]};

      assert.deepEqual(
        getIn(otherData, ['a', e => e.id === 46]),
        {data: undefined, solvedPath: null, exists: false}
      );
    });
  });

  /**
   * Merge
   */
  describe('Merge', function() {
    it('should be possible to shallow merge objects.', function() {
      const data = {a: 1, c: 3},
            nestedData = {a: 1, b: {c: 2}};

      assert.deepEqual(shallowMerge({}, data, {b: 2}), {a: 1, b: 2, c: 3});
      assert.deepEqual(shallowMerge({}, nestedData, {b: {d: 3}}), {a: 1, b: {d: 3}});
    });

    it('the merge functions should be mutative.', function() {
      const data = {a: 1, c: 3};

      shallowMerge(data, {b: 2});

      assert.deepEqual(data, {a: 1, b: 2, c: 3});
    });

    it('should be possible to deep merge objects.', function() {
      const data = {inner: {a: 1, c: 3}};

      assert.deepEqual(deepMerge({}, data, {inner: {b: 2}}), {inner: {a: 1, b: 2, c: 3}});
    });

    it('deep merge should avoid computed node keys.', function() {
      const data = {a: 1, b: {c: 2, $facet: {d: 3}}};

      assert.deepEqual(
        deepMerge({}, data, {a: 5, b: {$facet: 'test'}}),
        {a: 5, b: {c: 2, $facet: 'test'}}
      );
    });

    it('should consider arrays are values.', function() {
      assert.deepEqual(
        deepMerge({}, {one: {two: [1, 2]}, three: 3}, {one: {two: [3, 4]}}),
        {one: {two: [3, 4]}, three: 3}
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
	
    it('should treat a negative nb argument as 0.', function() {
      var array = ['yellow', 'blue', 'purple'];
      assert.deepEqual(
        splice(array, 0, -1, 'gold'),
        ['gold', 'yellow', 'blue', 'purple']
      );
    });
  });

  /**
   * Solving relative paths
   */
  describe('Relative paths solving', function() {
    it('should work for every cases.', function() {
      const cases = [
        [['one', 'two'], ['one', 'two']],
        [['.', 'one', 'two'], ['base', 'sub', 'one', 'two']],
        [['.', 'one', '.', 'two'], ['base', 'sub', 'one', 'two']],
        [['one', 'two', '.'], ['one', 'two']],
        [['..', 'one'], ['base', 'one']],
        [['..', 'one', '..'], ['base']],
        [['..', '..', '..', '..'], []],
        [['..', '..', '..', 'base', '..', 'base'], ['base']]
      ];

      cases.forEach(([path, expected], i) => assert.deepEqual(solveRelativePath(['base', 'sub'], path), expected, 'N° ' + i));
    });
  });
});
