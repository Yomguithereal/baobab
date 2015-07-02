/**
 * Baobab Unit Tests Endpoint
 * ===========================
 *
 * Gathering and requiring test suites.
 */

var assert = require('assert'),
    util = require('util'),
    type = require('../src/type.js');

assert.isFrozen = function(v) {
  assert(type.Primitive(v) ||
         Object.isFrozen(v), util.inspect(v) + ' is not frozen.');
};

require('./suites/helpers.js');
require('./suites/baobab.js');
require('./suites/cursor.js');
