/**
 * Baobab Helpers Unit Tests
 * ==========================
 */
var assert = require('assert'),
    state = require('../state.js'),
    Baobab = require('../../src/baobab.js'),
    Watcher = require('../../src/watcher.js');

describe('Watcher', function() {
  var baobab = new Baobab({list: [1, 2, 3], otherlist: [4, 5, 6], unrelated: 0}, {autoCommit: false}),
      list = baobab.select('list'),
      other = baobab.select('otherlist'),
      unrelated = baobab.select('unrelated');

  it('baobab.watch should return a watcher instance.', function() {
    assert(baobab.watch([['list']]) instanceof Watcher);
  });

  it('should fire correctly.', function() {
    var count = 0,
        inc = function() {count++;};

    var watcher = baobab.watch([['list'], ['otherlist']]);
    watcher.on('update', inc);

    list.push(4);
    baobab.commit();

    assert.strictEqual(count, 1);

    unrelated.set(1);
    baobab.commit();

    assert.strictEqual(count, 1);

    other.push(4);
    baobab.commit();

    assert.strictEqual(count, 2);

    list.push(5);
    other.push(5);
    baobab.commit();

    assert.strictEqual(count, 3);

    watcher.release();
  });
});
