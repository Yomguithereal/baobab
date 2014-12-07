# Baobab

**Baobab** is a JavaScript data tree supporting cursors and enabling developers to easily navigate and monitor nested data.

It is mainly inspired by functional zippers such as Clojure's [ones](http://clojuredocs.org/clojure.zip/zipper) and by [Om](https://github.com/swannodette/om)'s cursors.

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

#### Basics

Then you can create cursor to easily access nested data in your tree and be able to listen to changes concerning the part of the tree you selected.

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
var colorCursor = paletteCursor.select('cursor');
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
cursor.unshitf('purple');
cursor.unshitf(['purple', 'orange']);
```

*Apply a function*

```js
cursor.apply(function(currentData) {
  return currentData + 1;
});
```

*Thread a function*

As updates will be committed later, update orders are merged when given and the new order will sometimes override older ones, especially if you set the same key twice to different values.

This is problematic when what you want is to increment a counter for instance. In those case, you need to *thread* functions that will be assembled through composition when the update orders are merged.

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

If you ever need to specify complex updates without resetting the whole subtree you are acting on, for readability and performance reasons, you remain free to use **Baobab**'s internal update specifications.

Those are widely inspired by React's immutable [helpers](http://facebook.github.io/react/docs/update.html).

### Events

Whenever an update is committed, events are fired to notify relevant parts of the tree that data was changed so that bound element, React components, for instance, can update.

Example with child/parent

#### Tree level

*update*

*invalid*

#### Cursor level

*update*

*irrelevant*

*relevant*

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

### History

### React mixins

componentShouldUpdate

#### Tree level

#### Cursor level

## Contribution
[![Build Status](https://travis-ci.org/Yomguithereal/baobab.svg)](https://travis-ci.org/Yomguithereal/baobab)

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
