/**
 * Baobab Custom Typology
 * =======================
 *
 * A custom typology to deal with data validation and type checking.
 */
var Typology = require('typology'),
    Immutable = require('immutable');

var typology = new Typology({
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
