/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
import {strict as assert} from 'assert';
import {
  deepMerge,
  getIn,
  shallowMerge,
  splice,
  solveRelativePath
// @ts-ignore
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

    it('should also work with dynamic paths.', function() {
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
        getIn(otherData, ['a', (e: any) => e.id === 46]),
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

    it('merge should not pollute object prototype.', function() {
      const data = JSON.parse('{"__proto__": {"polluted": true}}');

      deepMerge({}, data);

      assert.equal(Object.keys(Object.prototype).includes('polluted'), false);
    });
  });

  /**
   * Non-mutative splice
   */
  describe('Splice', function() {

    it('should work in a non-mutative fashion.', function() {
      const array = ['yellow', 'blue', 'purple'];

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
      const array = ['yellow', 'blue', 'purple'];

      assert.deepEqual(
        splice(array, 0, -1, 'gold'),
        ['gold', 'yellow', 'blue', 'purple']
      );
    });

    it('should properly handle negative indexes.', function() {
      const array = [1, 2, 3, 4];

      assert.deepEqual(
        splice(array, -1, 1),
        [1, 2, 3]
      );

      assert.deepEqual(
        splice(array, -1, 0),
        [1, 2, 3, 4]
      );

      assert.deepEqual(
        splice(array, -2, 2),
        [1, 2]
      );

      assert.deepEqual(
        splice(array, -1, 1, 5),
        [1, 2, 3, 5]
      );

      assert.deepEqual(
        splice(array, -2, 1, 5),
        [1, 2, 5, 4]
      );

      assert.deepEqual(
        splice(array, -2, 1),
        [1, 2, 4]
      );

      assert.deepEqual(
        splice(['yellow', 'purple'], -1, 1),
        ['yellow']
      );
    });

    it('should handle predicates & descriptors as start index.', function() {
      const collection = [
        {name: 'John'},
        {name: 'Jack'}
      ];

      assert.deepEqual(
        splice(collection, (e: any) => e.name === 'Jack', 1, {name: 'Paul'}),
        [{name: 'John'}, {name: 'Paul'}]
      );

      assert.deepEqual(
        splice(collection, {name: 'Jack'}, 1, {name: 'Paul'}),
        [{name: 'John'}, {name: 'Paul'}]
      );
    });

    describe('Issue #472 - tree/cursor.splice does not conform with the specification as of ES6 (ECMAScript 2015)', function () {
      it('should be possible to splice an array when omitting the nb (deleteCount) argument', function () {
        const array = [0, 1, 2, 3, 4];

        assert.deepEqual(splice(array, 2), [0, 1]);

        assert.deepEqual(splice(array, -2), [0, 1, 2]);
      });

      it('should ignore the nb (deleteCount) argument when passing null, undefined, empty string, or false', function () {
        const array = [0, 1, 2, 3, 4];

        assert.deepEqual(splice(array, 2, null), [0, 1, 2, 3, 4], 'null for nb');
        assert.deepEqual(splice(array, 2, null, 5), [0, 1, 5, 2, 3, 4], 'null for nb with new item');

        assert.deepEqual(splice(array, 2, undefined), [0, 1, 2, 3, 4], 'undefined for nb');
        assert.deepEqual(splice(array, 2, undefined, 5), [0, 1, 5, 2, 3, 4], 'undefined for nb with new item');

        assert.deepEqual(splice(array, 2, ''), [0, 1, 2, 3, 4], '"" for nb');
        assert.deepEqual(splice(array, 2, '', 5), [0, 1, 5, 2, 3, 4], '"" for nb with new item');

        assert.deepEqual(splice(array, 2, false), [0, 1, 2, 3, 4], 'false for nb');
        assert.deepEqual(splice(array, 2, false, 5), [0, 1, 5, 2, 3, 4], 'false for nb with new item');
      });

      it('should allow for nb (deleteCount) argument to be true, a coereced string, a decimal, or Infinity', function () {
        const array = [0, 1, 2, 3, 4];

        assert.deepEqual(splice(array, 2, true), [0, 1, 3, 4], 'true for nb');

        assert.deepEqual(splice(array, 2, '1'), [0, 1, 3, 4], '"1" for nb');

        assert.deepEqual(splice(array, 2, 1.2), [0, 1, 3, 4], '1.2 for nb');

        assert.deepEqual(splice(array, 2, Infinity), [0, 1], 'Infinity for nb');
      });

      it('should throw an error when supplying an argument for nb (deleteCount) which is not parseable as number', function () {
        const array = [0, 1, 2, 3, 4];

        assert.throws(function() {
          splice(array, 2, 'a');
        }, Error);

        assert.throws(function() {
            splice(array, 2, {});
        }, Error);
      });
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
