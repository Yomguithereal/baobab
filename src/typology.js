/**
 * Baobab Custom Typology
 * =======================
 *
 * A custom typology to deal with data validation and type checking.
 */
var Typology = require('typology');

var typology = new Typology({
  complexStep: 'function|object',
  step: 'string|number|array|function|object',
  path: function(v) {
    return this.check(v, '?string|number|function|object') ||
           this.check(v, ['string|number|function|object']);
  },
  typology: function(v) {
    return v instanceof Typology;
  }
});

module.exports = typology;
