/** Stricter and more informative types for Baobab. Otherwise identical. 
 * TODO? Putting a couple more specific overloads of each function might improve client typechecking performance?
*/
import Emitter from 'emmett';
import {BaobabOptions, Monkey, MonkeyDefinition, MonkeyOptions} from './baobab';
import type {DeepPartial, DI, DP, Im, ImDI} from './util';

interface PlainObject<T = any> {
  [key: string]: T;
}


type Splicer<T extends any[]> = [number] | [number, number] | [number, number, (oldVals: T) => T] | [number, number, ...T];
/**
 * This class only exists to group methods that are common to the Baobab and
 * Cursor classes. Since `Baobab.root` is a property while `Cursor#root` is a
 * method, Baobab cannot extend Cursor.
 */
export abstract class SCommonBaobabMethods<T> extends Emitter {


  //TODO?: problematic overload? https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#use-union-types
  apply(getNew: (state: T) => T): T;
  apply<K extends keyof T>(key: K, getNew: (state: Im<T[K]>) => Im<T[K]>): Im<T[K]>;
  apply<P extends DP<T>>(path: P, getNew: (state: ImDI<T, P>) => ImDI<T, P>): ImDI<T, P>;

  clone(): Im<T>;
  clone<P extends DP<T>>(...path: P): ImDI<T, P>;
  clone<P extends DP<T>>(path: DI<T, P>): ImDI<T, P>;

  // TODO: type guard for array
  concat(value: T): Im<T>;
  concat<P extends DP<T>>(path: P, value: DI<T, P>): ImDI<T, P>;

  deepClone<P extends DP<T>>(...args: P): ImDI<T, P>;
  deepClone<P extends DP<T>>(path?: P): ImDI<T, P>;

  deepMerge(value: DeepPartial<T>): Im<T>;
  deepMerge<K extends keyof T>(path: K, value: DeepPartial<T[K]>): Im<T[K]>;
  deepMerge<P extends DP<T>>(path: P, value: DeepPartial<DI<T, P>>): ImDI<T, P>;

  exists<P extends DP<T>>(...args: P): ImDI<T, P>;
  exists<P extends DP<T>>(path?: P): ImDI<T, P>;

  get<P extends DP<T>>(...path: P): ImDI<T, P>;
  get<P extends DP<T>>(path: P): ImDI<T, P>;

  merge(value: Partial<T>): Im<T>;
  merge<K extends keyof T>(path: K, value: Partial<T[K]>): Im<T[K]>;
  merge<P extends DP<T>>(path: P, value: Partial<DI<T, P>>): ImDI<T, P>;

  pop(): T[number];
  pop<P extends DP<T>>(path: P): ImDI<T, P>[number];// TODO: type gaurds

  project(projection: Record<string, DP<T>>): Record<string, DI<T, P>>; // TODO
  project<Proj extends DP<T>[]>(projection: Proj): unknown[];

  push(value: T[number]): Im<T>;
  push<P extends DP<T>>(path: P, value: DI<T, P>[number]): ImDI<T, P>;

  release(): void;

  select<P extends DP<T>>(...path: P): SCursor<DI<T, P>>;
  select<P extends DP<T>>(path: P): SCursor<DI<T, P>>;

  serialize<P extends DP<T>>(...args: P): string;
  serialize<P extends DP<T>>(path: P): string;

  set(value: T): Im<T>;
  set<K extends keyof T>(key: K, value: T[K]): T[K];
  set<P extends DP<T>>(path: P, value: DI<T, P>): ImDI<T, P>;

  shift(value: T[number]): Im<T>;
  shift<P extends DP<T>>(path: P, value: DI<T, P>[number]): ImDI<T, P>;

  splice(value: Splicer<T>): Im<T>; // TODO
  splice<P extends DP<T>>(path: P, value: Splicer<DI<T, P>>): ImDI<T, P>;

