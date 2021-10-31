/** Stricter and more informative types for Baobab. Otherwise identical. */
import Emitter from 'emmett';

interface PlainObject<T = any> {
  [key: string]: T;
}

type Predicate = (data: any) => boolean;
type Constraints = PlainObject;
type PathKey = string | number;
type PathElement = PathKey | Predicate | Constraints;
export type Path = PathElement[] | PathKey;

type Splicer = [number | PlainObject | ((...args: any[]) => any), ...any[]];

/**
 * This class is empty purposely. Baobab must be able to identify in an initial
 * state when it has to deal with Monkeys instanciation, and uses this dummy
 * class in that purpose.
 */
export class MonkeyDefinition {
  // Empty class intended
}

export class Monkey {
  // TODO
}

export interface BaobabOptions {
  autoCommit: boolean;
  asynchronous: boolean;
  immutable: boolean;
  lazyMonkeys: boolean;
  monkeyBusiness: boolean;
  persistent: boolean;
  pure: boolean;
  validate: null | ((previousData: any, data: any, affectedPaths?: Path[]) => (Error | undefined));
  validationBehavior: string;
}

export interface MonkeyOptions {
  immutable: boolean;
}

/**
 * This class only exists to group methods that are common to the Baobab and
 * Cursor classes. Since `Baobab.root` is a property while `Cursor#root` is a
 * method, Baobab cannot extend Cursor.
 */
export abstract class SCommonBaobabMethods extends Emitter {
  apply(path: Path, value: (state: any) => any): any;
  apply(value: (state: any) => any): any;

  clone(...args: PathElement[]): any;
  clone(path?: Path): any;

  concat(path: Path, value: any[]): any;
  concat(value: any[]): any;

  deepClone(...args: PathElement[]): any;
  deepClone(path?: Path): any;

  deepMerge(path: Path, value: PlainObject): any;
  deepMerge(value: PlainObject): any;

  exists(...args: PathElement[]): boolean;
  exists(path?: Path): boolean;

  get(...args: PathElement[]): any;
  get(path: Path): any;

  merge(path: Path, value: PlainObject): any;
  merge(value: PlainObject): any;

  pop(path?: Path): any;

  project(projection: (Path)[]): any[];
  project(projection: PlainObject<Path>): PlainObject;

  push(path: Path, value: any): any;
  push(value: any): any;

  release(): void;

  select(...args: PathElement[]): SCursor;
  select(path: Path): SCursor;

  serialize(...args: PathElement[]): any;
  serialize(path: Path): any;

  set(path: Path, value: any): any;
  set(value: any): any;

  shift(path?: Path): any;

  splice(path: Path, value: Splicer): any;
  splice(value: Splicer): any;

  unset(path?: Path): any;

  unshift(path: Path, value: any): any;
  unshift(value: any): any;
}

export class SWatcher extends Emitter {
  constructor(tree: SBaobab, mapping: PlainObject<Path | SCursor>);

  get(): PlainObject;
  getWatchedPaths(): Path[];
  getCursors(): PlainObject<SCursor>;
  refresh(mappings: PlainObject<Path | SCursor>): void;
  release(): void;
}

export class SCursor extends SCommonBaobabMethods implements Iterable<any> {
  path?: Path;
  solvedPath?: PathKey[];
  state: {
    killed: boolean;
    recording: boolean;
    undoing: boolean;
  };

  [Symbol.iterator](): IterableIterator<any>;

  // Navigation:
  up(): SCursor | null;
  down(): SCursor;
  left(): SCursor | null;
  right(): SCursor | null;
  leftmost(): SCursor | null;
  rightmost(): SCursor | null;
  root(): SCursor;

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

  map(fn: (v: any, index?: number) => any, scope?: any): any[];
}

/** Stricter and more informative types for Baobab. Otherwise identical. */
export class SBaobab<T extends PlainObject = PlainObject> extends SCommonBaobabMethods {
  constructor(initialState?: PlainObject, options?: Partial<BaobabOptions>);
  debugType: T;

  root: SCursor;
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

  watch(mappings: PlainObject<Path | SCursor>): SWatcher;

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
