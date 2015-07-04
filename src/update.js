/**
 * Baobab Update
 * ==============
 *
 * The tree's update scheme.
 */
import type from './type';
import {
  freeze,
  shallowClone
} from './helpers';

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
      i,
      l,
      s;

  for (i = 0, l = dummyPath.length; i < l; i++) {

    // Current step
    // Current item's reference is therefore p[s]
    s = dummyPath[i];

    // If we are where the operation should be applied, we act
    if (i === l - 1) {
      if (operationType === 'set') {
        p[s] = value;
      }

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
