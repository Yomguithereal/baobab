/**
 * Baobab Watchers Unit Tests
 * ===========================
 */
import assert from 'assert';
import Baobab, {monkey} from '../../src/baobab';
import Cursor from '../../src/cursor';

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

  it('should be possible to watch over monkeys.', function(done) {
    const tree = new Baobab({
      data: {
        colors: ['yellow', 'blue'],
        phrase: monkey(['data', 'colors', 1], (color) => color + ' jasmine')
      }
    });

    const watcher = tree.watch({
      phrase: ['data', 'phrase']
    });

    watcher.on('update', function() {
      assert.deepEqual(watcher.get(), {phrase: 'yellow jasmine'});
      done();
    });

    tree.unshift(['data', 'colors'], 'purple');
  });

  it('should be possible to watch over paths beneath monkeys.', function(done) {
    const tree = new Baobab({
      object: {
        hello: 'Jack'
      },
      dynamic: Baobab.monkey(['object'], o => o)
    });

    const watcher = tree.watch({d: ['dynamic', 'hello']});

    watcher.on('update', function() {
      assert.deepEqual(watcher.get(), {d: 'John'});
      done();
    });

    tree.set('object', {hello: 'John'});
  });

  it('should be possible to retrieve a mapping of the watcher\'s cursors.', function() {
    const tree = new Baobab({
      one: 1,
      two: 2
    });

    const watcher = tree.watch({
      one: ['one'],
      two: tree.select('two')
    });

    const cursors = watcher.getCursors();

    assert(Object.keys(cursors).length, 2);
    assert(Object.keys(cursors).every(k => cursors[k] instanceof Cursor));

    assert.strictEqual(cursors.one.get(), 1);
    assert.strictEqual(cursors.two.get(), 2);
  });
});
