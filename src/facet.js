/**
 * Baobab Facet Class
 * ===================
 *
 * A class in charge of tree's computed data node.
 */
import type from './type';
import {
  identity,
  makeError
} from './helpers';

/**
 * Facet class
 *
 * @constructor
 */
export default class Facet {
  constructor(path, definition) {

    // Checking definition's type
    const definitionType = type.facetDefinition(definition);

    // If the definition type is not valid, we cry
    if (!definitionType)
      throw makeError(
        'Baobab.Facet: attempting to create a computed data node with a ' +
        `wrong definition (path: /${path.join('/')}).`,
        {path, definition}
      );
  }
}
