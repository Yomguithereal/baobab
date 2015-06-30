/**
 * Baobab Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */

/**
 * Simple function returning a unique incremental id each time it is called.
 *
 * @return {integer} - The latest unique id.
 */
const uniqid = (function() {
  var i = 0;
  return function() {
    return i++;
  };
})();

export uniqid;
