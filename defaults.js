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

  // Should the tree clone data when giving it back to the user?
  clone: false,

  // Which cloning function should the tree use?
  cloningFunction: null,

  // Should cursors be singletons?
  cursorSingletons: true,

  // Maximum records in the tree's history
  maxHistory: 0,

  // Collection of react mixins to merge with the tree's ones
  mixins: [],

  // Should the tree shift its internal reference when applying mutations?
  shiftReferences: false,

  // Custom typology object to use along with the validation utilities
  typology: null,

  // Validation specifications
  validate: null
};
