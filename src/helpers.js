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

      idx = indexByComparison(c, path[i]);
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
