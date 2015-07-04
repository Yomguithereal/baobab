/**
 * Baobab Update
 * ==============
 *
 * The tree's update scheme.
 */
import type from './type';
import {
  freeze,
  makeError,
  shallowClone,
  shallowMerge,
  splice
} from './helpers';

// TODO: maybe abstract more
function err(message, path) {
  return makeError(`Baobab.update: ${message}`, {path});
}

/**
 * Function aiming at applying a single update operation on the given tree's
 * data.
 *
 * @param  {mixed}  data      - The tree's data.
 * @param  {path}   path      - Path of the update.
 * @param  {object} operation - The operation to apply.
 * @param  {object} [opts]    - Optional options.
 * @return {mixed}            - Both the new tree's data and the updated node.
 */
export default function update(data, path, operation, opts={}) {
  const {type: operationType, value} = operation;

  // Dummy root, so we can shift and alter the root
  const dummy = {root: data},
        dummyPath = ['root', ...path];

  // Walking the path
  let p = dummy,
      currentPath = [],
      i,
      l,
      s;

  for (i = 0, l = dummyPath.length; i < l; i++) {

    // Current item's reference is therefore p[s]
    // The reason why we don't create a variable here for convenience
    // is because we actually need to mutate the reference.
    s = dummyPath[i];

    // Updating the path
    if (i > 0)
      currentPath.push(s);

    // If we are where the operation should be applied, we act
    if (i === l - 1) {

      /**
       * Set
       */
      if (operationType === 'set') {
        p[s] = value;
      }

      /**
       * Push
       */
      else if (operationType === 'push') {
        if (!type.array(p[s]))
          throw err(
            'cannot apply the "push" operation on a non array.',
            currentPath
          );

        p[s] = p[s].concat(value);
      }

      /**
       * Unshift
       */
      else if (operationType === 'unshift') {
        if (!type.array(p[s]))
          throw err(
            'cannot apply the "unshift" operation on a non array.',
            currentPath
          );

        p[s] = [value].concat(p[s]);
      }

      /**
       * Splice
       */
      else if (operationType === 'splice') {
        if (!type.array(p[s]))
          throw err(
            'cannot apply the "splice" operation on a non array.',
            currentPath
          );

        p[s] = splice.apply(null, [p[s]].concat(value));
      }

      /**
       * Unset
       */
      else if (operationType === 'unset') {
        if (type.object(p))
          delete p[s];
      }

      /**
       * Merge
       */
      else if (operationType === 'merge') {
        if (!type.object(p[s]))
          throw err(
            'cannot apply the "merge" operation on a non object.',
            currentPath
          );

        p[s] = shallowMerge(p[s], value);
      }

      // TODO: deepFreeze here if needed

      break;
    }

    // If we reached a leaf, we override by setting an empty object
    if (type.primitive(p[s])) {
      p[s] = {};
    }

    // Else, we shift the reference and continue the path
    else {
      p[s] = shallowClone(p[s]);
    }

    // Should we freeze the current step before continuing?
    if (opts.immutable)
      freeze(p);

    p = p[s];
  }

  // Returning new data object
  return {data: dummy.root, node: p[s]};
}
