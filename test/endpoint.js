/**
 * Baobab Unit Tests Endpoint
 * ===========================
 *
 * Gathering and requiring test suites.
 */
import assert from 'assert';
import util from 'util';
import type from '../src/type';

// Creating a special assertion for frozen objects
assert.isFrozen = function(v) {
  assert(
    type.primitive(v) || Object.isFrozen(v),
    util.inspect(v) + ' is not frozen.'
  );
};

// Requiring the tests
require('./suites/baobab.js');
require('./suites/cursor.js');
