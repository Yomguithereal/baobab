/**
 * Baobab Monkey Unit Tests
 * =========================
 */
import assert from 'assert';
import Baobab, {monkey} from '../../src/baobab';
import {Monkey, MonkeyDefinition} from '../../src/monkey';
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
      get({messages}) {
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

  it('should be possible to create monkeys at instantiation.', function() {
    const tree = new Baobab(getExampleState());

    assert.deepEqual(
      tree.get('data', 'fromJohn'),
      [{from: 'John', message: 'Hey'}]
    );
  });

  it('should be possible to create monkeys using a shorthand.', function() {
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

  it('should be possible to use path polymorphism.', function() {
    const tree = new Baobab({
      name: 'John',
      greeting: monkey('name', name => `Hello ${name}!`)
    });

    assert.strictEqual(tree.get('greeting'), 'Hello John!');
  });

  it('should be possible to get monkeys from the tree.', function() {
    const tree = new Baobab({
      dynamic: monkey(() => 'John')
    });

    assert(tree.getMonkey('dynamic') instanceof Monkey);
    assert(tree.getMonkey('whatever') === null);
  });

  it('computed data should be immutable.', function() {
    const tree = new Baobab(getExampleState()),
          computedData = tree.get('data', 'fromJohn');

    assert.isFrozen(computedData);
  });

  it('should be possible to access data from beyond monkeys.', function() {
    const tree = new Baobab(getExampleState());

    assert.strictEqual(
      tree.get('data', 'fromJohn', 0, 'message'),
      'Hey'
    );
  });

  it('monkeys should update when their dependencies update.', function() {
    const tree = new Baobab(getExampleState());

    assert.deepEqual(
      tree.get('data', 'fromJohn'),
      [{from: 'John', message: 'Hey'}]
    );

    tree.push(['data', 'messages'], {from: 'John', message: 'Success!'});

    assert.deepEqual(
      tree.get('data', 'fromJohn'),
      [{from: 'John', message: 'Hey'}, {from: 'John', message: 'Success!'}]
    );
  });

  it('monkeys should be able to work with dynamic paths.', function() {
    const tree = new Baobab(
      {
        list: [{id: 1, name: 'John'}],
        greeting: monkey({
          cursors: {
            person: ['list', {id: 1}]
          },
          get({person: {name}}) {
            return `Hello ${name}`;
          }
        })
      }
    );

    assert.strictEqual(tree.get('greeting'), 'Hello John');

    tree.set(['list', 0, 'name'], 'Jack');

    assert.strictEqual(tree.get('greeting'), 'Hello Jack');
  });

  it('cursors with a monkey in the path should work correctly.', function(done) {
    const tree = new Baobab(getExampleState()),
          cursor = tree.select('data', 'fromJohn');

    cursor.on('update', () => done());

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

  it('cursors should be able to listen to beyond monkeys.', function() {
    const tree = new Baobab(getExampleState()),
          cursor = tree.select('data', 'fromJohn', 0, 'message');

    assert.strictEqual(
      cursor.get(),
      'Hey'
    );
  });

  it('getting a higher key should correctly solve computed data.', function() {
    const tree = new Baobab(getExampleState());

    assert.deepEqual(
      tree.get(),
      {
        data: {
          messages: [
            {from: 'John', message: 'Hey'},
            {from: 'Jack', message: 'Ho'}
          ],
          fromJohn: [{from: 'John', message: 'Hey'}]
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
        fromJohn: [{from: 'John', message: 'Hey'}]
      }
    );
  });

  it('should be possible to serialize the tree or some of its parts.', function() {
    const tree = new Baobab(getExampleState());

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

  it('should work recursively.', function(done) {
    const inc = x => x + 1;

    const tree = new Baobab({
      data: {
        number: 1
      },
      computed: {
        one: monkey(['data', 'number'], inc),
        two: monkey(['computed', 'one'], inc)
      }
    });

    assert.strictEqual(tree.get('computed', 'one'), 2);
    assert.strictEqual(tree.get('computed', 'two'), 3);

    tree.select('data', 'number').on('update', () => {
      assert.strictEqual(tree.get('computed', 'one'), 6);
      assert.strictEqual(tree.get('computed', 'two'), 7);
      done();
    });

    tree.set(['data', 'number'], 5);
  });

  it('should handle selections beyond monkeys and recursivity.', function() {
    const tree = new Baobab({
      defaultLocale: 'en',
      locale: monkey(
        ['user', 'locale'],
        ['defaultLocale'],
        (userLocale, locale) => {
          return userLocale || locale;
        }
      ),
      userId: null,
      user: monkey(
        ['users'],
        ['userId'],
        (users, id) => users[id]
      ),
      users: {}
    });

    assert.strictEqual(tree.get('locale'), 'en');

    tree.set(['users', 1], {id: 1, locale: 'de'});
    tree.set('userId', 1);
    tree.commit();

    assert.strictEqual(tree.get('users', 1, 'locale'), 'de');
    assert.strictEqual(tree.get('user', 'locale'), 'de');
    assert.strictEqual(tree.get('locale'), 'de');
  });

  it('should even work with complex recursivity.', function() {
    const tree = new Baobab({
      activePageNumber: 1,
      products: {
        genes: {
          howManyGenes: null,
          customVectorRequired: true,
          completed: monkey(
            ['.', 'customVectorRequired'],
            ['.', 'howManyGenes'],
            (customVectorRequired, howManyGenes) => (
              customVectorRequired !== null &&
              howManyGenes !== null
            )
          )
        }
      },
      pages: {
        UserInfoPage: {
          number: 0,
          completed: false
        },
        SelectProductPage: {
          number: 1,
          completed: monkey(
            ['products'],
            products => products.genes.completed
          )
        }
      },
      currentPage: monkey(
        ['activePageNumber'],
        ['pages'],
        (activePageNumber, pages) => {
          return _.find(pages, page => page.number === activePageNumber);
        }
      )
    }, {asynchronous: false, lazyMonkeys: false});

    assert(!tree.get('currentPage', 'completed'));

    tree.set(['products', 'genes', 'howManyGenes'], 1);

    assert.deepEqual(tree.get(['pages', 'SelectProductPage']), {
      completed: true,
      number: 1
    });

    assert(tree.get('currentPage', 'completed'));
  });

  it('recursivity should take updates into account.', function() {
    let count = 0;

    const tree = new Baobab({
      rows: [1, 2, 3, 4, 5],
      visibleRows: {start: 0, end: 0},
      rowLength: monkey([
        ['rows'],
        function(rows) {
          return rows.length;
        }
      ]),
      specialRows: monkey([
        ['rows'],
        function(rows) {
          return rows;
        }
      ]),
      visibleRowsData: monkey([
        ['specialRows'],
        ['visibleRows'],
        function(specialRows, visibleRows) {
          count++;
          return specialRows.slice(visibleRows.start, visibleRows.end);
        }
      ]),
    }, {asynchronous: false});

    tree.get('visibleRowsData');
    tree.select('visibleRows').set({start: 1, end: 4});
    tree.get('visibleRowsData');

    assert.strictEqual(count, 2);
  });

  it('data retrieved through facets should be immutable by default.', function() {
    const tree = new Baobab(getExampleState()),
          data = tree.get();

    assert.isFrozen(data.data);
    assert.isFrozen(data.data.fromJohn);
    assert.isFrozen(data.data.fromJohn[0]);

    const mutableTree = new Baobab(getExampleState(), {immutable: false}),
          mutableData = mutableTree.get();

    assert.isNotFrozen(mutableData.data);
    assert.isNotFrozen(mutableData.data.fromJohn);
    assert.isNotFrozen(mutableData.data.fromJohn[0]);
  });

  it('should warn the user when he attempts to update a path beneath a monkey.', function() {
    const tree = new Baobab(getExampleState());

    assert.throws(function() {
      tree.set(['data', 'fromJohn', 0, 'text'], 'Shawarma');
    }, /read-only/);
  });

  it('should be possible to add new monkeys at runtime.', function() {
    const tree = new Baobab(
      {
        data: {
          colors: ['yellow', 'blue', 'purple']
        }
      },
      {asynchronous: false}
    );

    const final = monkey(['data', 'colors'], cl => cl.filter(c => c.slice(-1)[0] === 'e')),
          leading = monkey(['data', 'colors'], cl => cl.filter(c => c[0] === 'y'));

    tree.set(['data', 'filtered'], final);

    assert.deepEqual(tree.get('data', 'filtered'), ['blue', 'purple']);

    tree.set(['data', 'computed', 'leader'], leading);

    assert.deepEqual(tree.get('data', 'computed', 'leader'), ['yellow']);
  });

  it('should be lazy by default.', function() {
    let count = 0;

    const tree = new Baobab({
      items: [],
      string: monkey(['items'], function(items) {
        count++;
        return items.join(',');
      })
    });

    const cursor = tree.select('items');
    cursor.push(1);
    cursor.push(2);

    assert.strictEqual(count, 0);

    cursor.push(3);
    assert.strictEqual(tree.get('string'), '1,2,3');
    assert.strictEqual(count, 1);
  });

  describe('should be possible to replace monkeys at runtime.', function() {
    it('with default tree.', function() {
      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], c => c[0])
          }
        },
        {asynchronous: false}
      );

      assert.strictEqual(tree.get('data', 'selected'), 'yellow');
      tree.set(['data', 'selected'], monkey(['data', 'colors'], c => c[1]));
      assert.strictEqual(tree.get('data', 'selected'), 'blue');
      tree.set(['data', 'colors', 1], 'purple');
      assert.strictEqual(tree.get('data', 'selected'), 'purple');
    });

    it('with mutable tree.', function() {
      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], c => c[0])
          }
        },
        {asynchronous: false, immutable: false}
      );

      assert.strictEqual(tree.get('data', 'selected'), 'yellow');
      tree.set(['data', 'selected'], monkey(['data', 'colors'], c => c[1]));
      assert.strictEqual(tree.get('data', 'selected'), 'blue');
      tree.set(['data', 'colors', 1], 'purple');
      assert.strictEqual(tree.get('data', 'selected'), 'purple');
    });

    it('with non-persistent tree.', function() {
      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], c => c[0])
          }
        },
        {asynchronous: false, persistent: false}
      );

      assert.strictEqual(tree.get('data', 'selected'), 'yellow');
      tree.set(['data', 'selected'], monkey(['data', 'colors'], c => c[1]));
      assert.strictEqual(tree.get('data', 'selected'), 'blue');
      tree.set(['data', 'colors', 1], 'purple');
      assert.strictEqual(tree.get('data', 'selected'), 'purple');
    });

    it('with impure tree.', function() {
      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], c => c[0])
          }
        },
        {asynchronous: false, pure: false}
      );

      assert.strictEqual(tree.get('data', 'selected'), 'yellow');
      tree.set(['data', 'selected'], monkey(['data', 'colors'], c => c[1]));
      assert.strictEqual(tree.get('data', 'selected'), 'blue');
      tree.set(['data', 'colors', 1], 'purple');
      assert.strictEqual(tree.get('data', 'selected'), 'purple');
    });

	it('with mutable, non-persistent, impure tree.', function() {
      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], c => c[0])
          }
        },
        {asynchronous: false, immutable: false, persistent: false, pure: false}
      );

      assert.strictEqual(tree.get('data', 'selected'), 'yellow');
      tree.set(['data', 'selected'], monkey(['data', 'colors'], c => c[1]));
      assert.strictEqual(tree.get('data', 'selected'), 'blue');
      tree.set(['data', 'colors', 1], 'purple');
      assert.strictEqual(tree.get('data', 'selected'), 'purple');
    });

  });

  it('should be possible to drop monkeys somehow.', function() {
    const tree = new Baobab(
      {
        data: {
          colors: ['yellow', 'blue'],
          selected: monkey(['data', 'colors'], c => c[0])
        }
      },
      {asynchronous: false}
    );

    tree.unset(['data', 'selected']);

    assert.deepEqual(
      tree.get('data'),
      {colors: ['yellow', 'blue']}
    );
  });

  it('merging should not disturb monkeys.', function() {
    const tree = new Baobab(
      {
        user: {
          name: 'Jack',
          surname: 'White',
          fullname: monkey({
            cursors: {
              name: ['user', 'name'],
              surname: ['user', 'surname']
            },
            get: ({name, surname}) => `${name} ${surname}`
          })
        }
      },
      {
        asynchronous: false
      }
    );

    assert.strictEqual(tree.get('user', 'fullname'), 'Jack White');

    tree.merge('user', {name: 'John', surname: 'Black'});

    assert.strictEqual(tree.get('user', 'fullname'), 'John Black');

    const altTree = new Baobab(
      {
        user: {
          name: 'Jack',
          surname: 'White',
          fullname: monkey({
            cursors: {
              name: ['user', 'name'],
              surname: ['user', 'surname']
            },
            get: ({name, surname}) => `${name} ${surname}`
          })
        }
      },
      {
        asynchronous: false
      }
    );

    assert.strictEqual(altTree.get('user', 'fullname'), 'Jack White');

    altTree.merge('user', {fullname: monkey(['user', 'name'], name => 'Hello ' + name)});

    assert.strictEqual(altTree.get('user', 'fullname'), 'Hello Jack');
  });

  it('merging should not drop keys around monkeys.', function() {
    const tree = new Baobab(
      {
        user: {
          name: 'Jack',
          surname: 'White',
          fullname: monkey({
            cursors: {
              name: ['user', 'name'],
              surname: ['user', 'surname']
            },
            get: ({name, surname}) => `${name} ${surname}`
          })
        }
      },
      {
        asynchronous: false
      }
    );

    assert.strictEqual(tree.get('user', 'fullname'), 'Jack White');

    tree.merge([], {});

    assert.strictEqual(tree.get('user', 'name'), 'Jack');
    assert.strictEqual(tree.get('user', 'surname'), 'White');
  });

  it('should be possible to use relative paths when defining monkeys\' dependencies.', function() {
    const fullname = (name, surname) => `${name} ${surname}`;

    const tree = new Baobab({
      data: {
        user: {
          name: 'John',
          surname: 'Doe',
          fullnameArray: monkey(
            ['.', 'name'],
            ['.', 'surname'],
            fullname
          ),
          fullnameObject: monkey({
            cursors: {
              name: ['.', 'name'],
              surname: ['.', 'surname']
            },
            get: ({name, surname}) => fullname(name, surname)
          }),
          nested: {
            fullnameNested: monkey(
              ['..', 'name'],
              ['..', 'surname'],
              fullname
            )
          }
        }
      }
    });

    assert.strictEqual(tree.get('data', 'user', 'fullnameArray'), 'John Doe');
    assert.strictEqual(tree.get('data', 'user', 'fullnameObject'), 'John Doe');
    assert.strictEqual(tree.get('data', 'user', 'nested', 'fullnameNested'), 'John Doe');
  });

  describe('with immutable and persistent tree', function() {
    it('should be lazy if added at runtime.', function() {
      let shouldHaveBeenCalled = false;

      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], c => c[0])
          }
        },
        {asynchronous: false, immutable: true, persistent: true}
      );

      const yellow = tree.get('data', 'selected');
      assert.strictEqual('yellow', yellow);

      tree.set(['data', 'selected'], monkey(['data', 'colors'], function(c) {
        if (shouldHaveBeenCalled)
          return c[1];
        throw new Error('should not be called');
      }));

      shouldHaveBeenCalled = true;

      const blue = tree.get('data', 'selected');
      assert.strictEqual('blue', blue);
    });

    it('should be lazy.', function() {
      let shouldHaveBeenCalled = false;

      const tree = new Baobab(
          {
            data: {
              colors: ['yellow', 'blue'],
              selected: monkey(['data', 'colors'], function(c) {
                if (shouldHaveBeenCalled)
                  return c[0];
                throw new Error('should not be called');
              })
            }
          },
          {asynchronous: false, immutable: true, persistent: true}
        );

        shouldHaveBeenCalled = true;

        const yellow = tree.get('data', 'selected');
        assert.strictEqual('yellow', yellow);
    });
  });

  describe('without immutability or persistence', function() {
    it('should be lazy if added at runtime.', function() {
      let shouldHaveBeenCalled = false;

      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], c => c[0])
          }
        },
        {asynchronous: false, immutable: false, persistent: false}
      );

      const yellow = tree.get('data', 'selected');
      assert.strictEqual('yellow', yellow);

      tree.set(['data', 'selected'], monkey(['data', 'colors'], function(c) {
        if (shouldHaveBeenCalled)
          return c[1];
        throw new Error('should not be called');
      }));

      shouldHaveBeenCalled = true;

      const blue = tree.get('data', 'selected');
      assert.strictEqual('blue', blue);
    });

    it('should be lazy.', function() {
      let shouldHaveBeenCalled = false;

      const tree = new Baobab(
        {
          data: {
            colors: ['yellow', 'blue'],
            selected: monkey(['data', 'colors'], function(c) {
              if (shouldHaveBeenCalled)
                return c[0];
              throw new Error('should not be called');
            })
          }
        },
        {asynchronous: false, immutable: false, persistent: false}
      );

      shouldHaveBeenCalled = true;

      const yellow = tree.get('data', 'selected');
      assert.strictEqual('yellow', yellow);
    });
  });

  it('should be possible to disable a single monkey\'s immutability.', function() {
    const tree = new Baobab({
      node: monkey({
        get: () => ({hello: 'world'}),
        options: {
          immutable: false
        }
      })
    });

    assert.isNotFrozen(tree.get('node'));
    assert.deepEqual(tree.get('node'), {hello: 'world'});
  });

  it('should be possible to disable a single monkey\'s immutability using the shorthand method.', function() {
    const tree = new Baobab({
      node: monkey(() => ({hello: 'world'}), {immutable: false})
    });

    assert.isNotFrozen(tree.get('node'));
    assert.deepEqual(tree.get('node'), {hello: 'world'});
  });

  it('monkey\'s laziness should not mess things up when a monkey\'s immutability is disabled.', function() {
    class Record {
      constructor() {
        this.list = [];
      }

      add(nb) {
        this.list.push(nb);
      }
    }

    const tree = new Baobab({
      record: monkey(() => {
        return new Record();
      }, {immutable: false})
    }, {asynchronous: false, lazyMonkeys: false});

    const record = tree.get('record');

    assert(record instanceof Record);

    assert.deepEqual(record.list, []);

    record.add(45);

    assert.deepEqual(record.list, [45]);
  });

  describe('Issue #430 - All non-monkey keys are lost during merge when monkey present', function () {

    it.skip('should not drop data', function () {
      const tree = new Baobab({
        cat: {
          alive: true,
          meow: monkey(['cat', 'alive'], hasLife => hasLife ? 'Meeeoooow!' : '')
        },
        birdCage: {
          canary: 'canary',
          sound: monkey(['birdCage', 'canary'], hasLife => hasLife ? 'Tweet!' : '')
        }
      }, { asynchronous: false });

      tree.merge({ cat: { alive: false } });
      assert.ok(!tree.get('cat', 'alive'));
      assert.strictEqual(tree.get('birdCage', 'canary'), 'canary');
    });
  });

  describe('Issue #422 - nested monkey errors when listening to undefined path', function () {

    it.skip('should not drop monkeys', function () {
      const tree = new Baobab({
        blubb: {
          data: {
              number: 1,
              double: monkey(['.', 'number'], n => n => n * 2)
          },
          other: {
             tripple: monkey(['..', 'data', 'number'], n => n * 3)
          }
        }
      }, { asynchronous: false });

      tree.merge(['blubb'], { data: { dummy: 2, number: 7 } });

      assert.strictEqual(tree.get('blubb', 'data', 'dummy'), 2);
      assert.strictEqual(tree.get('blubb', 'other', 'tripple'), 21);
    });

  });
});
