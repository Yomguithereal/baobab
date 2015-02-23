/**
 * Baobab Core Unit Tests
 * =======================
 */
var assert = require('assert'),
    state = require('../state.js'),
    Typology = require('typology'),
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

  describe('Options', function() {
    it('should be possible to commit changes immediately.', function() {
      var baobab = new Baobab({hello: 'world'}, {asynchronous: false});
      baobab.set('hello', 'you');
      assert.strictEqual(baobab.get('hello'), 'you');
    });

    it('should be possible to let the user commit himself.', function(done) {
      var baobab = new Baobab({number: 1}, {autoCommit: false});
      baobab.set('number', 2);

      process.nextTick(function() {
        assert.strictEqual(baobab.get('number'), 1);
        baobab.commit();
        process.nextTick(function() {
          assert.strictEqual(baobab.get('number'), 2);
          done();
        });
      });
    });

    it('should be possible to serve cloned data.', function() {
      var baobab1 = new Baobab({hello: 'world'}),
          baobab2 = new Baobab({hello: 'world'}, {clone: true});

      assert(baobab1.get() === baobab1.data);
      assert(baobab1.clone() !== baobab1.data);
      assert.deepEqual(baobab1.clone(), baobab1.data);
      assert(baobab2.get() !== baobab2.data);
      assert(baobab2.reference() === baobab2.data);
      assert.deepEqual(baobab2.get(), {hello: 'world'});
    });

    it('should be possible to shunt the singleton cursors.', function() {
      var baobab1 = new Baobab({hello: 'world'}),
          baobab2 = new Baobab({hello: 'world'}, {cursorSingletons: false});

      assert(baobab1.select('hello') === baobab1.select('hello'));
      assert(baobab2.select('hello') !== baobab2.select('hello'));
    });

    it('should be possible to provide your own cloning function to the tree.', function() {
      var baobab = new Baobab({hello: 'world'}, {cloningFunction: clone});

      assert(baobab._cloner === clone);
      assert.deepEqual(baobab.clone(), baobab.data);
    });

    it('should be possible to tell the tree to shift references on updates.', function() {
      var list = [1],
          baobab = new Baobab({list: list}, {shiftReferences: true, asynchronous: false});

      baobab.select('list').push(2);
      assert.deepEqual(baobab.get('list'), [1, 2]);
      assert(list !== baobab.get('list'));
    });

    it('should also shift parent references.', function() {
      var tree = new Baobab({root: {admin: {items: [1], other: [2]}}}, {asynchronous: false}),
          shiftingTree = new Baobab({root: {admin: {items: [1], other: [2]}}}, {shiftReferences: true, asynchronous: false});

      var original = tree.reference(),
          shiftingOriginal = shiftingTree.reference();

      tree.select('root', 'admin', 'items').push(2);
      shiftingTree.select('root', 'admin', 'items').push(2);

      assert.deepEqual(tree.reference('root', 'admin', 'items'), [1, 2]);
      assert.deepEqual(shiftingTree.reference('root', 'admin', 'items'), [1, 2]);

      assert(tree.reference() === original);
      assert(tree.reference().root === original.root);
      assert(tree.reference().root.admin === original.root.admin);
      assert(tree.reference().root.admin.items === original.root.admin.items);
      assert(tree.reference().root.admin.other === original.root.admin.other);

      assert(shiftingTree.reference() !== shiftingOriginal);
      assert(shiftingTree.reference().root !== shiftingOriginal.root);
      assert(shiftingTree.reference().root.admin !== shiftingOriginal.root.admin);
      assert(shiftingTree.reference().root.admin.items !== shiftingOriginal.root.admin.items);
      assert(shiftingTree.reference().root.admin.other === shiftingOriginal.root.admin.other);
    });
  });

  describe('Custom typology', function() {

    it('a baobab should have an internal typology.', function() {
      var baobab = new Baobab({hello: 'world'});
      assert(baobab.typology instanceof Typology);
    });

    it('should be possible to pass a custom typology at instantiation.', function() {
      var typology = new Typology({user: '?object'}),
          baobab = new Baobab({hello: 'world'}, {typology: typology});

      assert(baobab.typology instanceof Typology);
      assert(baobab.typology.isValid('user'));
    });

    it('should be possible to pass an object defining custom types at instantiation.', function() {
      var definitions = {user: '?object'},
          baobab = new Baobab({hello: 'world'}, {typology: definitions});

      assert(baobab.typology instanceof Typology);
      assert(baobab.typology.isValid('user'));
    });

    it('invalid initial data should throw an error.', function() {

      assert.throws(function() {
        new Baobab(
          {hello: 'world'},
          {
            validate: {hello: 'word'},
            typology: {word: 'object'}
          }
        );
      }, /Expected/);
    });

    it('should emit an "invalid" event when data validation fails on commit.', function(done) {
      var baobab = new Baobab({hello: 'world'}, {validate: {hello: 'string'}});

      baobab.on('invalid', function(e) {
        done();
      });
      baobab.set('hello', 42);
    });
  });

  describe('History', function() {

    it('should be possible to record passed states.', function(done) {
      var baobab = new Baobab({name: 'Maria'}, {maxHistory: 1});

      baobab.set('name', 'Estelle');

      process.nextTick(function() {
        assert(baobab.hasHistory());
        assert.deepEqual(baobab.getHistory(), [{log: [['name']], data: {name: 'Maria'}}]);
        done();
      });
    });

    it('should throw an error if trying to undo without history.', function() {
      var baobab = new Baobab({hello: 'world'});

      assert.throws(function() {
        baobab.undo();
      }, /no history/);
    });

    it('should be possible to go back in time.', function(done) {
      var baobab = new Baobab({name: 'Maria'}, {maxHistory: 2});

      async.series([
        function(next) {
          baobab.set('name', 'Estelle');
          process.nextTick(next);
        },
        function(next) {
          assert(baobab.hasHistory());
          baobab.undo();
          assert.deepEqual(baobab.get(), {name: 'Maria'});
          done();
        }
      ], function() {
        done();
      });
    });
  });
});
