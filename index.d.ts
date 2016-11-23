/**
 * TypeScript Definitely Typed File for Baobab
 */

declare module "baobab" {
  interface WatchedPaths {
    [pathX: string]: Array<any>;
  }

  interface Event {
    // tslint:disable-next-line: no-reserved-keywords
    type: string;
    data: {
      previousData: any;
      currentData: any;
      transaction: any;
      paths: Array<any>;
    };
  }

  type TreeEventType = "update" | "write" | "invalid" | "get" | "select";

  type CursorEventType = "update";

  interface FuncEventCallback {
    (e: Event): void;
  }

  interface WatcherCursors {
    [pathX: string]: Array<Cursor>;
  }

  type ValidationBehavior = 'rollback' | 'notify';

  /**
   * Baobab defaults
   */
  interface Options {
    // Should the tree handle its transactions on its own?
    autoCommit?: boolean;

    // Should the transactions be handled asynchronously?
    asynchronous?: boolean;

    // Should the tree's data be immutable?
    immutable?: boolean;

    // Should the monkeys be lazy?
    lazyMonkeys?: boolean;

    // Should the tree be persistent?
    persistent?: boolean;

    // Should the tree's update be pure?
    pure?: boolean;

    // Validation specifications
    validate?: any;

    // Validation behavior 'rollback' or 'notify'
    validationBehavior?: ValidationBehavior;
  }

  /**
   * Baobab class
   *
   * @constructor
   * @param {object|array} [initialData={}]    - Initial data passed to the tree.
   * @param {object}       [opts]              - Optional options.
   * @param {boolean}      [opts.autoCommit]   - Should the tree auto-commit?
   * @param {boolean}      [opts.asynchronous] - Should the tree's transactions
   *                                             handled asynchronously?
   * @param {boolean}      [opts.immutable]    - Should the tree be immutable?
   * @param {boolean}      [opts.persistent]   - Should the tree be persistent?
   * @param {boolean}      [opts.pure]         - Should the tree be pure?
   * @param {function}     [opts.validate]     - Validation function.
   * @param {string}       [opts.validationBehaviour] - "rollback" or "notify".
   */
  class Baobab {
    constructor(initialData: {}, opts: Options);

    /**
     * Method used to select data within the tree by creating a cursor. Cursors
     * are kept as singletons by the tree for performance and hygiene reasons.
     *
     * Arity (1):
     * @param {path}    path - Path to select in the tree.
     *
     * Arity (*):
     * @param {...step} path - Path to select in the tree.
     *
     * @return {Cursor}      - The resultant cursor.
     */
    public select(...path: Array<any>): Cursor;

    /**
     * Method used to get data from the tree. Will fire a `get` event from the
     * tree so that the user may sometimes react upon it to fetch data, for
     * instance.
     *
     * Arity (1):
     * @param  {path}   path           - Path to get in the tree.
     *
     * Arity (2):
     * @param  {..step} path           - Path to get in the tree.
     *
     * @return {mixed}                 - Data at path.
     */
    // tslint:disable: no-reserved-keywords
    public get(): any;
    public get(...path: Array<any>): any;

    /**
     * Method used to set data to the tree.
     *
     * Arity (1):
     * @param  {mixed} value - New value to set at cursor's path.
     *
     * Arity (2):
     * @param  {path}  path  - Subpath to update starting from cursor's.
     * @param  {mixed} value - New value to set.
     *
     * @return {mixed}       - Data at path.
     */
    public set(newValue: any): any;
    public set(path: Array<any>, newValue: any): any;

    /**
     * Method committing the updates of the tree and firing the tree's events.
     *
     * @return {Baobab} - The tree instance for chaining purposes.
     */
    public commit(): Baobab;

    public on(eventType: TreeEventType | Array<TreeEventType>, cb: FuncEventCallback): void;
    public off(eventType: TreeEventType | Array<TreeEventType>, cb: FuncEventCallback): void;

    /**
     * Method used to watch a collection of paths within the tree. Very useful
     * to bind UI components and such to the tree.
     *
     * @param  {object} mapping - Mapping of paths to listen.
     * @return {Cursor}         - The created watcher.
     */
    public watch(paths: WatchedPaths): Watcher;

    /**
     * Method releasing the tree and its attached data from memory.
     */
    public release(): void;

    /**
     * Overriding the `toJSON` method for convenient use with JSON.stringify.
     *
     * @return {mixed} - Data at cursor.
     */
    public toJSON(): any;

    /**
     * Method used to return raw data from the tree, by carefully avoiding
     * computed one.
     *
     * @todo: should be more performant as the cloning should happen as well as
     * when dropping computed data.
     *
     * Arity (1):
     * @param  {path}   path           - Path to serialize in the tree.
     *
     * Arity (2):
     * @param  {..step} path           - Path to serialize in the tree.
     *
     * @return {mixed}                 - The retrieved raw data.
     */
    public serialize(...path: Array<any>): any;

    /**
     * Overriding the `toString` method for debugging purposes.
     *
     * @return {string} - The baobab's identity.
     */
    public toString(): string;
  }

