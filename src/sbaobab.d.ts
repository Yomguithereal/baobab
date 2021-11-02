/** Stricter and more informative types for Baobab. Otherwise identical. 
 * TODO? Putting a couple more specific overloads of each function might improve client typechecking performance?
*/
import Emitter from 'emmett';
import {BaobabOptions, MonkeyDefinition, MonkeyOptions} from './baobab';
import type {DeepPartial, DI, DP, Im, ImDI, HeadOf} from './util';

interface PlainObject<T = any> {
  [key: string]: T;
}

type SimplePath = (string | number)[];
type SP = SimplePath;


type Splicer<T extends any[]> = [number] | [number, number] | [number, number, (oldVals: T) => T] | [number, number, ...T];
/**
 * This class only exists to group methods that are common to the Baobab and
 * Cursor classes. Since `Baobab.root` is a property while `Cursor#root` is a
 * method, Baobab cannot extend Cursor.
 */
export abstract class SCommonBaobabMethods<T, Root = unknown, FullPath = unknown> extends Emitter {


  //TODO?: problematic overload? https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#use-union-types
  apply(getNew: (state: T) => T): T;
  apply<K extends keyof T>(key: K, getNew: (state: Im<T[K]>) => Im<T[K]>): Im<T[K]>;
  apply<P extends DP<T>>(path: P, getNew: (state: ImDI<T, P>) => ImDI<T, P>): ImDI<T, P>;

  clone<P extends DP<T>>(...path: P): ImDI<T, P>;
  clone<P extends DP<T>>(path: DI<T, P>): ImDI<T, P>;

  // TODO?: could type guard for all array methods (concat, push, shift, splice, unshift) (not pop)
  concat(value: T): Im<T>;
  concat<P extends DP<T>>(path: P, value: DI<T, P>): ImDI<T, P>;

  deepClone<P extends DP<T>>(...args: P): ImDI<T, P>;
  deepClone<P extends DP<T>>(path: P): ImDI<T, P>;

  deepMerge(value: DeepPartial<T>): Im<T>;
  deepMerge<K extends keyof T>(path: K, value: DeepPartial<T[K]>): Im<T[K]>;
  deepMerge<P extends DP<T>>(path: P, value: DeepPartial<DI<T, P>>): ImDI<T, P>;

  exists<P extends DP<T>>(...args: P): ImDI<T, P>;
  exists<P extends DP<T>>(path: P): ImDI<T, P>;

  get(): Im<T>;
  get<K extends keyof T>(key: K): Im<T[K]>;
  get<P extends DP<T>>(...path: P): ImDI<T, P>;
  get<P extends DP<T>>(path: P): ImDI<T, P>;

  merge(value: Partial<T>): Im<T>;
  merge<K extends keyof T>(path: K, value: Partial<T[K]>): Im<T[K]>;
  merge<P extends DP<T>>(path: P, value: Partial<DI<T, P>>): ImDI<T, P>;

  // TODO?: could type guard only allow popping optional values
  pop(): Im<T>;
  pop<K extends keyof T>(key: K): Im<T[K]>;
  pop<P extends DP<T>>(path: P): ImDI<T, P>;

  project(projection: Record<string, DP<T>>): Record<string, DI<T, P>>; // TODO
  project<Proj extends DP<T>[]>(projection: Proj): unknown[];

  push(value: T[number]): Im<T>;
  push<K extends keyof T>(key: K, value: T[K][number]): Im<T[K]>;
  push<P extends DP<T>>(path: P, value: DI<T, P>[number]): ImDI<T, P>;

  release(): void;

  select<K extends keyof T>(key: K): SCursor<T[K], [...FullPath, K], Root>;
  select<P extends DP<T>>(...path: P): SCursor<DI<T, P>, [...FullPath, ...P], Root>;
  select<P extends DP<T>>(path: P): SCursor<DI<T, P>, [...FullPath, ...P], Root>;

  serialize<P extends DP<T>>(...args: P): string;
  serialize<P extends DP<T>>(path: P): string;

  set(value: T): Im<T>;
  set<K extends keyof T>(key: K, value: T[K]): T[K];
  set<P extends DP<T>>(path: P, value: DI<T, P>): ImDI<T, P>;

  shift(): Im<T>;
  shift<K extends keyof T>(key: K): T[K];
  shift<P extends DP<T>>(path: P, value: DI<T, P>[number]): ImDI<T, P>;

  splice(value: Splicer<T>): Im<T>;
  splice<P extends DP<T>>(path: P, value: Splicer<DI<T, P>>): ImDI<T, P>;

  unset(): void;
  unset<K extends keyof T>(key: K): void;
  unset<P extends DP<T>>(path: P): void;

