/**
 * Baobab Core Unit Tests
 * =======================
 */
import assert from 'assert';
import Baobab from '../../src/baobab';
import state from '../state';

describe('Baobab API', function() {

  /**
   * Testing the very basics of the API like tree instantiation.
   */
  describe('Basics', function() {

    it('should throw an error when trying to instantiate an baobab with incorrect data.', function() {
      assert.throws(function() {
        new Baobab(undefined);
      }, /invalid data/);
    });
  });
});
