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
});
