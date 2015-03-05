[![Build Status](https://travis-ci.org/Yomguithereal/baobab.svg)](https://travis-ci.org/Yomguithereal/baobab)

# Baobab

**Baobab** is a JavaScript data tree supporting cursors and enabling developers to easily navigate and monitor nested data.

It is mainly inspired by functional [zippers](http://clojuredocs.org/clojure.zip/zipper) such as Clojure's ones and by [Om](https://github.com/swannodette/om)'s cursors.

It can be paired with **React** easily through [mixins](#react-mixins) to provide a centralized model holding your application's state.

### For more details, please use the <a href="wiki">WIKI documentation</a>

If you want to read an introduction on application development with Baobab and React JS, read [Plant a Baobab tree in your FLUX application](http://christianalfoni.github.io/javascript/2015/02/06/plant-a-baobab-tree-in-your-flux-application.html).

## Sneak peak

```js
var Baobab = require('baobab');

var tree = new Baobab({
  palette: {
    colors: ['yellow', 'purple'],
    name: 'Glorious colors'
  }
});

var colors = tree.select('palette', 'colors');

colors.on('update', function() {
  console.log('Selected colors have updated:', colors.get());
});

colors.push('orange');
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
