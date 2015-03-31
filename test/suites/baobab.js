/**
 * Baobab Core Unit Tests
 * =======================
 */
var assert = require('assert'),
    state = require('../state.js'),
    Baobab = require('../../src/baobab.js'),
    Cursor = require('../../src/cursor.js'),
    async = require('async'),
    clone = require('lodash.clonedeep');

describe('Baobab API', function() {

  describe('Basics', function() {
    var baobab = new Baobab(state);

    it('should be possible to retrieve full data.', function() {
      var data = baobab.get();
      assert.deepEqual(data, state);
    });

    it('should be possible to retrieve nested data.', function() {
      var colors = baobab.get(['one', 'subtwo', 'colors']);
      assert.deepEqual(colors, state.one.subtwo.colors);

      // Polymorphism
      var primitive = baobab.get('primitive');
      assert.strictEqual(primitive, 3);
    });

    it('should be possible to get data from both maps and lists.', function() {
      var yellow = baobab.get(['one', 'subtwo', 'colors', 1]);

      assert.strictEqual(yellow, 'yellow');
    });

    it('should return undefined when data is not to be found through path.', function() {
      var inexistant = baobab.get(['no']);
      assert.strictEqual(inexistant, undefined);

      // Nesting
      var nestedInexistant = baobab.get(['no', 'no']);
      assert.strictEqual(nestedInexistant, undefined);
    });

    it('should be possible to retrieve items with a function in path.', function() {
      var yellow = baobab.get('one', 'subtwo', 'colors', function(i) { return i === 'yellow'; });

      assert.strictEqual(yellow, 'yellow');
    });

    it('should be possible to retrieve items with a descriptor object.', function() {
      var firstItem = baobab.get('items', {id: 'one'}),
          secondItem = baobab.get('items', {id: 'two', user: {name: 'John'}}),
          thirdItem = baobab.get('items', {id: ['one', 'two']});

      assert.deepEqual(firstItem, {id: 'one'});
      assert.deepEqual(secondItem, {id: 'two', user: {name: 'John', surname: 'Talbot'}});
      assert.deepEqual(firstItem, {id: 'one'});
    });

    it('should not fail when retrieved data is null on the path.', function() {
      var nullValue = baobab.get('setLater');
      assert.strictEqual(nullValue, null);

      var inexistant = baobab.get('setLater', 'a');
      assert.strictEqual(inexistant, undefined);
    });

    it('should throw an error when trying to instantiate an baobab with incorrect data.', function() {
      assert.throws(function() {
        new Baobab(undefined);
      }, /invalid data/);
    });

    it('selecting data in the baobab should return a cursor.', function() {
      assert(baobab.select(['one']) instanceof Cursor);
    });

    it('should be possible to listen to update events.', function(done) {
      baobab.on('update', function(e) {
        assert.deepEqual(e.data.log, [['one', 'subtwo', 'colors']]);
        done();
      });

      baobab.update({one: {subtwo: {colors: {$push: 'purple'}}}});
    });

    it('should only fire updates once when committing synchronously but when not in synchronous mode.', function(done) {
      var tree = new Baobab({hello: 'world'}),
          count = 0;

      tree.on('update', function() {
        count++;
      });

      tree.set('hello', 'tada').commit();

      setTimeout(function() {
        assert.strictEqual(count, 1);
        assert.strictEqual(tree.get('hello'), 'tada');
        done();
      }, 30);
    });

    it('should be possible to instantiate without the "new" keyword.', function() {
      var special = Baobab(state);

      assert(special.get('two'), baobab.get('two'));
    });
  });

  describe('Updates', function() {

    it('should be possible to set a key using a path rather than a key.', function() {
      var baobab = new Baobab(state, {asynchronous: false});

      baobab.set(['two', 'age'], 34);
      assert.strictEqual(baobab.get().two.age, 34);
    });

    it('should be possible to set a key at an nonexistent path.', function() {
      var baobab = new Baobab(state, {asynchronous: false});

      baobab.set(['nonexistent', 'key'], 'hello');
      assert.strictEqual(baobab.get().nonexistent.key, 'hello');
    });

    it('should be possible to set a key using a dynamic path.', function() {
      var baobab = new Baobab(state, {asynchronous: false});

      baobab.set(['items', {id: 'two'}, 'user', 'age'], 34);
      assert.strictEqual(baobab.get().items[1].user.age, 34);
    });

    it('should fail when setting a nonexistent dynamic path.', function() {
      var baobab = new Baobab(state, {asynchronous: false});

      assert.throws(function() {
        baobab.set(['items', {id: 'four'}, 'user', 'age'], 34);
      }, /solve/);
    });
  });

  describe('Advanced', function() {

    it('should be possible to release a tree.', function() {
      var baobab = new Baobab(state),
          one = baobab.select('one'),
          two = baobab.select('two');

      baobab.on('update', Function.prototype);
      one.on('update', Function.prototype);
      two.on('update', Function.prototype);

      one.release();
      baobab.release();

      assert(baobab.data === undefined);
    });

    it('the tree should shift references on updates.', function() {
      var list = [1],
          baobab = new Baobab({list: list}, {asynchronous: false});

      baobab.select('list').push(2);
      assert.deepEqual(baobab.get('list'), [1, 2]);
      assert(list !== baobab.get('list'));
    });

    it('the tree should also shift parent references.', function() {
      var shiftingTree = new Baobab({root: {admin: {items: [1], other: [2]}}}, {asynchronous: false});

      var shiftingOriginal = shiftingTree.get();

      shiftingTree.select('root', 'admin', 'items').push(2);

      assert.deepEqual(shiftingTree.get('root', 'admin', 'items'), [1, 2]);

      assert(shiftingTree.get() !== shiftingOriginal);
      assert(shiftingTree.get().root !== shiftingOriginal.root);
      assert(shiftingTree.get().root.admin !== shiftingOriginal.root.admin);
      assert(shiftingTree.get().root.admin.items !== shiftingOriginal.root.admin.items);
      assert(shiftingTree.get().root.admin.other === shiftingOriginal.root.admin.other);
    });
  });

  describe('Options', function() {
    it('should be possible to commit changes immediately.', function() {
      var baobab = new Baobab({hello: 'world'}, {asynchronous: false});
      baobab.set('hello', 'you');
      assert.strictEqual(baobab.get('hello'), 'you');
    });

    it('should be possible to let the user commit himself.', function(done) {
      var baobab = new Baobab({number: 1}, {autoCommit: false});
      baobab.set('number', 2);

      setTimeout(function() {
        assert.strictEqual(baobab.get('number'), 1);
        baobab.commit();
        setTimeout(function() {
          assert.strictEqual(baobab.get('number'), 2);
          done();
        }, 0);
      }, 0);
    });
  });
});
