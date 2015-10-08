/**
 * Baobab Update
 * ==============
 *
 * The tree's update scheme.
 */
import type from './type';
import {MonkeyDefinition} from './monkey';
import {
  freeze,
  deepFreeze,
  deepMerge,
  makeError,
  shallowClone,
  shallowMerge,
  splice
} from './helpers';

function err(operation, expectedTarget, path) {
  return makeError(
    `Baobab.update: cannot apply the "${operation}" on ` +
    `a non ${expectedTarget} (path: /${path.join('/')}).`,
    {path}
  );
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

    // If we reached the end of the path, we apply the operation
    if (i === l - 1) {

      /**
       * Set
       */
      if (operationType === 'set') {

        // Purity check
        if (opts.pure && p[s] === value)
          return {node: p[s]};
        
        if(opts.persistent) {
          p[s] = shallowClone(value);
        } else if(value instanceof MonkeyDefinition) {
          Object.defineProperty(p, s, {value: value, enumerable: true, configurable: true});
        } else {
          p[s] = value;
        }
      }

      /**
       * Monkey
       */
      else if (operationType === 'monkey') {
        Object.defineProperty(p, s, {get: value, enumerable: true});
      }

      /**
       * Apply
       */
      else if (operationType === 'apply') {
        const result = value(p[s]);

        // Purity check
        if (opts.pure && result === value)
          return  {node: p[s]};

        p[s] = opts.persistent ? shallowClone(result) : result;
      }

      /**
       * Push
       */
      else if (operationType === 'push') {
        if (!type.array(p[s]))
          throw err(
            'push',
            'array',
            currentPath
          );

        if (opts.persistent)
          p[s] = p[s].concat([value]);
        else
          p[s].push(value);
      }

      /**
       * Unshift
       */
      else if (operationType === 'unshift') {
        if (!type.array(p[s]))
          throw err(
            'unshift',
            'array',
            currentPath
          );

        if (opts.persistent)
          p[s] = [value].concat(p[s]);
        else
          p[s].unshift(value);
      }

      /**
       * Concat
       */
      else if (operationType === 'concat') {
        if (!type.array(p[s]))
          throw err(
            'concat',
            'array',
            currentPath
          );

        if (opts.persistent)
          p[s] = p[s].concat(value);
        else
          p[s].push.apply(p[s], value);
      }

      /**
       * Splice
       */
      else if (operationType === 'splice') {
        if (!type.array(p[s]))
          throw err(
            'splice',
            'array',
            currentPath
          );

        if (opts.persistent)
          p[s] = splice.apply(null, [p[s]].concat(value));
        else
          p[s].splice.apply(p[s], value);
      }

      /**
       * Unset
       */
      else if (operationType === 'unset') {
        if (type.object(p))
          delete p[s];

        else if (type.array(p))
          p.splice(s, 1);
      }

      /**
       * Merge
       */
      else if (operationType === 'merge') {
        if (!type.object(p[s]))
          throw err(
            'merge',
            'object',
            currentPath
          );

        if (opts.persistent)
          p[s] = shallowMerge({}, p[s], value);
        else
          p[s] = shallowMerge(p[s], value);
      }

      /**
       * Deep merge
       */
      else if (operationType === 'deepMerge') {
        if (!type.object(p[s]))
          throw err(
            'deepMerge',
            'object',
            currentPath
          );

        if (opts.persistent)
          p[s] = deepMerge({}, p[s], value);
        else
          p[s] = deepMerge(p[s], value);
      }

      if (opts.immutable)
        deepFreeze(p);

      break;
    }

    // If we reached a leaf, we override by setting an empty object
    else if (type.primitive(p[s])) {
      p[s] = {};
    }

    // Else, we shift the reference and continue the path
    else if (opts.persistent) {
      p[s] = shallowClone(p[s]);
    }

    // Should we freeze the current step before continuing?
    if (opts.immutable && l > 0)
      freeze(p);

    p = p[s];
  }

  // Returning new data object
  return {data: dummy.root, node: p[s]};
}
