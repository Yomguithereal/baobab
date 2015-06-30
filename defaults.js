/**
 * Baobab Default Options
 * =======================
 *
 */
export default {

  // Should the tree handle its transactions on its own?
  autoCommit: true,

  // Should the transactions be handled asynchronously?
  asynchronous: true,

  // Should the tree's data be immutable?
  immutable: true,

  // Validation specifications
  validate: null,

  // Validation behaviour 'rollback' or 'notify'
  validationBehavior: 'rollback'
};
