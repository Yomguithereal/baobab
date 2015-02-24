[![Build Status](https://travis-ci.org/Yomguithereal/baobab.svg)](https://travis-ci.org/Yomguithereal/baobab)

# Baobab

**Baobab** is a JavaScript data tree supporting cursors and enabling developers to easily navigate and monitor nested data.

It is mainly inspired by functional [zippers](http://clojuredocs.org/clojure.zip/zipper) such as Clojure's ones and by [Om](https://github.com/swannodette/om)'s cursors.

It can be paired with **React** easily through [mixins](#react-mixins) to provide a centralized model holding your application's state.

## Summary

* [Example](#example)
* [Installation](#installation)
* [Usage](#usage)
  * [Basics](#basics)
    * [Instantiation](#instantiation)
    * [Cursors](#cursors)
    * [Updates](#updates)
    * [Events](#events)
    * [React mixins](#react-mixins)
  * [Advanced](#advanced)
    * [Polymorphisms](#polymorphisms)
    * [Traversal](#traversal)
    * [Options](#options)
    * [History](#history)
    * [Update specifications](#update-specifications)
    * [Chaining mutations](#chaining-mutations)
    * [Cursor combinations](#cursor-combinations)
    * [Data validation](#data-validation)
    * [Common pitfalls](#common-pitfalls)
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

If you want to use **Baobab** with node.js or browserify, you can use npm.

```sh
npm install baobab

# Or for the latest dev version
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

## Usage

### Basics

#### Instantiation

Creating a *baobab* is as simple as instantiating it with an initial data set (note that only objects or array should be given).

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

A *baobab* tree can obviously be updated. However, one has to to understand that he won't do it, at least by default, synchronously.

Rather, the tree will stack and merge every update order you give him and will only commit them at the next frame or next tick in node.

This enables the tree to perform efficient mutations and to be able to notify any relevant cursors that the data they are watching over has changed.

##### Tree level

*Setting a key*

```js
tree.set('hello', 'world');
```

##### Cursor level

*Replacing data at cursor*

```js
cursor.edit({hello: 'world'});
```

*Setting a key*

```js
cursor.set('hello', 'world');
```

*Pushing values*

Obviously this will fail if target data is not an array.

```js
cursor.push('purple');
cursor.push(['purple', 'orange']);
```

*Unshifting values*

Obviously this will fail if target data is not an array.

```js
cursor.unshift('purple');
cursor.unshift(['purple', 'orange']);
```

*Applying a function*

```js
cursor.apply(function(currentData) {
  return currentData + 1;
});
```

*Shallowly merging objects*

```js
cursor.merge({hello: 'world'});
```

#### Events

Whenever an update is committed, events are fired to notify relevant parts of the tree that data was changed so that bound elements, React components, for instance, can update.

Note however that only relevant cursors will be notified of data change.

Events, can be bound to either the tree or cursors using the `on` method.

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
tree.on('update', fn);
```

*invalid*

Will fire if a data-validation specification was passed at instance and if new data does not abide by those specifications. For more information about this, see the [data validation](#data-validation) part of the documentation.

```js
tree.on('invalid', fn);
```

##### Cursor level

*update*

Will fire if data watched by cursor has updated.

```js
cursor.on('update', fn);
```

*irrelevant*

Will fire if the cursor has become irrelevant and does not watch over any data anymore.

```js
cursor.on('irrelevant', fn);
```

*relevant*

Will fire if the cursor is irrelevant but becomes relevant again.

```js
cursor.on('relevant', fn);
```

##### N.B.

For more information concerning **Baobab**'s event emitting, see the [emmett](https://github.com/jacomyal/emmett) library.

#### React mixins

A *baobab* tree can easily be used as a UI model keeping the whole application state.

It is then really simple to bind this centralized model to React components by using the library's built-in mixins. Those will naturally bind components to one or more cursors watching over parts of the main state so they can update only when relevant data has been changed.

This basically makes the `shouldComponentUpdate` method useless in most of cases and ensures that your components will only re-render if they need to because of data changes.

##### Tree level

You can bind a React component to the tree itself and register some handy cursors:

```jsx
var tree = new Baobab({
  users: ['John', 'Jack'],
  information: {
    title: 'My fancy App'
  }
});

// Single cursor
var UserList = React.createClass({
  mixins: [tree.mixin],
  cursor: ['users'],
  render: function() {
    var renderItem = function(name) {
      return <li>{name}</li>;
    };

    // Cursor data is then available either through:
    var data = this.cursor.get();
    // Or
    var data = this.state.cursor;

    return <ul>{this.cursor.get().map(renderItem)}</ul>;
  }
});

// Multiple cursors
var UserList = React.createClass({
  mixins: [tree.mixin],
  cursors: [['users'], ['information', 'title']],
  render: function() {
    var renderItem = function(name) {
      return <li>{name}</li>;
    };

    // Cursor data is then available either through:
    var data = this.cursors[0].get();
    // Or
    var data = this.state.cursors[0];

    return (
      <div>
        <h1>{this.cursors[1].get()}</h1>
        <ul>{this.cursor[0].get().map(renderItem)}</ul>
      </div>
    );
  }
});

// Better multiple cursors
var UserList = React.createClass({
  mixins: [tree.mixin],
  cursors: {
    users: ['users'],
    title: ['information', 'title']
  },
  render: function() {
    var renderItem = function(name) {
      return <li>{name}</li>;
    };

    // Cursor data is then available either through:
    var data = this.cursors.name.get();
    // Or
    var data = this.state.cursors.name;

    return (
      <div>
        <h1>{this.cursors.name.get()}</h1>
        <ul>{this.cursors.users.get().map(renderItem)}</ul>
      </div>
    );
  }
});
```

##### Cursor level

Else you can bind a single cursor to a React component

```jsx
var tree = new Baobab({users: ['John', 'Jack']}),
    usersCursor = tree.select('users');

var UserList = React.createClass({
  mixins: [usersCursor.mixin],
  render: function() {
    var renderItem = function(name) {
      return <li>{name}</li>;
    };

    return <ul>{this.cursor.get().map(renderItem)}</ul>;
  }
});
```

### Advanced

#### Polymorphisms

If you ever need to, know that they are many ways to select and retrieve data within a *baobab*.

```js
var tree = new Baobab({
  palette: {
    name: 'fancy',
    colors: ['blue', 'yellow', 'green'],
    items: [{id: 'one', value: 'Hey'}, {id: 'two', value: 'Ho'}]
  }
});

// Selecting
var colorsCursor = tree.select('palette', 'colors');
var colorsCursor = tree.select(['palette', 'colors']);
var colorsCursor = tree.select('palette').select('colors');

// Retrieving data
colorsCursor.get(1)
>>> 'yellow'

paletteCursor.get('colors', 2)
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

*Check information about the cursor's location in the tree*

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
    maxHistory: 5,
    clone: true
  }
)
```

* **autoCommit** *boolean* [`true`]: should the tree auto commit updates or should it let the user do so through the `commit` method?
* **asynchronous** *boolean* [`true`]: should the tree delay the update to the next frame or fire them synchronously?
* **clone** *boolean* [`false`]: by default, the tree will give access to references. Set to `true` to clone data when retrieving it from the tree if you feel paranoid and know you might mutate the references by accident or need a cloned object to handle.
* **cloningFunction** *function*: the library's cloning method is minimalist on purpose and won't cover edgy cases. You remain free to pass your own more complex cloning function to the tree if needed.
* **cursorSingletons** *boolean* [`true`]: by default, a *baobab* tree stashes the created cursor so only one would be created by path. You can override this behaviour by setting `cursorSingletons` to `false`.
* **maxHistory** *number* [`0`]: max number of records the tree is allowed to store within its internal history.
* **mixins** *array*: optional mixins to merge with baobab's ones. Recommending the [pure render](http://facebook.github.io/react/docs/pure-render-mixin.html) one from react.
* **shiftReferences** *boolean* [`false`]: tell the tree to shift references of the objects it updates so that functions performing shallow comparisons (such as the one used by the `PureRenderMixin`, for instance), can assess that data changed.
* **typology** *Typology|object*: a custom typology to be used to validate the tree's data.
* **validate** *object*: a [typology](https://github.com/jacomyal/typology) schema ensuring the tree's data is valid.

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

#### Cursor combinations

At times, you might want to listen to updates concerning a logical combination of cursors. For instance, you might want to know when two cursors both updated or when either one or the other did.

You can build cursor combination likewise:

```js
// Simple "or" combination
var combination = cursor1.or(cursor2);

// Simple "and" combination
var combination = cursor1.and(cursor2);

// Complex combination
var combination = cursor1.or(cursor2).or(cursor3).and(cursor4);

// Listening to events
combination.on('update', handler);

// Releasing a combination to avoid leaks
combination.release();
```

#### Data validation

Given you pass the correct parameters, a baobab tree is able to check whether its data is valid or not against the supplied specification.

This specification must be written in the [typology](https://github.com/jacomyal/typology) library's style.

*Example*

```js
var baobab = new Baobab(

  // Initial state
  {
    hello: 'world',
    colors: ['yellow', 'blue'],
    counters: {
      users: 3,
      groups: 1
    }
  },

  // Parameters
  {
    validate: {
      hello: '?string',
      colors: ['string'],
      counters: {
        users: 'number',
        groups: 'number'
      }
    }
  }
);

// If one updates the tree and does not respect the validation specification
baobab.set('hello', 42);

// Then the tree will fire an 'invalid' event containing a list of errors
baobab.on('invalid', function(e) {
  console.log(e.data.errors);
});
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
