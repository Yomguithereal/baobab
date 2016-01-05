[![Build Status](https://travis-ci.org/Yomguithereal/baobab.svg)](https://travis-ci.org/Yomguithereal/baobab)

# Baobab

**Baobab** is a JavaScript [persistent](http://en.wikipedia.org/wiki/Persistent_data_structure) and [immutable](http://en.wikipedia.org/wiki/Immutable_object) (at least by default) data tree supporting cursors and enabling developers to easily navigate and monitor nested data through events.

It is mainly inspired by functional [zippers](http://clojuredocs.org/clojure.zip/zipper) (such as Clojure's ones) and by [Om](https://github.com/swannodette/om)'s cursors.

It aims at providing a centralized model holding an application's state and can be paired with **React** easily through mixins, higher order components, wrapper components or decorators (available [there](https://github.com/Yomguithereal/baobab-react)).

**Fun fact**: A [Baobab](http://en.wikipedia.org/wiki/Adansonia_digitata), or *Adansonia digitata*, is a very big and magnificient African tree.

## Summary

* [Example](#example)
* [Installation](#installation)
* [Usage](#usage)
  * [Basics](#basics)
    * [Instantiation](#instantiation)
    * [Cursors](#cursors)
    * [Updates](#updates)
      * [set](#set)
      * [unset](#unset)
      * [push](#push)
      * [unshift](#unshift)
      * [concat](#concat)
      * [pop](#pop)
      * [shift](#shift)
      * [splice](#splice)
      * [apply](#apply)
      * [merge](#merge)
      * [deepMerge](#deepMerge)
    * [Events](#events)
  * [Advanced](#advanced)
    * [Polymorphisms](#polymorphisms)
    * [Computed data](#computed-data-or-monkey-business)
    * [Specialized getters](#specialized-getters)
    * [Traversal](#traversal)
    * [Options](#options)
    * [History](#history)
    * [Common pitfalls](#common-pitfalls)
* [Philosophy](#philosophy)
* [Migration](#migration)
* [Contribution](#contribution)
* [License](#license)

## Example

```js
var Baobab = require('baobab');

var tree = new Baobab({
  palette: {
    colors: ['yellow', 'purple'],
    name: 'Glorious colors'
  }
});

var colorsCursor = tree.select('palette', 'colors');

colorsCursor.on('update', function() {
  console.log('Selected colors have updated!');
});

colorsCursor.push('orange');
```

## Installation

If you want to use **Baobab** with node.js or browserify/webpack etc., you can use npm.

```sh
npm install baobab

# Or if you need the latest dev version
npm install git+https://github.com/Yomguithereal/baobab.git
```

If you want to use it in the browser, just include the minified script located [here](https://raw.githubusercontent.com/Yomguithereal/baobab/master/build/baobab.min.js).

```html
<script src="baobab.min.js"></script>
```

Or install with bower:

```js
bower install baobab
```

The library (as a standalone) currently weighs ~8kb gzipped.

## Usage

### Basics

#### Instantiation

Creating a tree is as simple as instantiating *Baobab* with an initial data set.

```js
var Baobab = require('baobab');

var tree = new Baobab({hello: 'world'});

// Retrieving data from your tree
tree.get();
>>> {hello: 'world'}
```

#### Cursors

Then you can create cursors to easily access nested data in your tree and listen to changes concerning the part of the tree you selected.

```js
// Considering the following tree
var tree = new Baobab({
  palette: {
    name: 'fancy',
    colors: ['blue', 'yellow', 'green']
  }
});

// Creating a cursor on the palette
var paletteCursor = tree.select('palette');
paletteCursor.get();
>>> {name: 'fancy', colors: ['blue', 'yellow', 'green']}

// Creating a cursor on the palette's colors
var colorsCursor = tree.select('palette', 'colors');
colorsCursor.get();
>>> ['blue', 'yellow', 'green']

// Creating a cursor on the palette's third color
var thirdColorCursor = tree.select('palette', 'colors', 2);
thirdColorCursor.get();
>>> 'green'

// Note that you can also perform subselections if needed
var colorCursor = paletteCursor.select('colors');
```

#### Updates

A *baobab* tree can obviously be updated. However, one has to understand that, even if you can write the tree synchronously, `update` events won't be, at least by default, fired until next frame.

If you really need to fire an update synchronously (typically if you store a form's state within your app's state, for instance), your remain free to use the `tree.commit()` method or tweak the tree's [options](#options) to fit your needs.

**Important**: Note that the tree, being a persistent data structure, will shift the references of the objects it stores in order to enable *immutable* comparisons between one version of the state and another (this is especially useful when using strategies as such as React's [pure rendering](https://facebook.github.io/react/docs/pure-render-mixin.html)).

*Example*

```js
var tree = new Baobab({hello: 'world'});

var initialState = tree.get();
tree.set('hello', 'monde');

// After asynchronous update...
assert(initialState !== tree.get());
```

---

* [tree/cursor.set](#set)
* [tree/cursor.unset](#unset)
* [tree/cursor.push](#push)
* [tree/cursor.unshift](#unshift)
* [tree/cursor.concat](#concat)
* [tree/cursor.pop](#pop)
* [tree/cursor.shift](#shift)
* [tree/cursor.splice](#splice)
* [tree/cursor.apply](#apply)
* [tree/cursor.merge](#merge)
* [tree/cursor.deepMerge](#deepMerge)

---

<h5 id="set">tree/cursor.set</h5>

Replaces value at the given key or the cursor's value altogether if no value is supplied.

It will also work if you want to replace a list's item.

```js
// Replacing the cursor's value
var newValue = cursor.set(newValue);

// Setting a precise key
var newValue = cursor.set('key', newValue);

// Setting a nested key
var newValue = cursor.set(['one', 'two'], newValue);
var newValue = cursor.select('one', 'two').set(newValue);
var newValue = cursor.select('one').set('two', newValue);
```

<h5 id="unset">tree/cursor.unset</h5>

Unsets the given key.

It will also work if you want to delete a list's item.

```js
// Removing data at cursor
cursor.unset();

// Removing a precise key
cursor.unset('key');

// Removing a nested key
cursor.unset(['one', 'two']);
```

<h5 id="push">tree/cursor.push</h5>

Pushes a value into the selected list. This will of course fail if the selected node is not a list.

```js
// Pushing a value
var newList = cursor.push(newValue);

// Pushing a value in the list at key
var newList = cursor.push('key', newValue);

// Pushing into a nested path
var newList = cursor.push(['one', 'two'], newValue);
var newList = cursor.select('one', 'two').push(newValue);
var newList = cursor.select('one').push('two', 'world');
```

<h5 id="unshift">tree/cursor.unshift</h5>

Unshifts a value into the selected list. This will of course fail if the selected node is not a list.

```js
// Unshifting a value
var newList = cursor.unshift(newValue);

// Unshifting a value in the list at key
var newList = cursor.unshift('key', newValue);

// Unshifting into a nested path
var newList = cursor.unshift(['one', 'two'], newValue);
var newList = cursor.select('one', 'two').unshift(newValue);
var newList = cursor.select('one').unshift('two', newValue);
```

<h5 id="concat">tree/cursor.concat</h5>

Concatenates a list into the selected list. This will of course fail if the selected node is not a list.

```js
// Concatenating a list
var newList = cursor.concat(list);

// Concatenating a list in the list at key
var newList = cursor.concat('key', list);

// Concatenating into a nested path
var newList = cursor.concat(['one', 'two'], list);
var newList = cursor.select('one', 'two').concat(list);
var newList = cursor.select('one').concat('two', list);
```

<h5 id="pop">tree/cursor.pop</h5>

Removes the last item of the selected list. This will of course fail if the selected node is not a list.

```js
// Popping the list
var newList = cursor.pop();

// Popping the list at key
var newList = cursor.pop('key');

// Popping list at path
var newList = cursor.pop(['one', 'two']);
var newList = cursor.select('one', 'two').pop();
var newList = cursor.select('one').pop('two');
```

<h5 id="shift">tree/cursor.shift</h5>

Removes the first item of the selected list. This will of course fail if the selected node is not a list.

```js
// Shifting the list
var newList = cursor.shift();

// Shifting the list at key
var newList = cursor.shift('key');

// Shifting list at path
var newList = cursor.shift(['one', 'two']);
var newList = cursor.select('one', 'two').shift();
var newList = cursor.select('one').shift('two');
```

<h5 id="splice">tree/cursor.splice</h5>

Splices the selected list. This will of course fail if the selected node is not a list.

The `splice` specifications works the same as for [`Array.prototype.splice`](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array/splice).

```js
// Splicing the list
var newList = cursor.splice([1, 1]);

// Inserting an item etc.
var newList = cursor.splice([1, 0, 'newItem']);
var newList = cursor.splice([1, 0, 'newItem1', 'newItem2']);

// Splicing the list at key
var newList = cursor.splice('key', [1, 1]);

// Splicing list at path
var newList = cursor.splice(['one', 'two'], [1, 1]);
var newList = cursor.select('one', 'two').splice([1, 1]);
var newList = cursor.select('one').splice('two', [1, 1]);
```

<h5 id="apply">tree/cursor.apply</h5>

Applies the given function to the selected value.

```js
var inc = function(nb) {
  return inc + 1;
};

// Applying the function
var newList = cursor.apply(inc);

// Applying the function at key
var newList = cursor.apply('key', inc);

// Applying the function at path
var newList = cursor.apply(['one', 'two'], inc);
var newList = cursor.select('one', 'two').apply(inc);
var newList = cursor.select('one').apply('two', inc);
```

<h5 id="merge">tree/cursor.merge</h5>

Shallow merges the selected object with another one. This will of course fail if the selected node is not an object.

```js
// Merging
var newList = cursor.merge({name: 'John'});

// Merging at key
var newList = cursor.merge('key', {name: 'John'});

// Merging at path
var newList = cursor.merge(['one', 'two'], {name: 'John'});
var newList = cursor.select('one', 'two').merge({name: 'John'});
var newList = cursor.select('one').merge('two', {name: 'John'});
```

<h5 id="deepMerge">tree/cursor.deepMerge</h5>

Deep merges the selected object with another one. This will of course fail if the selected node is not an object.

```js
// Merging
var newList = cursor.deepMerge({user: {name: 'John'}});

// Merging at key
var newList = cursor.deepMerge('key', {user: {name: 'John'}});

// Merging at path
var newList = cursor.deepMerge(['one', 'two'], {user: {name: 'John'}});
var newList = cursor.select('one', 'two').deepMerge({user: {name: 'John'}});
var newList = cursor.select('one').deepMerge('two', {user: {name: 'John'}});
```

#### Events

Whenever an update is committed, events are fired to notify relevant parts of the tree that data was changed so that bound elements, UI components, for instance, may update.

Note however that **only** relevant cursors will be notified of a change.

Events can be bound to either the tree or cursors using the `on` method.

*Example*

```js
// Considering the following tree
var tree = new Baobab({
  users: {
    john: {
      firstname: 'John',
      lastname: 'Silver'
    },
    jack: {
      firstname: 'Jack',
      lastname: 'Gold'
    }
  }
});

// And the following cursors
var usersCursor = tree.select('users'),
    johnCursor = usersCursor.select('john'),
    jackCursor = usersCursor.select('jack');

// If we update both users
johnCursor.set('firstname', 'John the third');
jackCursor.set('firstname', 'Jack the second');
// Every cursor above will be notified of the update

// But if we update only john
johnCursor.set('firstname', 'John the third');
// Only the users and john cursors will be notified
```

##### Tree level

*update*

Will fire if the tree is updated (this concerns the asynchronous updates of the tree).

```js
tree.on('update', function(e) {
  var eventData = e.data;

  console.log('Current data:', eventData.currentData);
  console.log('Previous data:', eventData.previousData);
  console.log('Transaction details:', eventData.transaction);
  console.log('Affected paths', eventData.paths);
});
```

*write*

Will fire whenever the tree is written (synchronously, unlike the `update` event).

```js
tree.on('write', function(e) {
  console.log('Affected path:', e.data.path);
});
```

*invalid*

Will fire if the `validate` function (see [options](#options)) returned an error for the current update.

```js
tree.on('invalid', function(e) {
  console.log('Error:', e.data.error);
});
```

*get*

Will fire whenever data is accessed in the tree.

```js
tree.on('get', function(e) {
  console.log('Path:', e.data.path);
  console.log('Solved path:', e.data.solvedPath);
  console.log('Target data:', e.data.data);
});
```

*select*

Will fire whenever a path is selected in the tree.

```js
tree.on('select', function(e) {
  console.log('Path:', e.data.path);
  console.log('Resultant cursor:', e.data.cursor);
});
```

##### Cursor level

*update*

Will fire if data watched over by the cursor has updated.

```js
cursor.on('update', function(e) {
  console.log('Current data:', eventData.currentData);
  console.log('Previous data:', eventData.previousData);
});
```

##### N.B.

For more information concerning **Baobab**'s event emitting, see the [emmett](https://github.com/jacomyal/emmett) library.

### Advanced

#### Polymorphisms

If you ever need to, know that there are many ways to select and retrieve data within a *baobab*.

```js
var tree = new Baobab({
  palette: {
    name: 'fancy',
    colors: ['blue', 'yellow', 'green'],
    currentColor: 1,
    items: [{id: 'one', value: 'Hey'}, {id: 'two', value: 'Ho'}]
  }
});

// Selecting
var colorsCursor = tree.select('palette', 'colors');
var colorsCursor = tree.select(['palette', 'colors']);
var colorsCursor = tree.select('palette').select('colors');

var paletteCursor = tree.select('palette');

// Retrieving data
colorsCursor.get(1);
>>> 'yellow'

paletteCursor.get('colors', 2);
>>> 'green'

tree.get('palette', 'colors');
tree.get(['palette', 'colors']);
>>> ['blue', 'yellow', 'green']

// Retrieving or selecting data by passing a function in the path
var complexCursor = tree.select('palette', 'colors', function(color) {
  return color === 'green';
});

tree.get('palette', 'colors', function(color) {
  return color === 'green';
});
>>> 'green'

// Retrieving or selecting data by passing a descriptor object in the path
var complexCursor = tree.select('items', {id: 'one'}, 'value');
tree.get('items', {id: 'one'}, 'value');
>>> 'Hey'

// Creating a blank tree
var blankTree = new Baobab();
```

**Note**: when using a function or a descriptor object in a path, you are not filtering but rather selecting the first matching element. (It's actually the same as using something like [lodash](https://lodash.com/docs#find)'s `_.find`).

#### Computed data or "Monkey Business"

For convenience, **Baobab** allows you to store computed data within the tree.

It does so by letting you create "monkeys" that you should really consider as dynamic nodes within your tree (*v1 users*: "monkeys" are merely the evolution of "facets").

As such, while monkeys represent reduction of the current state (a filtered list used by multiple component throughout your app, for instance), they do have a physical existence within the tree.

This means that you can add / modify / move / remove monkeys from the tree at runtime and place them wherever you want.

The reason why computed data now sits within the tree itself is so that components don't need to know from which kind of data, static or computed, they must draw their dependencies and so that read/select API might stay the same across the whole library.

**Example**

```js
var monkey = Baobab.monkey;
// Or if you hate similes and fancy naming
var dynamicNode = Baobab.dynamicNode;

// Declarative definition syntax
var tree = new Baobab({
  user: {
    name: 'John',
    surname: 'Smith',
    fullname: monkey({
      cursors: {
        name: ['user', 'name'],
        surname: ['user', 'surname']
      },
      get: function(data) {
        return data.name + ' ' + data.surname;
      }
    })
  },
  data: {
    messages: [
      {from: 'John', txt: 'Hey'},
      {from: 'Jack', txt: 'Ho'}
    ],
    fromJohn: monkey({
      cursors: {
        messages: ['data', 'messages'],
      },
      get: function(data) {
        return data.messages.filter(function(m) {
          return m.from === 'John';
        });
      }
    })
  }
});

// Alternate shorthand definition syntax
var tree = new Baobab({
  user: {
    name: 'John',
    surname: 'Smith',
    fullname: monkey(
      ['user', 'name'],
      ['user', 'surname'],
      function(name, surname) {
        return name + ' ' + surname;
      }
    )
  },
  data: {
    messages: [
      {from: 'John', txt: 'Hey'},
      {from: 'Jack', txt: 'Ho'}
    ],
    fromJohn: monkey(
      ['data', 'messages'],
      function(messages) {
        return messages.filter(function(m) {
          return m.from === 'John';
        });
      }
    )
  }
});

// Possibility to disable a single monkey's immutability
var tree = new Baobab({
  data: {
    users: ['Jack', 'John'],
    onlyJack: monkey({
      cursors: {
        users: ['data', 'users'],
        get: function(data) {
          return data.users.filter(function(user) {
            return user === 'Jack';
          });
        },
        options: {
          immutable: false
        }
      }
    }),

    // Using the shorthand
    onlyJohn: monkey(
      ['data', 'users'],
      function(users) {
        return users.filter(function(user) {
          return user === 'John';
        });
      },
      {immutable: false}
    )
  }
});

// Finally, know that you can use relative paths for convenience
var tree = new Baobab({
  data: {
    user: {
      name: 'John',
      surname: 'Smith',
      fullname: monkey(
        ['.', 'name'],
        ['.', 'surname'],
        function(name, surname) {
          return name + ' ' + surname;
        }
      ),
      evenMoreNested: {
        fullname: monkey(
          ['..', 'name'],
          ['..', 'surname'],
          function(name, surname) {
            return name + ' ' + surname;
          }
        )
      }
    }
  }
});

// You can then access or select data naturally
tree.get('user', 'fullname');
>>> 'John Smith'

tree.get('data', 'fromJohn');
>>> [{from: 'John', txt: 'Hey'}]

// You can also access/select data beneath a monkey
tree.get('data', 'fromJohn', 'txt');
>>> 'Hey'

var cursor = tree.select('data', 'fromJohn', 'txt');

// Just note that computed data node is read-only and that the tree
// will throw if you try to update a path lying beyond a computed node
tree.set(['data', 'fromJohn', 'txt'], 'Yay');
>>> Error!

// You can add / remove / modify a monkey at runtime using the same API
tree.set(['data', 'fromJack'], monkey({
  cursors: {
    messages: ['data', 'messages'],
    function(messages) {
      return messages.filter(function(m) {
        return m.from === 'Jack';
      });
    }
  }
}));
```

**Notes**

* The dynamic nodes will of course automatically update whenever at least one of the watched paths is updated.
* The dynamic nodes are lazy and won't actually be computed before you get them (plus they will only compute once before they need to change, so if you get the same dynamic node twice, the computation won't rerun).
* There are cases where it is clearly overkill to rely on a dynamic node. For instance, if only a single component of your app needs to access a computed version of the central state, then compute this version into the rendering logic of said component for simplicity's sake (a React component's render function for instance). Dynamic nodes are somewhat part of an optimization scheme.
* Know that the `tree/cursor.serialize` method exists would you need to retrieve data stripped of dynamic nodes from your tree.

#### Specialized getters

**tree/cursor.exists**

Check whether a specific path exists within the tree (won't fire a `get` event).

```js
// Probably true
tree.exists();

// Does the cursor points at an existing path?
cursor.exists();

// Can also take a path
tree.exists('hello');
tree.exists('hello', 'message');
tree.exists(['hello', 'message']);
```

**tree/cursor.clone**

Shallow clone the cursor's data. The method takes an optional nested path.

```js
var tree = new Baobab({user: {name: 'John'}}),
    cursor = tree.select('user');

assert(cursor.get() !== cursor.clone());
```

**tree/cursor.deepClone**

Same as the `tree/cursor.clone` except that it will deep clone the data.

**tree/cursor.serialize**

Retrieve only raw data (therefore avoiding computed data) from the tree or a cursor.

This is useful when you want to serialize your tree into JSON, for instance.

```js
tree.serialize();
cursor.serialize();

// Can also take a path
tree.serialize('hello');
tree.serialize('hello', 'message');
tree.serialize(['hello', 'message']);
```

**tree.watch**

Create a watcher that will fire an `update` event if any of the given paths is affected by a transaction.

This is useful to create modules binding a state tree to UI components.

```js
// Considering the following tree
var tree = new Baobab({
  one: {
    name: 'John'
  },
  two: {
    surname: 'Smith'
  }
});

var watcher = tree.watch({
  name: ['one', 'name'],
  surname: ['two', 'surname']
});

watcher.on('update', function(e) {
  // One of the watched paths was updated!
});

watcher.get();
>>> {
  name: 'John',
  surname: 'Smith'
}
```

**tree/cursor.project**

Retrieve data from several parts of the tree by following the given projection:

```js
// Considering the following tree
var tree = new Baobab({
  one: {
    name: 'John'
  },
  two: {
    surname: 'Smith'
  }
});

// Using an object projection
tree.project({
  name: ['one', 'name'],
  surname: ['two', 'surname']
});
>>> {name: 'John', surname: 'Smith'}

// Using an array projection
tree.project([
  ['one', 'name'],
  ['two', 'surname']
]);
>>> ['John', 'Smith']
```

#### Traversal

*Getting root cursor*

```js
var tree = new Baobab({first: {second: 'yeah'}}),
    cursor = tree.select('first');

var rootCursor = tree.root;
// or
var rootCursor = cursor.root();
```

*Going up in the tree*

```js
var tree = new Baobab({first: {second: 'yeah'}})
    secondCursor = tree.select('first', 'second');

var firstCursor = secondCursor.up();
```

*Going left/right/down in lists*

```js
var tree = new Baobab({
  list: [[1, 2], [3, 4]],
  longList: ['one', 'two', 'three', 'four']
});

var listCursor = tree.select('list'),
    twoCursor = tree.select('longList', 1);

listCursor.down().right().get();
>>> [3, 4]

listCursor.select(1).down().right().get();
>>> 4

listCursor.select(1).down().right().left().get();
>>> 3

twoCursor.leftmost().get();
>>> 'one'

twoCursor.rightmost().get();
>>> 'four'
```

*Mapping cursors over a list node*

```js
var tree = new Baobab({list: [1, 2, 3]});

tree.select('list').map(function(cursor, i) {
  console.log(cursor.get());
});
>>> 1
>>> 2
>>> 3
```

*Getting information about the cursor's location in the tree*

```js
cursor.isRoot();
cursor.isBranch();
cursor.isLeaf();
```

#### Options

You can pass those options at instantiation.

```js
var baobab = new Baobab(

  // Initial data
  {
    palette: {
      name: 'fancy',
      colors: ['blue', 'green']
    }
  },

  // Options
  {
    autoCommit: false
  }
)
```

* **autoCommit** *boolean* [`true`]: should the tree auto commit updates or should it let the user do so through the `commit` method?
* **asynchronous** *boolean* [`true`]: should the tree delay the update to the next frame or fire them synchronously?
* **immutable** *boolean* [`true`]: should the tree's data be immutable? Note that immutability is performed through `Object.freeze` and should be disabled in production for performance reasons.
* **lazyMonkeys** *boolean* [`true`]: should the monkeys be lazy? Disable this option for easier debugging in your console (getter functions are sometimes hard to read in the console).
* **persistent** *boolean* [`true`]: should the tree be persistent. Know that disabling this option, while bringing a significant performance boost on heavy data, will make you lose the benefits of your tree's history and `O(1)` comparisons of objects.
* **pure** *boolean* [`true`]: by default, on `set` and `apply` operations, the tree will check if the given value and the target node are stricly equal. If they indeed are, the tree won't update.
* **validate** *function*: a function in charge of validating the tree whenever it updates. See below for an example of such function.
* **validationBehavior** *string* [`rollback`]: validation behavior of the tree. If `rollback`, the tree won't apply the current update and fire an `invalid` event while `notify` will only emit the event and let the tree enter the invalid state anyway.

*Validation function*

```js
function validationFunction(previousState, newState, affectedPaths) {
  // Perform validation here and return an error if
  // the tree is invalid
  if (!valid)
    return new Error('Invalid tree because of reasons.');
}

var tree = new Baobab({...}, {validate: validationFunction});
```

#### History

**Baobab** lets you record the successive states of any cursor so you can seamlessly implement undo/redo features.

*Example*

```js
// Synchronous tree so that examples are simpler
var baobab = new Baobab({colors: ['blue']}, {asynchronous: false}),
    cursor = baobab.select('colors');

// Starting to record state, with 10 records maximum
cursor.startRecording(10);

cursor.push('yellow');
cursor.push('purple');
cursor.push('orange');

cursor.get();
>>> ['blue', 'yellow', 'purple', 'orange']

cursor.undo();
cursor.get();
>>> ['blue', 'yellow', 'purple']

cursor.undo(2);
cursor.get();
>>> ['blue']
```

*Starting recording*

If you do not provide a maximum number of records, will record everything without any limit.

```js
cursor.startRecording(maxNbOfRecords);
```

*Stoping recording*

```js
cursor.stopRecording();
```

*Undoing*

```js
cursor.undo();
cursor.undo(nbOfSteps);
```

*Clearing history*

```js
cursor.clearHistory();
```

*Checking if the cursor has an history*

```js
cursor.hasHistory();
```

*Retrieving the cursor's history*

```js
cursor.getHistory();
```

#### Common pitfalls

**Releasing**

In most complex use cases, you might need to release the manipulated objects, i.e. kill their event emitters and wipe their associated data.

Thus, any tree or cursor object can be cleared from memory by using the `release` method.

```js
tree.release();
cursor.release();
watcher.release();
```

Note also that releasing a tree will consequently and automatically release every of its cursors and computed data nodes.

## Philosophy

**User interfaces as pure functions**

User interfacess should be, as far as possible, considered as pure functions. Baobab is just a way to provide the needed arguments, i.e. the data representing your app's state, to such a function.

Considering your UIs like pure functions comes along with collateral advantages like easy undo/redo features, state storing (just save your tree in the `localStorage` and here you go) and easy usage in both client & server.

**Only data should enter the tree**

You shouldn't try to shove anything else than raw data into the tree. The tree hasn't been conceived to hold classes or fancy indexes with many circular references and cannot perform its magic on it. But, probably such magic is not desirable for those kind of abstractions anyway.

That is to say the data you insert into the tree should logically be JSON-serializable else you might be missing the point.

## Migration

**From v1 to v2**

* The tree is now immutable by default (but you can shunt this behavior through a dedicated [option](#options)).
* Writing to the tree is now synchronous for convenience. Updates remain asynchronous for obvious performance reasons.
* You cannot chain update methods now since those will return the affected node's data to better tackle immutability.
* The strange concat-like behavior of the `push` and `unshift` method was dropped in favor of the `concat` method.
* Facets are now full-fledged dynamic nodes called monkeys.
* The weird `$cursor` sugar has been dropped.
* The update specifications have been dropped.

**From v0.4.x to v1**

A lot of changes occurred between `0.4.x` and `1.0.0`. Most notable changes being the following ones:

* The tree now shift references by default.
* React integration has improved and is now handled by [baobab-react](https://github.com/Yomguithereal/baobab-react).
* `cursor.edit` and `cursor.remove` have been replaced by `cursor.set` and `cursor.unset` single argument polymorphisms.
* A lot of options (now unnecessary) have been dropped.
* Validation is no longer handled by [`typology`](https://github.com/jacomyal/typology) so you can choose you own validation system and so the library can remain lighter.
* Some new features such as: `$splice`, facets and so on...

For more information, see the [changelog](./CHANGELOG.md).

## Contribution

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
MIT
