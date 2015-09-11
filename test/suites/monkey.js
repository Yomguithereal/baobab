/**
 * Baobab Monkey Unit Tests
 * =========================
 */
import assert from 'assert';
import Baobab, {monkey} from '../../src/baobab';
import {MonkeyDefinition} from '../../src/monkey';
import type from '../../src/type';
import _ from 'lodash';

const noop = Function.prototype;

const getExampleState = () => ({
  data: {
    messages: [
      {from: 'John', message: 'Hey'},
      {from: 'Jack', message: 'Ho'}
    ],
    fromJohn: monkey({
      cursors: {
        messages: ['data', 'messages']
      },
      get: function({messages}) {
        return _.filter(messages, {from: 'John'});
      }
    })
  }
});

describe('Monkeys', function() {

  it('the monkey definition type should work correctly.', function() {
    const validObject = {cursors: {a: ['one']}, get: noop},
          validArray = [['one'], noop],
          invalidObject = {hello: 'world'},
          invalidArray = ['so crisp!'];

    assert.strictEqual(type.monkeyDefinition(validObject), 'object');
    assert.strictEqual(type.monkeyDefinition(validArray), 'array');
    assert.strictEqual(type.monkeyDefinition(invalidObject), null);
    assert.strictEqual(type.monkeyDefinition(invalidArray), null);
  });

  it('should be possible to create monkey definitions from objects.', function() {
    const objectNode = monkey({cursors: {a: ['one']}, get: noop}),
          arrayNode = monkey([['one'], noop]);

    assert(objectNode instanceof MonkeyDefinition);
    assert(arrayNode instanceof MonkeyDefinition);

    assert.throws(function() {
      monkey({hello: 'world'});
    }, /invalid/);
  });

  it('should be possible to create facets at instantiation.', function() {
    const tree = new Baobab(getExampleState());

    assert.deepEqual(
      tree.get('data', 'fromJohn'),
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
        custom: monkey(
          ['data', 'messages'],
          ['data', 'greeting'],
          function(messages, greeting) {
            return greeting + ' ' + messages[0].from;
          }
        )
      }
    });

    assert.strictEqual(tree.get('data', 'custom'), 'Hello John');
  });

  it('computed data should be immutable.', function() {
    const tree = new Baobab(getExampleState()),
          computedData = tree.get('data', 'fromJohn');

    assert.isFrozen(computedData);
  });
});
