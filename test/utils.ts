import {strict as assert} from "assert";
import {inspect} from 'util';
// @ts-ignore
import type from '../src/type';

// Creating a special assertion for frozen objects
export function assertIsFrozen(v: object) {
  assert(
    type.primitive(v) || Object.isFrozen(v),
    inspect(v) + ' is not frozen.'
  );
};

export function assertIsNotFrozen(v: object) {
  assert(
    type.primitive(v) || !Object.isFrozen(v),
    inspect(v) + ' is frozen.'
  );
};
