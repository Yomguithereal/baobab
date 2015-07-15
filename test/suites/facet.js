/**
 * Baobab Facet Unit Tests
 * ========================
 */
import assert from 'assert';
import Baobab from '../../src/baobab';
import type from '../../src/type';
import _ from 'lodash';

const noop = Function.prototype;

const exampleState = {
  data: {
    messages: [
      {from: 'John', message: 'Hey'},
      {from: 'Jack', message: 'Ho'}
    ],
    $fromJohn: {
      cursors: {
        messages: ['data', 'messages']
      },
      get: function({messages}) {
        return _.filter(messages, {from: 'John'});
      }
    }
  }
};

describe('Facets', function() {

  it('should be impossible to update a read-only path.', function() {
    const tree = new Baobab();

    assert.throws(function() {
      tree.set(['$computed', 'test'], 'Hey');
    }, /read-only/);
  });

  it('the facet type should work correctly.', function() {
    const validObject = {cursors: {a: ['one']}, get: noop},
          validArray = [['one'], noop],
          invalidObject = {hello: 'world'},
          invalidArray = ['so crisp!'];

    assert.strictEqual(type.facetDefinition(validObject), 'object');
    assert.strictEqual(type.facetDefinition(validArray), 'array');
    assert.strictEqual(type.facetDefinition(invalidObject), null);
    assert.strictEqual(type.facetDefinition(invalidArray), null);
  });

  it('should be possible to create facets at instantiation.', function() {
    const tree = new Baobab(exampleState);

    assert.deepEqual(
      tree.get('data', '$fromJohn'),
      [{from: 'John', message: 'Hey'}]
    );
  });

  it('should be possible to create facets using a shorthand.', function() {
    const tree = new Baobab({
      data: {
        messages: [
          {from: 'John', message: 'Hey'},
          {from: 'Jack', message: 'Ho'}
        ],
        greeting: 'Hello',
        $custom: [
          ['data', 'messages'],
          ['data', 'greeting'],
          function(messages, greeting) {
            return greeting + ' ' + messages[0].from;
          }
        ]
      }
    });

    assert.strictEqual(tree.get('data', '$custom'), 'Hello John');
  });

  it('computed data should be immutable.', function() {
    const tree = new Baobab(exampleState),
          computedData = tree.get('data', '$fromJohn');

    assert.throws(function() {
      computedData[0] = 'test';
    }, Error);
  });

  it('should be possible to access data from beyond facets.', function() {
    const tree = new Baobab(exampleState);

    assert.strictEqual(
      tree.get('data', '$fromJohn', 0, 'message'),
      'Hey'
    );
  });

  it('facets should update when their dependencies update.', function() {
    const tree = new Baobab(exampleState);

    assert.deepEqual(
      tree.get('data', '$fromJohn'),
      [{from: 'John', message: 'Hey'}]
    );

    tree.push(['data', 'messages'], {from: 'John', message: 'Success!'});

    assert.deepEqual(
      tree.get('data', '$fromJohn'),
      [{from: 'John', message: 'Hey'}, {from: 'John', message: 'Success!'}]
    );
  });

  it('cursors with a facet in the path should work correctly.', function(done) {
    const tree = new Baobab(exampleState),
          cursor = tree.select('data', '$fromJohn');

    cursor.on('update', e => done());

    assert.deepEqual(
      cursor.get(),
      [{from: 'John', message: 'Hey'}]
    );

    tree.push(['data', 'messages'], {from: 'John', message: 'Success!'});

    assert.deepEqual(
      cursor.get(),
      [{from: 'John', message: 'Hey'}, {from: 'John', message: 'Success!'}]
    );
  });

  it('cursors should be able to listen to beyond facets.', function() {
    const tree = new Baobab(exampleState),
          cursor = tree.select('data', '$fromJohn', 0, 'message');

    assert.strictEqual(
      cursor.get(),
      'Hey'
    );
  });

  it('getting a higher key should correctly solve computed data.', function() {
    const tree = new Baobab(exampleState);

    assert.deepEqual(
      tree.get(),
      {
        data: {
          messages: [
            {from: 'John', message: 'Hey'},
            {from: 'Jack', message: 'Ho'}
          ],
          $fromJohn: [{from: 'John', message: 'Hey'}]
        }
      }
    );

    assert.deepEqual(
      tree.get('data'),
      {
        messages: [
          {from: 'John', message: 'Hey'},
          {from: 'Jack', message: 'Ho'}
        ],
        $fromJohn: [{from: 'John', message: 'Hey'}]
      }
    );
  });

  it('should be possible to serialize the tree or some of its parts.', function() {
    const tree = new Baobab(exampleState);

    assert.deepEqual(
      tree.serialize(),
      {
        data: {
          messages: [
            {from: 'John', message: 'Hey'},
            {from: 'Jack', message: 'Ho'}
          ]
        }
      }
    );

    assert.deepEqual(
      tree.serialize('data'),
      {
        messages: [
          {from: 'John', message: 'Hey'},
          {from: 'Jack', message: 'Ho'}
        ]
      }
    );

    assert.deepEqual(
      tree.select('data').serialize(),
      {
        messages: [
          {from: 'John', message: 'Hey'},
          {from: 'Jack', message: 'Ho'}
        ]
      }
    );
  });

  it('should work recursively.', function(done) {
    const inc = x => x + 1;

    const tree = new Baobab({
      data: {
        number: 1
      },
      computed: {
        $one: [['data', 'number'], inc],
        $two: [['computed', '$one'], inc]
      }
    });

    assert.strictEqual(tree.get('computed', '$one'), 2);
    assert.strictEqual(tree.get('computed', '$two'), 3);

    tree.select('data', 'number').on('update', () => {
      assert.strictEqual(tree.get('computed', '$one'), 6);
      assert.strictEqual(tree.get('computed', '$two'), 7);
      done();
    });

    tree.set(['data', 'number'], 5);
  });

  it('data retrieved through facets should be immutable by default.', function() {
    const tree = new Baobab(exampleState),
          data = tree.get();

    assert.isFrozen(data.data);
    assert.isFrozen(data.data.$fromJohn);
    assert.isFrozen(data.data.$fromJohn[0]);

    const mutableTree = new Baobab(_.cloneDeep(exampleState), {immutable: false}),
          mutableData = mutableTree.get();

    assert.isNotFrozen(mutableData.data);
    assert.isNotFrozen(mutableData.data.$fromJohn);
    assert.isNotFrozen(mutableData.data.$fromJohn[0]);
  });

  it('should be possible to change facets at runtime.', function() {
    const tree = new Baobab(exampleState, {asynchronous: false});

    tree.set(['data', '$fromJohn'], {get: () => 'Hey'});

    assert.strictEqual(tree.get('data', '$fromJohn'), 'Hey');
  });
});

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

  it('should be possible to use the array shorthand.', function() {
    const tree = new Baobab({
      data: {
        greeting: 'Hello',
        name: 'Jack'
      }
    }, {asynchronous: false});

    const watcher = tree.watch([
      ['data', 'greeting'],
      ['data', 'name']
    ]);

    let count = 0,
        inc = () => count++;

    watcher.on('update', inc);

    assert.deepEqual(watcher.get(), ['Hello', 'Jack']);

    tree.set(['data', 'name'], 'John');
    tree.set('data', {});
    tree.set('hey', 'ho');

    assert.strictEqual(count, 2);
  });

  it('should be possible to use dynamic paths.', function() {
    const tree = new Baobab({
      data: [{id: 0, txt: 'Hello'}, {id: 1, txt: 'World'}]
    }, {asynchronous: false});

    const watcher = tree.watch([
      ['data', {id: 0}, 'txt'],
      ['data', x => x.id === 1, 'txt']
    ]);

    let count = 0,
        inc = () => count++;

    watcher.on('update', inc);

    assert.deepEqual(watcher.get(), ['Hello', 'World']);

    tree.set(['data', 0, 'txt'], 'Hi');
    tree.set('data', {});
    tree.set('hey', 'ho');

    assert.strictEqual(count, 1);
  });
});
