/**
 * Baobab Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */
import type from './type';

/**
 * Noop function
 */
const noop = Function.prototype;

/**
 * Archive abstraction
 *
 * @constructor
 * @param {integer} size - Maximum number of records to store.
 */
export class Archive {
  constructor(size) {
    this.size = size;
    this.records = [];
  }

  /**
   * Method retrieving the records.
   *
   * @return {array} - The records.
   */
  get() {
    return this.records;
  }

  /**
   * Method adding a record to the archive
   *
   * @param {object} record - The record to store.
   */
  add(record) {
    this.records.unshift(record);

    // If the number of records is exceeded, we truncate the records
    if (this.records.length > this.size)
      this.records.length = this.size;
  }

  /**
   * Method to go back in time.
   *
   * @param {integer} steps - Number of steps we should go back by.
   * @return {number}       - The last record.
   */
  back(steps) {
    let record = this.records[steps - 1];

    if (record)
      record = this.records.slice(steps);
    return record;
  }
}

/**
 * Function creating a real array from what should be an array but is not.
 * I'm looking at you nasty `arguments`...
 *
 * @param  {mixed} culprit - The culprit to convert.
 * @return {array}         - The real array.
 */
export function arrayFrom(culprit) {
  return Array.prototype.slice.call(culprit);
}

/**
 * Function decorating one function with another that will be called before the
 * decorated one.
 *
 * @param  {function} decorator - The decorating function.
 * @param  {function} fn        - The function to decorate.
 * @return {function}           - The decorated function.
 */
export function before(decorator, fn) {
  return function() {
    decorator.apply(null, arguments);
    fn.apply(null, arguments);
  };
}

/**
 * Function cloning the given variable.
 *
 * @todo: implement a faster way to clone an array.
 *
 * @param  {boolean} deep - Should we deep clone the variable.
 * @param  {mixed}   item - The variable to clone
 * @return {mixed}        - The cloned variable.
 */
function cloner(deep, item) {
  if (!item ||
      typeof item !== 'object' ||
      item instanceof Error ||
      ('ArrayBuffer' in global && item instanceof ArrayBuffer))
    return item;

  // Array
  if (type.array(item)) {
    if (deep) {
      let i, l, a = [];
      for (i = 0, l = item.length; i < l; i++)
        a.push(cloner(true, item[i]));
      return a;
    }
    else {
      return item.slice(0);
    }
  }

  // Date
  if (item instanceof Date)
    return new Date(item.getTime());

  // RegExp
  if (item instanceof RegExp)
    return cloneRegexp(item);

  // Object
  if (type.object(item)) {
    let k, o = {};

    if (item.constructor && item.constructor !== Object)
      o = Object.create(item.constructor.prototype);

    for (k in item)
      if (item.hasOwnProperty(k))
        o[k] = deep ? cloner(true, item[k]) : item[k];
    return o;
  }

  return item;
}

/**
 * Exporting shallow and deep cloning functions.
 */
const shallowClone = cloner.bind(null, false),
      deepClone = cloner.bind(null, true);

export {shallowClone, deepClone};

/**
 * Function cloning the given regular expression. Supports `y` and `u` flags
 * already.
 *
 * @param  {RegExp} re - The target regular expression.
 * @return {RegExp}    - The cloned regular expression.
 */
function cloneRegexp(re) {
  let pattern = re.source,
      flags = '';

  if (re.global) flags += 'g';
  if (re.multiline) flags += 'm';
  if (re.ignoreCase) flags += 'i';
  if (re.sticky) flags += 'y';
  if (re.unicode) flags += 'u';

  return new RegExp(pattern, flags);
}

/**
 * Function comparing an object's properties to a given descriptive
 * object.
 *
 * @param  {object} object      - The object to compare.
 * @param  {object} description - The description's mapping.
 * @return {boolean}            - Whether the object matches the description.
 */
function compare(object, description) {
  let ok = true,
      k;

  // If we reached here via a recursive call, object may be undefined because
  // not all items in a collection will have the same deep nesting structure.
  if (!object)
    return false;

  for (k in description) {
    if (type.object(description[k])) {
      ok = ok && compare(object[k], description[k]);
    }
    else if (type.array(description[k])) {
      ok = ok && !!~description[k].indexOf(object[k]);
    }
    else {
      if (object[k] !== description[k])
        return false;
    }
  }

  return ok;
}

/**
 * Function returning the first element of a list matching the given
 * predicate.
 *
 * @param  {array}     a  - The target array.
 * @param  {function}  fn - The predicate function.
 * @return {mixed}        - The first matching item or `undefined`.
 */
function first(a, fn) {
  let i, l;
  for (i = 0, l = a.length; i < l; i++) {
    if (fn(a[i]))
      return a[i];
  }
  return;
}

/**
 * Function freezing the given variable if possible.
 *
 * @param  {boolean} deep - Should we recursively freeze the given objects?
 * @param  {object}  o    - The variable to freeze.
 * @return {object}    - The merged object.
 */
function freezer(deep, o) {
  if (typeof o !== 'object')
    return;

  Object.freeze(o);

  if (!deep)
    return;

  if (Array.isArray(o)) {

    // Iterating through the elements
    let i,
        l;

    for (i = 0, l = o.length; i < l; i++)
      freezer(o[i]);
  }
  else {
    let p,
        k;

    for (k in o) {
      p = o[k];

      if (!p ||
          !o.hasOwnProperty(k) ||
          typeof p !== 'object' ||
          Object.isFrozen(p))
        continue;

      freezer(p);
    }
  }
}

