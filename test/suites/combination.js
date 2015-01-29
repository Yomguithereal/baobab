/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
var assert = require('assert'),
    state = require('../state.js'),
    Baobab = require('../../src/baobab.js'),
    Combination = require('../../src/combination.js');

describe('Combination', function() {
  var baobab = new Baobab({list: [1, 2, 3], otherlist: [4, 5, 6], againList: [7, 8, 9]}, {autoCommit: false}),
      cursor = baobab.select('list'),
      othercursor = baobab.select('otherlist'),
      againCursor = baobab.select('againList');

  it('related cursor methods should return Combination instances.', function() {
    var or = cursor.or(othercursor),
        and = cursor.and(othercursor);

    assert(or instanceof Combination);
    assert(and instanceof Combination);

    or.release();
    and.release();
  });

  it('should fail when using combination wrongly.', function() {
    assert.throws(function() {
      cursor.or(cursor);
    }, /already/);
  });

  it('should be possible to listen to "or" combinations.', function() {
    var combination = cursor.or(othercursor),
        count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.push(4);
    baobab.commit();

    // 2
    othercursor.push(7);
    baobab.commit();

    // 3
    cursor.edit([1]);
    othercursor.edit([4]);
    baobab.commit();

    assert.strictEqual(count, 3);
    combination.release();
  });

  it('should be possible to listen to "and" combinations.', function() {
    var combination = cursor.and(othercursor),
        count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.push(4);
    baobab.commit();

    // 2
    othercursor.push(7);
    baobab.commit();

    // 3
    cursor.edit([1]);
    othercursor.edit([4]);
    baobab.commit();

    assert.strictEqual(count, 1);
    combination.release();
  });

  it('should be possible to make complex "or" combinations.', function() {
    var combination = cursor.or(othercursor).or(againCursor),
        count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.push(4);
    baobab.commit();

    // 2
    othercursor.push(7);
    baobab.commit();

    // 3
    cursor.edit([1]);
    othercursor.edit([4]);
    baobab.commit();

    // 4
    againCursor.edit([7]);
    baobab.commit();

    assert.strictEqual(count, 4);
    combination.release();
  });

  it('should be possible to make complex "and" combinations.', function() {
    var combination = cursor.and(othercursor).and(againCursor),
        count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.push(4);
    baobab.commit();

    // 2
    othercursor.push(7);
    baobab.commit();

    // 3
    cursor.edit([1]);
    othercursor.edit([4]);
    baobab.commit();

    // 4
    againCursor.edit([7]);
    baobab.commit();

    // 5
    cursor.edit([1]);
    othercursor.edit([4]);
    againCursor.edit([7]);
    baobab.commit();

    assert.strictEqual(count, 1);
    combination.release();
  });

  it('should be possible to mix combinations.', function() {
    var combination = cursor.or(othercursor).and(againCursor),
        count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.edit([1]);
    againCursor.edit([7]);
    baobab.commit();

    // 2
    againCursor.edit([7]);
    baobab.commit();

    // 3
    cursor.edit([1]);
    othercursor.edit([4]);
    baobab.commit();

    assert.strictEqual(count, 1);
    combination.release();
  });

  it('should be possible to use some polymorphism.', function() {

    // First case
    var combination = new Combination('or', [cursor, othercursor]),
        count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.push(4);
    baobab.commit();

    // 2
    othercursor.push(7);
    baobab.commit();

    // 3
    cursor.edit([1]);
    othercursor.edit([4]);
    baobab.commit();

    assert.strictEqual(count, 3);
    combination.release();

    // Second case
    combination = new Combination('or', cursor, othercursor);
    count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.push(4);
    baobab.commit();

    // 2
    othercursor.push(7);
    baobab.commit();

    // 3
    cursor.edit([1]);
    othercursor.edit([4]);
    baobab.commit();

    assert.strictEqual(count, 3);
    combination.release();
  });

  it('a single cursor combination should work as expected.', function() {
    var combination = new Combination('or', cursor),
        count = 0;

    combination.on('update', function() {
      count++;
    });

    // 1
    cursor.push(4);
    baobab.commit();

    // 2
    cursor.push(5);
    baobab.commit();

    assert.strictEqual(count, 2);
    combination.release();
  });
});
