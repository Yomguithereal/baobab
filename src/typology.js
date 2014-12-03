/**
 * Baobab Custom Typology
 * =======================
 *
 * A custom typology to deal with data validation and type checking.
 */
var Typology = require('typology'),
    Immutable = require('immutable'),
    Baobab = require('./baobab.js'),
    Cursor = require('./cursor.js');

var typology = new Typology({
  baobab: function(v) {
    return v instanceof Baobab;
  },
  cursor: function(v) {
    return v instanceof Cursor;
  },
  immutable: function(v) {
    return v instanceof Immutable.Iterable || this.check(v, 'primitive');
  },
  list: function(v) {
    return v instanceof Immutable.List;
  },
  map: function(v) {
    return v instanceof Immutable.Map;
  },
  maplike: 'object|map',
  path: function(v) {
    return this.check(v, '?string|number') || this.check(v, ['string']);
  }
});

module.exports = typology;
