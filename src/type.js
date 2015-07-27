/**
 * Baobab Type Checking
 * =====================
 *
 * Helpers functions used throughout the library to perform some type
 * tests at runtime.
 *
 */
const type = {};

/**
 * Helpers
 * --------
 */

/**
 * Checking whether the given variable is of any of the given types.
 *
 * @todo   Optimize this function by dropping `some`.
 *
 * @param  {mixed} target  - Variable to test.
 * @param  {array} allowed - Array of allowed types.
 * @return {boolean}
 */
function anyOf(target, allowed) {
  return allowed.some(t => type[t](target));
}

/**
 * Simple types
 * -------------
 */

/**
 * Checking whether the given variable is an array.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.array = function(target) {
  return Array.isArray(target);
};

/**
 * Checking whether the given variable is an object.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.object = function(target) {
  return target &&
         typeof target === 'object' &&
         !Array.isArray(target) &&
         !(target instanceof Date) &&
         !(target instanceof RegExp);
};

/**
 * Checking whether the given variable is a string.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.string = function(target) {
  return typeof target === 'string';
};

/**
 * Checking whether the given variable is a number.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.number = function(target) {
  return typeof target === 'number';
};

/**
 * Checking whether the given variable is a function.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.function = function(target) {
  return typeof target === 'function';
};

/**
 * Checking whether the given variable is a JavaScript primitive.
 *
 * @param  {mixed} target - Variable to test.
 * @return {boolean}
 */
type.primitive = function(target) {
  return target !== Object(target);
};

/**
 * Complex types
 * --------------
 */

/**
 * Checking whether the given variable is a valid splicer.
 *
 * @param  {mixed} target    - Variable to test.
 * @param  {array} [allowed] - Optional valid types in path.
 * @return {boolean}
 */
type.splicer = function(target) {
  if (!type.array(target) || target.length < 2)
    return false;

  return anyOf(target[0], ['number', 'function', 'object']) &&
         type.number(target[1]);
};

/**
 * Checking whether the given variable is a valid cursor path.
 *
 * @param  {mixed} target    - Variable to test.
 * @param  {array} [allowed] - Optional valid types in path.
 * @return {boolean}
 */

// Order is important for performance reasons
const ALLOWED_FOR_PATH = ['string', 'number', 'function', 'object'];

type.path = function(target) {
  if (!target && target !== 0)
    return false;

  return [].concat(target).every(step => anyOf(step, ALLOWED_FOR_PATH));
};

/**
 * Checking whether the given path is a dynamic one.
 *
 * @param  {mixed} path - The path to test.
 * @return {boolean}
 */
type.dynamicPath = function(path) {
  return path.some(step => type.function(step) || type.object(step));
};

/**
 * Retrieve any facet subpath in the given path or null if the path never comes
 * across computed data.
 *
 * @param  {mixed} path - The path to test.
 * @return {boolean}
 */
type.facetPath = function(path) {
  let subpath = [],
      i,
      l;

  for (i = 0, l = path.length; i < l; i++) {
    subpath.push(path[i]);

    if (path[i][0] === '$')
      return subpath;
  }

  return null;
};

/**
 * Checking whether the given path is read-only.
 * Note: this should of course apply to a solved path and not a dynamic one.
 *
 * @param  {mixed} path - The path to test.
 * @return {boolean}
 */
type.readOnlyPath = function(path) {
  return path.some(step => step[0] === '$');
};

/**
 * Returns the type of the given facet definition or `null` if invalid.
 *
 * @param  {mixed} definition - The definition to check.
 * @return {string|null}
 */
type.facetDefinition = function(definition) {

  if (type.object(definition)) {
    if (!type.function(definition.get) ||
        (definition.cursors && !(type.watcherDefinition(definition.cursors))))
      return null;
    else
      return 'object';
  }
  else if (type.array(definition)) {
    if (!type.function(definition[definition.length - 1]) ||
        !type.watcherDefinition(definition.slice(0, -1)))
      return null;
    else
      return 'array';
  }

  return null;
};

/**
 * Checking whether the given watcher definition is valid.
 *
 * @param  {mixed}   definition - The definition to check.
 * @return {boolean}
 */
type.watcherDefinition = function(definition) {

  if (type.object(definition))
    return Object.keys(definition).every(k => type.path(definition[k]));
  else if (type.array(definition))
    return definition.every(type.path);

  return false;
};

/**
 * Checking whether the given string is a valid operation type.
 *
 * @param  {mixed} string - The string to test.
 * @return {boolean}
 */

// Ordered by likeliness
const VALID_OPERATIONS = [
  'set',
  'apply',
  'push',
  'unshift',
  'concat',
  'merge',
  'splice',
  'unset'
];

type.operationType = function(string) {
  return typeof string === 'string' && !!~VALID_OPERATIONS.indexOf(string);
};

export default type;