  unshift(value: T[number]): Im<T>;
  shift<K extends keyof T>(key: K, value: T[K][number]): T[K];
  unshift<P extends DP<T>>(path: P, value: DI<T, P>[number]): ImDI<T, P>;
}

export class SWatcher<T, Mapping extends Record<string, DP<T>> | Record<string, keyof T>> extends Emitter {
  // TODO?: initialized with cursors
  constructor(tree: SBaobab, mapping: Mapping);

  get(): Mapping extends Record<string, keyof T> ? {[Name in keyof Mapping]: T[Mapping[Name]]} : {[Name in keyof Mapping]: ImDI<T, Mapping[Name]>};
  getWatchedPaths(): Mapping[keyof Mapping];
  getCursors(): unknown; // TODO
  refresh(mappings: Mapping): void;
  release(): void;
}

/**
 * @constructor
 * @param {Baobab}           tree       - The bound tree.
 * @param {MonkeyDefinition} definition - A definition instance.
 */
export class SMonkey<Root>  {
  constructor(tree: SBaobab<Root>, pathInTree: SimplePath, definition: MonkeyDefinition);
  relatedPaths(recursive: boolean): SimplePath[];
  update(): SMonkey<Root>;
  release(): void;
}


export class SCursor<T, FullPath extends DP<Root> = unknown, Root = unknown> extends SCommonBaobabMethods<T, Root, FullPath> implements Iterable<any> {
  constructor(tree: SBaobab<Root>, path: FullPath, hash: string);
  path?: FullPath;
  solvedPath?: SimplePath;
  state: {
    killed: boolean;
    recording: boolean;
    undoing: boolean;
  };

  [Symbol.iterator](): IterableIterator<any>;
  // Navigation:
  up(): SCursor<DI<Root, HeadOf<FullPath>>, HeadOf<FullPath>, Root>;
  down(): SCursor<DI<Root, [...FullPath, number]>, [...FullPath, number], Root>;
  left(): SCursor<T, FullPath, Root> | null;
  right(): SCursor<T, FullPath, Root> | null;
  leftmost(): SCursor<T, FullPath, Root> | null;
  rightmost(): SCursor<T, FullPath, Root> | null;
  root(): SCursor<Root, [], Root>;

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

  map<Return>(fn: (v: SCursor<T[number], [...FullPath, number], Root>, index: number) => Return, scope?: any): Return[];
}

/** Stricter and more informative types for Baobab. Otherwise identical. */
export class SBaobab<T extends PlainObject = PlainObject> extends SCommonBaobabMethods<T, [], T> {
  constructor(initialState?: T, options?: Partial<BaobabOptions>);
  debugType: T;

  root: SCursor<T, [], T>;
  options: BaobabOptions;

  update(
    path: SP,
    operation: {
      type: string,
      value: any,
      options?: {
        mutableLeaf?: boolean;
      };
    }
  ): this;

  commit(): this;

  getMonkey(path: SP): SMonkey<T>;

  watch<Mappings extends Record<string, DP<T>> | Record<string, keyof T>>(mappings: Mappings): SWatcher<T, Mappings>;

  static monkey(definition: {cursors?: PlainObject<SP>; get(data: PlainObject): any; options?: MonkeyOptions;}): MonkeyDefinition;

  /* tslint:disable:unified-signatures */
  // Polymorphisms for:
  // `.monkey(...paths: Path[], get: (v1: any) => any)`
  static monkey(path1: SP, get: (value: any) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: SP, path2: SP, get: (...values: [any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: SP, path2: SP, path3: SP, get: (...values: [any, any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: SP, path2: SP, path3: SP, path4: SP, get: (...values: [any, any, any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  static monkey(path1: SP, path2: SP, path3: SP, path4: SP, path5: SP, get: (...values: [any, any, any, any, any]) => any, options?: MonkeyOptions): MonkeyDefinition;
  // Fallback:
  static monkey(...pathsEndingWithGetAndMaybeOptions: (SP | ((...values: any[]) => any) | MonkeyOptions)[]): MonkeyDefinition;

  // Polymorphisms for:
  // `.monkey(definition: [...paths: SP[], get: (v1: any) => any])`
  static monkey(args: [SP, (value: any) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [SP, SP, (...values: [any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [SP, SP, SP, (...values: [any, any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [SP, SP, SP, SP, (...values: [any, any, any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  static monkey(args: [SP, SP, SP, SP, SP, (...values: [any, any, any, any, any]) => any], options?: MonkeyOptions): MonkeyDefinition;
  // Fallback:
  static monkey(pathsEndingWithGet: (SP | ((...values: any[]) => any) | MonkeyOptions)[]): MonkeyDefinition;
  /* tslint:enable:unified-signatures */

  static dynamicNode: typeof SBaobab.monkey;
}