/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
var assert = require('assert'),
    state = require('../state.js'),
    Baobab = require('../../src/baobab.js'),
    helpers = require('../../src/helpers.js'),
    update = require('../../src/update.js'),
    clone = require('lodash.clonedeep');

describe('Helpers', function() {

  describe('Composition', function() {

    it('should be able to compose two simple functions.', function() {

      var inc = function(i) { return i + 1; },
        add2 = helpers.compose(inc, inc);

      assert.strictEqual(add2(1), 3);
    });
  });

  describe('Nested get', function() {
    it('should be possible to retrieve nested items through the helper.', function() {
      assert.deepEqual(helpers.getIn(state, ['one', 'subtwo', 'colors']), state.one.subtwo.colors);
      assert.strictEqual(helpers.getIn(state, ['primitive']), 3);
      assert.deepEqual(helpers.getIn(state), state);
      assert.strictEqual(helpers.getIn(state, ['one', 'subtwo', 'colors', 1]), 'yellow');
      assert.strictEqual(helpers.getIn(state, ['one', 'subtwo', 'colors', '1']), 'yellow');
      assert.strictEqual(helpers.getIn(state, ['inexistant', 'path']), undefined);
    });
  });

  describe('Object path', function() {

    it('should be possible to retrieve path objects.', function() {
      var o = helpers.pathObject(['one', 'subtwo'], {$set: ['purple']});
      assert.deepEqual(o, {one: {subtwo: {$set: ['purple']}}});
    });
  });

  describe('Solve path', function() {

    it('should be able to solve a complex path', function() {
      var o = {
        things: [
          {
            name: 'foo'
          },
          {
            name: 'bar'
          }
        ]
      };
      var res = helpers.solvePath(o, ['things', { name: 'bar' } ]);
      assert.deepEqual(res, ['things', 1]);
    });
  });

  describe('Shallow merge', function() {

    it('should be possible to merge objects shallowly.', function() {
      assert.deepEqual(
        helpers.shallowMerge({hello: 'world', other: 'mate'}, {hello: 'Jack', one: 'two'}),
        {hello: 'Jack', one: 'two', other: 'mate'}
      );
    });
  });

  describe('Shallow clone', function() {

    it('should change references at first level.', function() {
      var o = {
        a: 1,
        b: {
          c: 2
        }
      };

      var clone = helpers.shallowClone(o);

      assert(o !== clone);
      assert(o.b === clone.b);
      assert(o.b.c === clone.b.c);
    });
  });

  describe('Update API', function() {

    it('should be possible to set nested values.', function() {
      var o1 = {hello: {world: 'one'}},
          o2 = clone(o1);
      update(o2, {hello: {world: {$set: 'two'}}});

      assert.deepEqual(o1, {hello: {world: 'one'}});
      assert.deepEqual(o2, {hello: {world: 'two'}});
    });

    it('should be possible to push to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = clone(o1);
      update(o2, {colors: {$push: 'blue'}});

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['orange', 'blue']});
    });

    it('should be possible to unshift to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = clone(o1);
      update(o2, {colors: {$unshift: 'blue'}});

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['blue', 'orange']});
    });

    it('should be possible to append to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = clone(o1);
      update(o2, {colors: {$push: ['blue', 'purple']}});

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['orange', 'blue', 'purple']});

      var o3 = {colors: ['orange']},
          o4 = clone(o1);
      update(o4, {colors: {$push: 'blue'}});

      assert.deepEqual(o3, {colors: ['orange']});
      assert.deepEqual(o4, {colors: ['orange', 'blue']});
    });

    it('should be possible to prepend to nested values.', function() {
      var o1 = {colors: ['orange']},
          o2 = clone(o1);
      update(o2, {colors: {$unshift: ['blue', 'purple']}});

      assert.deepEqual(o1, {colors: ['orange']});
      assert.deepEqual(o2, {colors: ['blue', 'purple', 'orange']});

      var o3 = {colors: ['orange']},
          o4 = clone(o1);
      update(o4, {colors: {$unshift: 'blue'}});

      assert.deepEqual(o3, {colors: ['orange']});
      assert.deepEqual(o4, {colors: ['blue', 'orange']});
    });

    it('should be possible to apply a function to nested values.', function() {
      var o1 = {number: 10},
          o2 = clone(o1);
      update(o2, {number: {$apply: function(n) { return n * 2; }}});

      assert.deepEqual(o1, {number: 10});
      assert.deepEqual(o2, {number: 20});
    });
  });
});