/**
 * Exporting both `freeze` and `deepFreeze` functions.
 * Note that if the engine does not support `Object.freeze` then this will
 * export noop functions instead.
 */
const isFreezeSupported = (typeof Object.freeze === 'function');

const freeze = isFreezeSupported ? freezer.bind(null, false) : noop,
      deepFreeze = isFreezeSupported ? freezer.bind(null, true) : noop;

export {freeze, deepFreeze};

/**
 * Function retrieving nested data within the given object and according to
 * the given path.
 *
 * @todo: work if dynamic path hit objects also.
 *
 * @param  {object} object - The object we need to get data from.
 * @param  {array}  path   - The path to follow.
 * @return {mixed}         - The data at path, or if not found, `undefined`.
 */
export function getIn(object, path) {
  path = path || [];

  let c = object,
      p,
      i,
      l;

  for (i = 0, l = path.length; i < l; i++) {
    if (!c)
      return;

    if (typeof path[i] === 'function') {
      if (!type.array(c))
        return;

      c = first(c, path[i]);
    }
    else if (typeof path[i] === 'object') {
      if (!type.array(c))
        return;

      c = first(c, e => compare(e, path[i]));
    }
    else {
      c = c[path[i]];
    }
  }

  return c;
}

/**
 * Function returning the index of the first element of a list matching the
 * given predicate.
 *
 * @param  {array}     a  - The target array.
 * @param  {function}  fn - The predicate function.
 * @return {mixed}        - The index of the first matching item or -1.
 */
function index(a, fn) {
  let i, l;
  for (i = 0, l = a.length; i < l; i++) {
    if (fn(a[i]))
      return i;
  }
  return -1;
}

/**
 * Little helper returning a JavaScript error carrying some data with it.
 *
 * @param  {string} message - The error message.
 * @param  {object} [data]  - Optional data to assign to the error.
 * @return {Error}          - The created error.
 */
export function makeError(message, data) {
  const err = new Error(message);

  for (let k in data)
    err[k] = data[k];

  return err;
}

/**
 * Function taking two objects to shallowly merge them together. Note that the
 * second object will take precedence over the first one.
 *
 * @param  {object} o1 - The first object.
 * @param  {object} o2 - The second object.
 * @return {object}    - The merged object.
 */
export function shallowMerge(o1, o2) {
  let o = {},
      k;

  for (k in o1) o[k] = o1[k];
  for (k in o2) o[k] = o2[k];

  return o;
}

/**
 * Function solving the given path within the target object.
 *
 * @param  {object} object - The object in which the path must be solved.
 * @param  {array}  path   - The path to follow.
 * @return {mixed}         - The solved path if possible, else `null`.
 */
export function solvePath(object, path) {
  let solvedPath = [],
      c = object,
      idx,
      i,
      l;

  for (i = 0, l = path.length; i < l; i++) {
    if (!c)
      return null;

    if (typeof path[i] === 'function') {
      if (!type.array(c))
        return;

      idx = index(c, path[i]);
      solvedPath.push(idx);
      c = c[idx];
    }
    else if (typeof path[i] === 'object') {
      if (!type.array(c))
        return;

      idx = index(c, e => compare(e, path[i]));
      solvedPath.push(idx);
      c = c[idx];
    }
    else {
      solvedPath.push(path[i]);
      c = c[path[i]] || {};
    }
  }

  return solvedPath;
}

/**
 * Function determining whether some paths in the tree were affected by some
 * updates that occurred at the given paths. This helper is mainly used at
 * cursor level to determine whether the cursor is concerned by the updates
 * fired at tree level.
 *
 * NOTES: 1) If performance become an issue, the following threefold loop
 *           can be simplified to a complex twofold one.
 *        2) A regex version could also work but I am not confident it would
 *           be faster.
 *
 * @param  {array} affectedPaths - The paths that were updated.
 * @param  {array} comparedPaths - The paths that we are actually interested in.
 * @return {boolean}             - Is the update relevant to the compared
 *                                 paths?
 */
function solveUpdate(affectedPaths, comparedPaths) {
  let i, j, k, l, m, n, p, c, s;

  // Looping through possible paths
  for (i = 0, l = affectedPaths.length; i < l; i++) {
    p = affectedPaths[i];

    if (!p.length)
      return true;

    // Looping through logged paths
    for (j = 0, m = comparedPaths.length; j < m; j++) {
      c = comparedPaths[j];

      if (!c.length)
        return true;

      // Looping through steps
      for (k = 0, n = c.length; k < n; k++) {
        s = c[k];

        // If path is not relevant, we break
        if (s != p[k])
          break;

        // If we reached last item and we are relevant
        if (k + 1 === n || k + 1 === p.length)
          return true;
      }
    }
  }

  return false;
}

/**
 * Non-mutative version of the splice array method.
 *
 * @param {array} array       - The array to splice.
 * @param {integer} index     - The start index.
 * @param {integer} nb        - Number of elements to remove.
 * @param {...mixed} elements - Elements to append after splicing.
 * @return {array}            - The spliced array.
 */
export function splice(array, index, nb, ...elements) {
  return array
    .slice(0, index)
    .concat(elements)
    .concat(array.slice(index + nb));
}

/**
 * Function returning a unique incremental id each time it is called.
 *
 * @return {integer} - The latest unique id.
 */
const uniqid = (function() {
  var i = 0;
  return function() {
    return i++;
  };
})();

export {uniqid};
