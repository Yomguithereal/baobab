/**
 * Baobab Watchers Unit Tests
 * ===========================
 */
import assert from 'assert';
import Baobab, {monkey} from '../../src/baobab';

describe('Watchers', function() {

  it('should be possible to track some paths within the tree.', function() {
    const tree = new Baobab({
      data: {
        greeting: 'Hello',
        name: 'Jack'
      }
    }, {asynchronous: false});

    const watcher = tree.watch({
      greeting: ['data', 'greeting'],
      name: ['data', 'name']
    });

    let count = 0,
        inc = () => count++;

    watcher.on('update', inc);

    assert.deepEqual(watcher.get(), {
      greeting: 'Hello',
      name: 'Jack'
    });

    tree.set(['data', 'name'], 'John');
    tree.set('data', {});
    tree.set('hey', 'ho');

    assert.strictEqual(count, 2);
  });

  it('should be possible to give cursors to a watcher.', function() {
    const tree = new Baobab({
      data: {
        greeting: 'Hello',
        name: 'Jack'
      }
    }, {asynchronous: false});

    const watcher = tree.watch({
      greeting: tree.select(['data', 'greeting']),
      name: tree.select(['data', 'name'])
    });

    let count = 0,
        inc = () => count++;

    watcher.on('update', inc);

    assert.deepEqual(watcher.get(), {
      greeting: 'Hello',
      name: 'Jack'
    });

    tree.set(['data', 'name'], 'John');
    tree.set('data', {});
    tree.set('hey', 'ho');

    assert.strictEqual(count, 2);
  });

  it('should be possible to use dynamic paths.', function() {
    const tree = new Baobab({
      data: [{id: 0, txt: 'Hello'}, {id: 1, txt: 'World'}]
    }, {asynchronous: false});

    const watcher = tree.watch({
      one: ['data', {id: 0}, 'txt'],
      two: ['data', x => x.id === 1, 'txt']
    });

    let count = 0,
        inc = () => count++;

    watcher.on('update', inc);

    assert.deepEqual(watcher.get(), {one: 'Hello', two: 'World'});

    tree.set(['data', 0, 'txt'], 'Hi');
    tree.set('data', {});
    tree.set('hey', 'ho');

    assert.strictEqual(count, 1);
  });
});
