[![Build Status](https://travis-ci.org/Yomguithereal/baobab.svg)](https://travis-ci.org/Yomguithereal/baobab)

# Baobab

**Baobab** is a JavaScript data tree supporting cursors and enabling developers to easily navigate and monitor nested data.

It is mainly inspired by functional zippers such as Clojure's [ones](http://clojuredocs.org/clojure.zip/zipper) and by [Om](https://github.com/swannodette/om)'s cursors.

It can be paired with React easily through mixins to provide a centralized model holding your application's state.

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

## Usage

* [Instantiation](#instantiation)
* [Cursors](#cursors)
* [Updates](#updates)
* [Events](#events)
* [Options](#options)
* [React mixins](#react-mixins)

### Instantiation

Creating a *baobab* is as simple as instantiating it with an initial data set (note that only objects or array should be given).

```js
var Baobab = require('baobab');

var tree = new Baobab({hello: 'world'});

// Retrieving data
tree.get();
>>> {hello: 'world'}
```

### Cursors

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
paletteCursor.get()
>>> {name: 'fancy', colors: ['blue', 'yellow', 'green']}

// Creating a cursor on the palette's colors
var colorsCursor = tree.select(['palette', 'colors']);
colorsCursor.get()
>>> ['blue', 'yellow', 'green']

// Creating a cursor on the palette's third color
var thirdColorCursor = tree.select(['palette', 'colors', 2]);
thirdColorCursor.get()
>>> 'green'

// Note you can perform subselections if you want to
var colorCursor = paletteCursor.select('colors');
```

#### Polymorphisms

If you ever need to, know that they are many ways to select and retrieve data within a *baobab*.

```js
var tree = new Baobab({
  palette: {
    name: 'fancy',
    colors: ['blue', 'yellow', 'green']
  }
});

// Selecting
var colorsCursor = tree.select('palette', 'colors');
var colorsCursor = tree.select(['palette', 'colors']);
var colorsCursor = tree.select('palette').select('colors');

// Traversal
var paletteCursor = colorsCursor.up();

// Retrieving data
colorsCursor.get(1)
>>> 'yellow'

paletteCursor.get('colors', 2)
>>> 'green'

tree.get('palette', 'colors');
tree.get(['palette', 'colors']);
>>> ['blue', 'yellow', 'green']
```

### Updates

A *baobab* tree can obviously be updated. However, one has to to understand that he won't do it, at least by default, synchronously.

Rather, the tree will stack and merge every update order you give him and will only commit them at the next frame or next tick in node.

This enables the tree to perform efficient mutations and to be able to notify any relevant cursor that the data they are watching over has changed.

#### Tree level

*Setting a key*

```js
tree.set('hello', 'world');
```

#### Cursor level

*Replacing data at cursor*

```js
cursor.set({hello: 'world'});
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

*Threading a function*

As updates will be committed later, update orders are merged when given and the new order will sometimes override older ones, especially if you set the same key twice to different values.

This is problematic when what you want is to increment a counter for instance. In those cases, you need to *thread* functions that will be assembled through composition when the update orders are merged.

```js
var inc = function(i) {
  return i + 1;
};

// If cursor.get() >>> 1
cursor.apply(inc);
cursor.apply(inc);
// will produce 2, while
cursor.thread(inc);
cursor.thread(inc);
// will produce 3
```

#### Update specifications

If you ever need to specify complex updates without resetting the whole subtree you are acting on, for readability or performance reasons, you remain free to use **Baobab**'s internal update specifications.

Those are widely inspired by React's immutable [helpers](http://facebook.github.io/react/docs/update.html) and can be used through `tree.update` and `cursor.update`.

*Specifications*

Those specifications are described by a JavaScript object that follows the nested structure you are trying to update and applying dollar-prefixed commands at leaf level.

The available commands are the following and are basically the same as the cursor's updating methods:

* `$set`
* `$apply`
* `$thread`
* `$push`
* `$unshift`

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
});

// From cursor
var cursor = tree.select('john');
cursor.update({
  firstname: {
    $set: 'Little Johnsie'
  }
})
```

### Events

Whenever an update is committed, events are fired to notify relevant parts of the tree that data was changed so that bound element, React components, for instance, can update.

Note however that only relevant cursors will be notified of data change.

Events, can be bound to either the tree or cursors using the `on` method and use the [emmett](https://github.com/jacomyal/emmett) EventEmitter's library.

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
var usersCusor = tree.select('users'),
    johnCursor = usersCursor.select('john'),
    jackCursor = usersCursor.select('jack');

// If we update the users
usersCursor.update({
  john: {
    firstname: {$set: 'John the third'}
  },
  jack: {
    firstname: {$set: 'Jack the second'}
  }
});
// Every cursor above will be notified of the update

// But if we update only john
johnCursor.set('firstname', 'John the third');
// Only the users and john cursor will be notified
```

#### Tree level

*update*

Will fire if the tree is updated.

```js
tree.on('update', fn);
```

*invalid*

Will fire if a data-validation specification was passed at instance and if new data does not abide by those specifications.

```js
tree.on('invalid', fn);
```

#### Cursor level

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

### Options

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
* **clone** *boolean* [`false`]: by default, the tree will give access to references. Set to `true` to clone data when retrieving it from the tree.
* **delay** *boolean* [`true`]: should the tree delay the update to next frame or fire them synchronously?
* **maxHistory** *number* [`0`]: max number of records the tree is allowed to keep in its history.
* **typology** *Typology|object*: a custom typology to be used to validate the tree's data.
* **validate** *object*: a [typology](https://github.com/jacomyal/typology) schema ensuring the tree's data is valid.

### History

A *baobab* tree, given you pass it correct options, is able to record *n* of its passed states so you can go back in time whenever you want.

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

### React mixins

A *baobab* tree can easily be used as a UI model keeping the whole application state.

It is therefore really simple to bind this centralized model to React components by using the library's built-in mixins. Those will naturally bind components to one or more cursors watching over parts of the main state so they can update only when relevant data has been changed.

This basically makes the `shouldComponentUpdate` method useless in most of cases and ensures that your components will only re-render if they need to because of data changes.

#### Tree level

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

    return (
      <div>
        <h1>{this.cursors.name.get()}</h1>
        <ul>{this.cursors.users.get().map(renderItem)}</ul>
      </div>
    );
  }
});
```

#### Cursor level

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
gulp lint
gulp build
```

## License
MIT