  /**
   * Cursor class
   *
   * @constructor
   * @param {Baobab} tree   - The cursor's root.
   * @param {array}  path   - The cursor's path in the tree.
   * @param {string} hash   - The path's hash computed ahead by the tree.
   */
  class Cursor {
    constructor(tree: Baobab, path: Array<any>, hash: string);

    /**
     * Predicates
     * -----------
     */

    /**
     * Method returning whether the cursor is at root level.
     *
     * @return {boolean} - Is the cursor the root?
     */
    public isRoot(): boolean;

    /**
     * Method returning whether the cursor is at leaf level.
     *
     * @return {boolean} - Is the cursor a leaf?
     */
    public isLeaf(): boolean;

    /**
     * Method returning whether the cursor is at branch level.
     *
     * @return {boolean} - Is the cursor a branch?
     */
    public isBranch(): boolean;

    /**
     * Method returning the root cursor.
     *
     * @return {Baobab} - The root cursor.
     */
    public root(): Baobab;

    /**
     * Method used to get data from the cursor. Will fire a `get` event from the
     * tree so that the user may sometimes react upon it to fetch data, for
     * instance.
     *
     * Arity (1):
     * @param  {path}   path           - Path to get in the tree.
     *
     * Arity (2):
     * @param  {..step} path           - Path to get in the tree.
     *
     * @return {mixed}                 - Data at path.
     */
    // tslint:disable: no-reserved-keywords
    public get(): any;
    public get(...path: Array<any>): any;

    /**
     * Method used to set data to the cursor.
     *
     * Arity (1):
     * @param  {mixed} value - New value to set at cursor's path.
     *
     * Arity (2):
     * @param  {path}  path  - Subpath to update starting from cursor's.
     * @param  {mixed} value - New value to set.
     *
     * @return {mixed}       - Data at path.
     */
    public set(newValue: any): any;
    public set(path: Array<any>, newValue: any): any;

    /**
     * Method selecting a subpath as a new cursor.
     *
     * Arity (1):
     * @param  {path} path    - The path to select.
     *
     * Arity (*):
     * @param  {...step} path - The path to select.
     *
     * @return {Cursor}       - The created cursor.
     */
    public select(...path: Array<any>): Cursor;

    public clone(...args: Array<any>): any;
    public deepClone(...args: Array<any>): any;

    /**
     * Method used to return raw data from the cursor, by carefully avoiding
     * computed one.
     *
     * @todo: should be more performant as the cloning should happen as well as
     * when dropping computed data.
     *
     * Arity (1):
     * @param  {path}   path           - Path to serialize in the tree.
     *
     * Arity (2):
     * @param  {..step} path           - Path to serialize in the tree.
     *
     * @return {mixed}                 - The retrieved raw data.
     */
    public serialize(...path: Array<any>): any;

    /**
     * Methods releasing the cursor from memory.
     */
    public release(): void;

    /**
     * Overriding the `toJSON` method for convenient use with JSON.stringify.
     *
     * @return {mixed} - Data at cursor.
     */
    public toJSON(): any;

    /**
     * Overriding the `toString` method for debugging purposes.
     *
     * @return {string} - The cursor's identity.
     */
    public toString(): string;

    public on(eventType: CursorEventType, cb: FuncEventCallback): void;
    public off(eventType: CursorEventType, cb: FuncEventCallback): void;

    /**
     * Method returning the parent node of the cursor or else `null` if the
     * cursor is already at root level.
     *
     * @return {Baobab} - The parent cursor.
     */
    public up(): Cursor;
    public push(newItem: any): Array<any>;
    /**
     * Method like Array.splice().
     *
     * @param {p} - A array whose elements are start, deleteCount[, item1[, item2[, ...]]]
     * @return {Array<any>} - The resulted array.
     */
    public splice(p: Array<any>): Array<any>;
    //public map(cb: (itemCursor: Cursor, itemIndex: number) => any): Array<any>;
  }

  /**
   * Watcher class.
   *
   * @constructor
   * @param {Baobab} tree     - The watched tree.
   * @param {object} mapping  - A mapping of the paths to watch in the tree.
   */
  class Watcher {
    constructor(tree: Baobab, watchedPaths: WatchedPaths);

    // tslint:disable: no-reserved-keywords
    public get(): any;

    public release(): void;

    public on(eventType: CursorEventType, cb: FuncEventCallback): void;
    public off(eventType: CursorEventType, cb: FuncEventCallback): void;

    /**
     * Method used to get the current watched paths.
     *
     * @return {array} - The array of watched paths.
     */
    public getWatchedPaths(): Array<any>;

    /**
     * Method used to return a map of the watcher's cursors.
     *
     * @return {object} - TMap of relevant cursors.
     */
    public getCursors(): WatcherCursors;

    /**
     * Methods releasing the watcher from memory.
     */
    public release(): void;

    /**
     * Method used to refresh the watcher's mapping.
     *
     * @param  {object}  mapping  - The new mapping to apply.
     * @return {Watcher}          - Itself for chaining purposes.
     */
    public refresh(mapping: WatchedPaths): Watcher;
  }
}
