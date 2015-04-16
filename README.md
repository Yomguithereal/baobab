[![Build Status](https://travis-ci.org/Yomguithereal/baobab.svg)](https://travis-ci.org/Yomguithereal/baobab)

# Baobab

**Baobab** is a JavaScript data tree supporting cursors and enabling developers to easily navigate and monitor nested data.

It is mainly inspired by functional [zippers](http://clojuredocs.org/clojure.zip/zipper) such as Clojure's ones and by [Om](https://github.com/swannodette/om)'s cursors.

It can be paired with **React** painlessly through mixins or higher order components (available [here](https://github.com/Yomguithereal/baobab-react)) and provide a centralized model holding your application's state.

For a concise introduction about the library and how it can be used in a React/Flux application, you can head toward **@christianalfoni**'s [article](http://christianalfoni.github.io/javascript/2015/02/06/plant-a-baobab-tree-in-your-flux-application.html) on the subject.

**Trivia**: A [Baobab](http://en.wikipedia.org/wiki/Adansonia_digitata), or *Adansonia digitata*, is a very big and magnificient African tree.

## Summary

* [Example](#example)
* [Installation](#installation)
* [Usage](#usage)
  * [Basics](#basics)
    * [Instantiation](#instantiation)
    * [Cursors](#cursors)
    * [Updates](#updates)
    * [Events](#events)
  * [Advanced](#advanced)
    * [Polymorphisms](#polymorphisms)
    * [Traversal](#traversal)
    * [Options](#options)
    * [Facets](#facets)
    * [History](#history)
    * [Update specifications](#update-specifications)
    * [Chaining mutations](#chaining-mutations)
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
  console.log('Selected colors have updated:', colorsCursor.get());
});

colorsCursor.push('orange');
```

## Installation

If you want to use **Baobab** with node.js/io.js or browserify/webpack etc., you can use npm.

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

The library (as a standalone) currently weights ~20ko minified and ~6ko gzipped.

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

Then you can create cursors to easily access nested data in your tree and be able to listen to changes concerning the part of the tree you selected.

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

// Note you can also perform subselections if needed
var colorCursor = paletteCursor.select('colors');
```

#### Updates

A *baobab* tree can obviously be updated. However, one has to understand that he won't do it, at least by default, synchronously.

Rather, the tree will stack and merge every update order you give it and will only commit them at the next frame or next tick in node.

This enables the tree to perform efficient mutations and to be able to notify any relevant cursors that the data they are watching over has changed.

Note also that the tree will shift the references of the objects it watches over in order to enable "immutabley" comparisons between one version of the state and another (this is especially useful when using things as such as React's pure render [mixin](https://facebook.github.io/react/docs/pure-render-mixin.html)).

*Example*

```js
var tree = new Baobab({hello: 'world'});

var initialState = tree.get();
tree.set('hello', 'monde'});

// After asynchronous update...
assert(initialState !== tree.get());
```

##### Tree level

*Setting a key*

```js
tree.set('hello', 'world');
```

*Unsetting a key*

```js
tree.unset('hello');
```

##### Cursor level

*Replacing data at cursor*

```js
cursor.set({hello: 'world'});
```

*Setting a key*

```js
cursor.set('hello', 'world');

// Nested path
cursor.set(['one', 'two'], 'world');
```

*Removing data at cursor*

```js
cursor.unset();
```

*Unsetting a key*

```js
cursor.unset('hello');

// Nested path
cursor.unset(['one', 'two']);
```

*Pushing values*

Obviously this will fail if the value watched over by your cursor is not an array.

```js
cursor.push('purple');

// Pushing several values
cursor.push(['purple', 'orange']);

// At key
cursor.push('list', 'orange')

// Nested path
cursor.push(['one', 'two'], 'orange');
```

*Unshifting values*

Obviously this will fail if the value watched over by your cursor is not an array.

```js
cursor.unshift('purple');

// Unshifting several values
cursor.unshift(['purple', 'orange']);

// At key
cursor.unshift('list', 'orange')

// Nested path
cursor.unshift(['one', 'two'], 'orange');
```

*Splicing an array*

Obviously this will fail if the value watched over by your cursor is not an array.

```js
cursor.splice([1, 1]);

// Applying splice n times with different arguments
cursor.splice([[1, 2], [3, 2, 'hello']]);

// At key
cursor.splice('list', [1, 1])

// Nested path
cursor.splice(['one', 'two'], [1, 1]);
```

*Applying a function*

```js
var inc = function(currentData) {
  return currentData + 1;
};

cursor.apply(inc);

// At key
cursor.apply('number', inc)

// Nested path
cursor.apply(['one', 'two'], 'orange');
```

*Chaining functions through composition*

For more details about this particular point, check [this](#chaining-mutations).

```js
var inc = function(currentData) {
  return currentData + 1;
};

cursor.chain(inc);

// At key
cursor.chain('number', inc)

// Nested path
cursor.chain(['one', 'two'], 'orange');
```

*Shallowly merging objects*

Obviously this will fail if the value watched over by your cursor is not an object.

```js
cursor.merge({hello: 'world'});

// At key
cursor.merge('object', {hello: 'world'})

// Nested path
cursor.apply(['one', 'two'], {hello: 'world'});
```

#### Events

Whenever an update is committed, events are fired to notify relevant parts of the tree that data was changed so that bound elements, React components, for instance, can update.

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

Will fire if the tree is updated.

```js
tree.on('update', function(e) {
  var affectedPaths = e.data.log,
      previousState = e.data.previousState;

  //...
});
```

*invalid*

Will fire if the `validate` function (see [options](#options)) returned an error for the current update.

```js
tree.on('invalid', function(e) {
  console.log(e.data.error);
});
```

##### Cursor level

*update*

Will fire if data watched over by the cursor has updated.

```js
cursor.on('update', fn);
```

*irrelevant*

Will fire if the cursor has become irrelevant and does not watch over any data anymore.

```js
cursor.on('irrelevant', fn);
```

*relevant*

Will fire if the cursor was irrelevant but becomes relevant again.

```js
cursor.on('relevant', fn);
```

##### N.B.

For more information concerning **Baobab**'s event emitting, see the [emmett](https://github.com/jacomyal/emmett) library.

### Advanced

#### Polymorphisms

If you ever need to, know that they are many ways to select and retrieve data within a *baobab*.

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

// Retrieving or selecting data by using the value of another cursor
var currentColorCursor = tree.select('colors', {$cursor: ['currentColor']});

var currentColor = tree.get('colors', {$cursor: ['currentColor']});

// Creating a blank tree
var blankTree = new Baobab();

// You despise "new"?
var tree = Baobab();
```

#### Traversal

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

listCursor.select(1).down().left().get();
>>> 3

twoCursor.leftmost().get();
>>> 'one'

twoCursor.rightmost().get();
>>> 'four'
```

*Getting root cursor*

```js
var tree = new Baobab({first: {second: 'yeah'}}),
    cursor = tree.select('first');

var rootCursor = tree.root;
// or
var rootCursor = cursor.root();
```

*Checking information about the cursor's location in the tree*

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
* **facets** *object*: a collection of facets to register when the tree is istantiated. For more information, see [facets](#facets).
* **validate** *function*: a function in charge of validating the tree whenever it updates. See below for an example of such function.
* **validationBehavior** *string* [`rollback`]: validation behavior of the tree. If `rollback`, the tree won't apply the current update and fire an `invalid` event while `notify` will only emit the event and let the tree enter an invalid state anyway.

*Validation function*

```js
function validationFunction(previousState, newState, affectedPaths) {
  // Peform validation here and return an error if
  // the tree is invalid
  if (!valid)
    return new Error('Invalid tree because of reasons.');
}

var tree = new Baobab({...}, {validate: validationFunction});
```

#### Facets

WIP

#### History

A *baobab* tree, given you instantiate it with the correct option, is able to record *n* of its passed states so you can go back in time whenever you want.

*Example*

```js
var baobab = new Baobab({name: 'Maria'}, {maxHistory: 1});

baobab.set('name', 'Isabella');

// On next frame, when update has been committed
baobab.get('name')
>>> 'Isabella'
baobab.undo();
baobab.get('name')
>>> 'Maria'
```

*Related Methods*

```js
// Check whether our tree hold records
baobab.hasHistory();
>>> true

// Retrieving history records
baobab.getHistory();
```

#### Update specifications

If you ever need to specify complex updates without resetting the whole subtree you are acting on, for readability or performance reasons, you remain free to use **Baobab**'s internal update specifications.

Those are widely inspired by React's immutable [helpers](http://facebook.github.io/react/docs/update.html), themselves inspired by [MongoDB](http://www.mongodb.org/)'s ones and can be used through `tree.update` and `cursor.update`.

*Specifications*

Those specifications are described by a JavaScript object that follows the nested structure you are trying to update and applying dollar-prefixed commands at leaf level.

The available commands are the following and are basically the same as the cursor's updating methods:

* `$set`
* `$apply`
* `$chain`
* `$push`
* `$unshift`
* `$merge`
* `$unset`

*Example*

```js
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

// From tree
tree.update({
  users: {
    john: {
      firstname: {
        $set: 'John the 3rd'
      }
    },
    jack: {
      firstname: {
        $apply: function(firstname) {
          return firstname + ' the 2nd';
        }
      }
    }
  }
});

// From cursor
var cursor = tree.select('users', 'john');
cursor.update({
  firstname: {
    $set: 'Little Johnsie'
  }
})
```

#### Chaining mutations

Because updates will be committed later, update orders are merged when given and the new order will sometimes override older ones, especially if you set the same key twice to different values.

This is problematic when what you want is to increment a counter for instance. In those cases, you need to *chain* functions that will be assembled through composition when the update orders are merged.

```js
var inc = function(i) {
  return i + 1;
};

// If cursor.get() >>> 1
cursor.apply(inc);
cursor.apply(inc);
// will produce 2, while
cursor.chain(inc);
cursor.chain(inc);
// will produce 3
```

#### Common pitfalls

*Controlled input state*

If you need to store a react controlled input's state into a baobab tree, remember you have to commit changes synchronously through the `commit` method if you don't want to observe nasty cursor jumps.

```jsx
var tree = new Boabab({inputValue: null});

var Input = React.createClass({
  mixins: [tree.mixin],
  cursor: ['inputValue'],
  onChange: function(e) {
    var newValue = e.target.value;

    // If one edits the tree normally, i.e. asynchronously, the cursor will hop
    this.cursor.edit(newValue);

    // One has to commit synchronously the update for the input to work correctly
    this.cursor.edit(newValue);
    this.tree.commit();
  },
  render: function() {
    return <input onChange={this.onChange} value={this.cursor.get()} />;
  }
});
```

*Immutable behaviour*

TL;DR: Don't mutate things in your *baobab* tree. Let the tree handle its own mutations.

For performance and size reasons *baobab* does not (yet?) use an immutable data structure. However, because it aims at producing a one-way data flow for your application state (like **React** would at component level), it must be used like an immutable data structure.

For this reason, don't be surprised if you mutate things and break your tree.

```js
// This is bad:
var users = tree.get('users');
users[0].name = 'Jonathan';

// This is also bad:
var o = {hello: 'world'};
tree.set('key', o);
o.hello = 'other world';
```

## Contribution

Contributions are obviously welcome. This project is nothing but experimental and I would cherish some feedback and advice about the library.

Be sure to add unit tests if relevant and pass them all before submitting your pull request.

```bash
# Installing the dev environment
git clone git@github.com:Yomguithereal/baobab.git
cd baobab
npm install

# Running the tests
npm test

# Linting, building
npm run lint
npm run build
```

## License
MIT
