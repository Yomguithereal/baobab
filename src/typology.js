/**
 * Precursors Custom Typology
 * ===========================
 *
 * A custom typology to deal with data validation and types checking.
 */
var Typology = require('typology'),
    Immutable = require('immutable');

var typology = new Typology({
  immutable: function(v) {
    return v instanceof Immutable.Iterable || typology.check(v, 'primitive');
  },
  map: function(v) {
    return v instanceof Immutable.Map;
  },
  list: function(v) {
    return v instanceof Immutable.List
  },
  maplike: 'object|map'
});

module.exports = typology;
