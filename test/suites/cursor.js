/**
 * Baobab Cursors Unit Tests
 * ==========================
 */
var assert = require('assert'),
    state = require('../state.js'),
    helpers = require('../../src/helpers.js'),
    Typology = require('typology'),
    Baobab = require('../../src/baobab.js'),
    async = require('async');

describe('Cursor API', function() {

  describe('Basics', function() {
    var baobab = new Baobab(state);

    var colorCursor = baobab.select(['one', 'subtwo', 'colors']),
        oneCursor = baobab.select('one');

    it('should be possible to retrieve data at cursor.', function() {
      var colors = colorCursor.get();

      assert(colors instanceof Array);
      assert.deepEqual(colors, state.one.subtwo.colors);
    });

    it('should be possible to retrieve data with a 0 key.', function() {
      var sub = new Baobab([1, 2]);
      assert.strictEqual(sub.get(0), 1);
      assert.strictEqual(colorCursor.get(0), 'blue');
    });

    it('should be possible to retrieve nested data.', function() {
      var colors = oneCursor.get(['subtwo', 'colors']);

      assert.deepEqual(colors, state.one.subtwo.colors);
    });

    it('should be possible to use some polymorphism on the selection.', function() {
      var altCursor = baobab.select('one', 'subtwo', 'colors');

      assert.deepEqual(altCursor.get(), colorCursor.get());
    });

    it('should be possible to use some polymorphism on the getter.', function() {
      var altCursor = baobab.select('one');

      assert.deepEqual(altCursor.get('subtwo', 'colors'), state.one.subtwo.colors);
    });

    it('should be possible to listen to updates.', function(done) {
      colorCursor.on('update', function() {
        assert.deepEqual(colorCursor.get(), ['blue', 'yellow', 'purple']);
        done();
      });

      colorCursor.push('purple');
    });
  });

  describe('Predicates', function() {
    var baobab = new Baobab(state);

    it('should be possible to tell whether cursor is root.', function() {
      assert(baobab.select('one').up().isRoot());
      assert(!baobab.select('one').isRoot());
    });

    it('should be possible to tell whether cursor is leaf.', function() {
      assert(baobab.select('primitive').isLeaf());
      assert(!baobab.select('one').isLeaf());
    });

    it('should be possible to tell whether cursor is branch.', function() {
      assert(baobab.select('one').isBranch());
      assert(!baobab.select('one').up().isBranch());
      assert(!baobab.select('primitive').isBranch());
    });
  });

  describe('Updates', function() {
    var baobab = new Baobab(state);

    var oneCursor = baobab.select('one');

    it('should throw an error when trying to push to a non-array.', function() {
      assert.throws(function() {
        oneCursor.push('test');
      }, /non-array/);
    });

    it('should throw an error when trying to unshift to a non-array.', function() {
      assert.throws(function() {
        oneCursor.unshift('test');
      }, /non-array/);
    });
  });

  describe('Traversal', function() {
    var baobab = new Baobab(state);

    var colorCursor = baobab.select(['one', 'subtwo', 'colors']),
        oneCursor = baobab.select('one');

    it('should be possible to create subcursors.', function() {
      var sub = oneCursor.select(['subtwo', 'colors']);
      assert.deepEqual(sub.get(), state.one.subtwo.colors);
    });

    it('should be possible to go up.', function() {
      var parent = colorCursor.up();
      assert.deepEqual(parent.get(), state.one.subtwo);
    });

    it('a cusor going up to root cannot go higher and returns null.', function() {
      var up = baobab.select('one').up(),
          upper = up.up();

      assert.strictEqual(upper, null);
    });

    it('should be possible to go left.', function() {
      var left = colorCursor.select(1).left();

      assert.strictEqual(left.get(), 'blue');
      assert.strictEqual(left.left(), null);

      assert.throws(function() {
        colorCursor.left();
      }, /left/);
    });

    it('should be possible to go right.', function() {
      var right = colorCursor.select(0).right();

      assert.strictEqual(right.get(), 'yellow');
      assert.strictEqual(right.right(), null);

      assert.throws(function() {
        colorCursor.right();
      }, /right/);
    });

    it('should be possible to descend.', function() {
      var list = baobab.select('list');

      assert.deepEqual(list.down().get(), [1, 2]);
      assert.strictEqual(colorCursor.down().get(), 'blue');
      assert.strictEqual(colorCursor.down().up().up().select('colors').down().get(), 'blue');
      assert.strictEqual(list.down().right().down().right().get(), 4);
      assert.strictEqual(oneCursor.down(), null);
    });

    it('should be possible to get to the leftmost item of a list.', function() {
      var listItem = baobab.select('longList', 2);

      assert.strictEqual(listItem.get(), 3);
      assert.strictEqual(listItem.leftmost().get(), 1);
    });

    it('should be possible to get to the rightmost item of a list.', function() {
      var listItem = baobab.select('longList', 2);

      assert.strictEqual(listItem.get(), 3);
      assert.strictEqual(listItem.rightmost().get(), 4);
    });
  });

  describe('Events', function() {

    it('when a parent updates, so does the child.', function(done) {
      var baobab = new Baobab(state),
          parent = baobab.select('two'),
          child = baobab.select(['two', 'firstname']);

      var count = 0;

      async.parallel({
        parent: function(next) {
          parent.on('update', function() {
            assert.deepEqual({firstname: 'Napoleon', lastname: 'Bonaparte'}, this.get());
            count++;
            next();
          });
        },
        child: function(next) {
          child.on('update', function() {
            count++;
            next();
          });
        }
      }, function() {
        assert.strictEqual(count, 2);
        done();
      });

      parent.edit({firstname: 'Napoleon', lastname: 'Bonaparte'});
    });

    it('when a child updates, so does the parent.', function(done) {
      var baobab = new Baobab(state),
          parent = baobab.select('two'),
          child = baobab.select(['two', 'firstname']);

      var count = 0;

      async.parallel({
        parent: function(next) {
          parent.on('update', function() {
            count++;
            next();
          });
        },
        child: function(next) {
          child.on('update', function() {
            count++;
            next();
          });
        }
      }, function() {
        assert.strictEqual(count, 2);
        done();
      });

      child.edit('Napoleon');
    });

    it('when a leave updates, it should not update its siblings.', function(done) {
      var baobab = new Baobab({
        node: {
          leaf1: 'hey',
          leaf2: 'ho'
        }
      });

      var parent = baobab.select('node'),
          leaf1 = parent.select('leaf1'),
          leaf2 = parent.select('leaf2');

      var count = 0,
          handler = function() {count++;};

      async.parallel({
        node: function(next) {
          parent.on('update', handler);
          setTimeout(next, 30);
        },
        leaf1: function(next) {
          leaf1.on('update', handler);
          setTimeout(next, 30);
        },
        leaf2: function(next) {
          leaf2.on('update', handler);
          setTimeout(next, 30);
        }
      }, function() {
        assert.strictEqual(count, 2);
        done();
      });

      leaf1.edit('tada');
    });

    it('should be possible to listen to the cursor\'s relevancy.', function(done) {
      var baobab = new Baobab({
        one: {
          two: 'hello'
        }
      });

      var cursor = baobab.select(['one', 'two']);

      var irrelevant = false,
          relevant = false;

      cursor.on('irrelevant', function() {
        irrelevant = true;
      });

      cursor.on('relevant', function() {
        relevant = true;
        assert(relevant && irrelevant);
        done();
      });

      baobab.set('one', {other: 'thing'});
      setTimeout(function() {
        baobab.set('one', {two: 'hello'});
      }, 30);
    });

    it('should be possible to listen to changes in an array.', function(done) {
      var baobab = new Baobab({list: ['hello', 'world']}),
          cursor = baobab.select('list', 1);

      assert.strictEqual(cursor.get(), 'world');

      cursor.on('update', function() {
        assert.strictEqual(cursor.get(), 'jacky');
        done();
      });

      cursor.edit('jacky');
    });
  });

  describe('Advanced', function() {
    it('should be possible to execute several orders within a single stack.', function(done) {
      var baobab = new Baobab({
        one: 'coco',
        two: 'koko'
      });

      baobab.set('one', 'cece');
      baobab.set('two', 'keke');

      process.nextTick(function() {
        assert.deepEqual(baobab.get(), {one: 'cece', two: 'keke'});
        done();
      });
    });

    it('should be possible to merge push-like specifications.', function(done) {
      var baobab = new Baobab({list: [1]}),
          cursor = baobab.select('list');

      cursor.push(2).push(3).unshift([-1, 0]).unshift(-2);

      process.nextTick(function() {
        assert.deepEqual(cursor.get(), [-2, -1, 0, 1, 2, 3]);
        done();
      });
    });

    it('should be possible to push several values through polymorphism.', function(done) {
      var baobab = new Baobab({colors: ['blue']}),
          colorCursor = baobab.select('colors');

      colorCursor.push('yellow', 'green');

      process.nextTick(function() {
        assert.deepEqual(colorCursor.get(), ['blue', 'yellow', 'green']);
        done();
      });
    });

    it('an upper set should correctly resolve.', function(done) {
      var baobab = new Baobab({hello: {color: 'blue'}});

      baobab.select('hello', 'color').edit('yellow');
      baobab.set('hello', 'purple');

      baobab.on('update', function() {
        assert.deepEqual(baobab.get(), {hello: 'purple'});
        done();
      });
    });

    it('a $set/$apply conflict should correctly resolve.', function(done) {
      var baobab = new Baobab({number: 1});

      baobab.set('number', 2);
      baobab.update({number: {$apply: function(d) { return d + 2; }}});

      baobab.on('update', function() {
        assert.strictEqual(baobab.get('number'), 3);
        done();
      });
    });

    it('should be possible to chain mutations.', function(done) {
      var baobab = new Baobab({number: 1}),
          inc = function(i) { return i + 1; };

      baobab.update({number: {$chain: inc}});
      baobab.update({number: {$chain: inc}});

      baobab.on('update', function() {
        assert.strictEqual(baobab.get('number'), 3);
        done();
      });
    });

    it('should be possible to shallow merge two objects.', function(done) {
      var baobab = new Baobab({o: {hello: 'world'}, string: 'test'});

      assert.throws(function() {
        baobab.select('test').merge({hello: 'moto'});
      }, /merge/);

      var cursor = baobab.select('o');
      cursor.merge({hello: 'jarl'});

      baobab.on('update', function() {
        assert.deepEqual(baobab.get('o'), {hello: 'jarl'});
        done();
      });
    });
  });
});
