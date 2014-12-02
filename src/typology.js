/**
 * Precursors Custom Typology
 * ===========================
 *
 * A custom typology to deal with data validation and types checking.
 */
var Typology = require('typology'),
    Immutable = require('immutable'),
    Atom = require('./atom.js'),
    Cursor = require('./cursor.js');

var typology = new Typology({
  atom: function(v) {
    return v instanceof Atom;
  },
  cursor: function(v) {
    return v instanceof Cursor;
  },
  immutable: function(v) {
    return v instanceof Immutable.Iterable || typology.check(v, 'primitive');
  },
  list: function(v) {
    return v instanceof Immutable.List;
  },
  map: function(v) {
    return v instanceof Immutable.Map;
  },
  maplike: 'object|map',
  path: function(v) {
    return typology.check(v, '?string') || typology.check(v, ['string']);
  }
});

module.exports = typology;
