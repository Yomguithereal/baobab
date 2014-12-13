/**
 * Baobab Custom Typology
 * =======================
 *
 * A custom typology to deal with data validation and type checking.
 */
var Typology = require('typology');

var typology = new Typology({
  path: function(v) {
    return this.check(v, '?string|number') || this.check(v, ['string|number']);
  },
  typology: function(v) {
    return v instanceof Typology;
  }
});

module.exports = typology;
