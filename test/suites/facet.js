/**
 * Baobab Facet Unit Tests
 * ========================
 */
import assert from 'assert';
import Baobab from '../../src/baobab';
import _ from 'lodash';

describe('Facets', function() {

  it('should be impossible to update a read-only path.', function() {
    const tree = new Baobab();

    assert.throws(function() {
      tree.set(['$computed', 'test'], 'Hey');
    }, /read-only/);
  });

  return;

  it('the facet type should work correctly.', function() {

  });

  it('should be possible to create facets at instantiation.', function() {
    const tree = new Baobab({
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
    });

    // console.log(require('util').inspect(tree._computedDataIndex, {depth: null}));
  });
});
