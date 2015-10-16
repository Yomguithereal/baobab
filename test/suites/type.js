/**
 * Baobab Type Checker Unit Tests
 * ===============================
 */
import assert from 'assert';
import type from '../../src/type';

describe('Types', function() {
  it('type.relativePath', function() {
    const cases = [
      [[], false],
      [['hey', 'ho'], false],
      [['.', 'ho'], true],
      [['hey', '..', 'hey'], true]
    ];

    cases.forEach(([path, expected]) => assert.strictEqual(type.relativePath(path), expected));
  });
});
