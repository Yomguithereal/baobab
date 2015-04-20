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

  // Validation specifications
  validate: null,

  // Validation behaviour 'rollback' or 'notify'
  validationBehavior: 'rollback'
};