  unset(): void;
  unset<K extends keyof T>(key: K): void;
  unset<P extends DP<T>>(path: P): void;

  unshift(value: T[number]): Im<T>;
  unshift<P extends DP<T>>(path: P, value: DI<T, P>[number]): ImDI<T, P>;
}

export class SWatcher<T> extends Emitter {
  constructor(tree: SBaobab, mapping: PlainObject<Path | SCursor<T>>);

  get(): PlainObject;
  getWatchedPaths(): Path[];
  getCursors(): PlainObject<SCursor<T>>;
  refresh(mappings: PlainObject<Path | SCursor<T>>): void;
  release(): void;
}

export class SCursor<T> extends SCommonBaobabMethods<T> implements Iterable<any> {
  path?: Path;
  solvedPath?: PathKey[];
  state: {
    killed: boolean;
    recording: boolean;
    undoing: boolean;
  };

  [Symbol.iterator](): IterableIterator<any>;

  // Navigation:
  up(): SCursor<T> | null;
  down(): SCursor<T>;
  left(): SCursor<T> | null;
  right(): SCursor<T> | null;
  leftmost(): SCursor<T> | null;
  rightmost(): SCursor<T> | null;
  root(): SCursor<T>;

  // Predicates:
  isLeaf(): boolean;
  isRoot(): boolean;
  isBranch(): boolean;

  // History:
  hasHistory(): boolean;
  getHistory(): any[];
  clearHistory(): this;
  startRecording(maxRecords?: number): this;
  stopRecording(): this;
  undo(steps?: number): this;

  // Others:
  toJSON(): string;
  toString(): string;

  map<S>(fn: (v: SCursor<T[number]>, index: number) => S, scope?: any): S[];
}

/** Stricter and more informative types for Baobab. Otherwise identical. */
export class SBaobab<T extends PlainObject = PlainObject> extends SCommonBaobabMethods<T> {
  constructor(initialState?: T, options?: Partial<BaobabOptions>);
  debugType: T;

  root: SCursor<T>;
  options: BaobabOptions;

  update(
    path: Path,
    operation: {
      type: string,
      value: any,
      options?: {
        mutableLeaf?: boolean;
      };
    }
  ): this;

  commit(): this;

  getMonkey(path: Path): Monkey;

  watch(mappings: PlainObject<Path | SCursor<T>>): SWatcher<T>;

  static monkey(definition: {cursors?: PlainObject<Path>; get(data: PlainObject): any; options?: MonkeyOptions;}): MonkeyDefinition;

  /* tslint:disable:unified-signatures */
  // Polymorphisms for:
  // `.monkey(...paths: Path[], get: (v1: any) => any)`
  static monkey(path1: Path, get: (value: any) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: Path, path2: Path, get: (...values: [any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: Path, path2: Path, path3: Path, get: (...values: [any, any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: Path, path2: Path, path3: Path, path4: Path, get: (...values: [any, any, any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: Path, path2: Path, path3: Path, path4: Path, path5: Path, get: (...values: [any, any, any, any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  // Fallback:
  static monkey(...pathsEndingWithGetAndMaybeOptions: (Path | ((...values: any[]) => any) | MonkeyOptions)[]): MonkeyDefinition;

  // Polymorphisms for:
  // `.monkey(definition: [...paths: Path[], get: (v1: any) => any])`
  static monkey(args: [Path, (value: any) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [Path, Path, (...values: [any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [Path, Path, Path, (...values: [any, any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [Path, Path, Path, Path, (...values: [any, any, any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [Path, Path, Path, Path, Path, (...values: [any, any, any, any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  // Fallback:
  static monkey(pathsEndingWithGet: (Path | ((...values: any[]) => any) | MonkeyOptions)[]): MonkeyDefinition;
  /* tslint:enable:unified-signatures */

  static dynamicNode: typeof SBaobab.monkey;
}

export default SBaobab;
