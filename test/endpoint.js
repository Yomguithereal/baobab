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

assert.isNotFrozen = function(v) {
  assert(
    type.primitive(v) || !Object.isFrozen(v),
    util.inspect(v) + ' is frozen.'
  );
};

// Requiring the tests
require('./suites/helpers.js');
require('./suites/type.js');
require('./suites/baobab.js');
require('./suites/cursor.js');
require('./suites/monkey.js');
require('./suites/watcher.js');
