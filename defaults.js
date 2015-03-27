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

  // Collection of react mixins to merge with the tree's ones
  mixins: [],

  // Should the tree shift its internal reference when applying mutations?
  shiftReferences: false,

  // Validation specifications
  validate: null
};
