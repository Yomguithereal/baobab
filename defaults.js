/**
 * Baobab Default Options
 * =======================
 *
 */
module.exports = {

  // Should the tree handle its transactions on its own?
  autoCommit: true,

  // Should the transactions be handled asynchronously?
  asynchronous: true,

  // Facets registration
  facets: {},

  // Should the tree's data be immutable?
  immutable: false,

  // Validation specifications
  validate: null,

  // Validation behaviour 'rollback' or 'notify'
  validationBehavior: 'rollback',

  // Should the user be able to write the tree synchronously?
  syncwrite: false
};
