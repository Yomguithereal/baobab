# Changelog

## v2.3.0

* Adding the `tree/cursor.clone` and the `tree/cursor.deepClone` methods.
* Adding the `tree/cursor.pop` and the `tree/cursor.shift` methods.
* Adding a way to disable a single monkey's immutability.
* Fixing an issue where the `tree.commit` method would fire a useless update.
* Fixing an issue related to updates and dynamic paths.
* Fixing the `tree/cursor.splice` to correctly handle negative indexes.
* Fixing a bug related to eager monkeys and immutability.

## v2.2.1

* Fixing a bug with watcher not able to handle path polymorphisms.

## v2.2.0

* Cursors are now ES6 iterables ([@kirjs](https://github.com/kirjs)).
* Dropping the `.babelrc` file from the npm build.

## v2.1.2

* Storing hashed paths using `λ` as delimiter instead of `/` to enable some edge cases ([@nivekmai](https://github.com/nivekmai)).
* Fixing an issue with cursors where a stopped history wouldn't restart correctly ([@nikvm](https://github.com/nikvm)).
* Fixing monkeys' laziness.
* Fixing an edge case when one watches over paths beneath monkeys.

## v2.1.1

* Fixing existence checking of `undefined` values.
* Fixing the `lazyMonkeys` option.
* Fixing the tree's behavior regarding ES6 collections ([@askmatey](https://github.com/askmatey)).
* Fixing the `splice` method ([@SaphuA](https://github.com/SaphuA)).

## v2.1.0

* Adding the `lazyMonkeys` option.
* Adding relative paths for monkeys' dependencies.

## v2.0.1

* Fixing monkeys' laziness ([@Zache](https://github.com/Zache)).
* Fixing issues related to the root cursor.
* Fixing `get` event edge cases.

## v2.0.0

* The tree is now immutable by default.
* Cursor's setters method won't return themselves but rather the affected node now.
* Adding `cursor.concat`.
* Adding `cursor.deepMerge`.
* Adding `cursor.serialize`.
* Adding `cursor.project`.
* Adding `cursor.exists`.
* Adding `tree.watch`.
* Adding the `pure` option.
* Changing the way you can define computed data in the tree, aka "facets". Facets are now to be defined within the tree itself, are called "monkeys", and can be accessed using the exact same API as normal data.
* Adding an alternative dynamic node definition syntax for convenience.
* Dropped the `syncwrite` option. The tree is now writing synchronously but still emits its updates asynchronously by default.
* Max number of records is now set to `Infinity` by default, meaning there is no limit.
* Update events are now exposing the detail of each transaction so you can replay them elsewhere.
* Fixing `cursor.push/unshift` behavior.
* Dropped the `$cursor` helper.
* Dropped the `update` specs for a simpler transaction syntax.
* Updated `emmett` to `3.1.1`.
* ES6 codebase rewrite.
* Full code self documentation.

## v1.1.1

* Updating `emmett` to `v3.0.1`.
* Adding missing setters methods to the tree.
* Fixing `cursor.root` method.

## v1.1.0

* Adding an `immutable` option to the tree.
* Adding a `syncwrite` option to the tree.
* Adding a `get` and `select` event to the tree.
* Facets getters are now applied within the tree's scope.
* `update` events are now exposing the related data for convenience.
* Fixing a `$cursor` related bug.
* Fixing `type.Primitive`.
* Fixing `facet.release` issues.

## v1.0.3

* Exposing `Cursor` and `Facet` classes for type checking ([@charlieschwabacher](https://github.com/charlieschwabacher)).
* Fixing `type.Object`.
* Fixing root updates.

## v1.0.2

* Fixing facets related issues (internal).
* Fixing cases where falsy paths in cursors setters would fail the update.
* Fixing `$splice` behavior.
* Fixing `$merge` behavior.
* Persistent history rather than deep cloned.
* Improving performances on single update cases.

## v1.0.1

* Fixing scope argument of `tree.createFacet`.
* Fixing facet mappings edge cases.
* Facets can now use facets.
* Fixing merge edge cases.
* Fixing update edge cases.
* Fixing bug where setting falsy values would fail.

## v1.0.0

* Dropping `cursor.edit` and `cursor.remove` in favor of `cursor.set` and `cursor.unset` polymorphisms.
* Dropping `typology` dependency.
* Dropping options: `clone`, `cloningFunction`, `singletonCursors`, `shiftReferences`, `maxHistory`, `mixins` and `typology`.
* Updated `emmett` to `v3.0.0`.
* Moving react integration to [baobab-react](https://github.com/Yomguithereal/baobab-react).
* Shifting references is now default.
* Adding facets.
* Adding `$splice` keyword and `cursor.splice`.
* Adding `validationBehavior` option.
* Adding `$cursor` paths.
* Adding path polymorphisms to every cursor's setters.
* Reworking history to work at cursor level.
* Reworking validation process.
* Fixing some bugs.

## v0.4.4

* Fixing `cursor.root`.
* Fixing `cursor.release`.
* Fixing build procedure for latest `node` and `browserify` versions.
* I9 support.

## v0.4.3

* Adding React mixins function polymorphisms thanks to [@denisw](https://github.com/denisw).
* Fixing `cursor.chain` thanks to [@jonypawks](https://github.com/jonypawks).
* Fixing transaction flow issues thanks to [@jmisterka](https://github.com/jmisterka).

## v0.4.2

* Fixing deep object comparison and dynamic paths matching thanks to [@angus-c](https://github.com/angus-c).

## v0.4.1

* Safer cursor update methods.
* Fixing `cursor.chain`.
* Fixing unset behavior when acting on lists.
* Fixing release methods.
* Path polymorphism for `tree/cursor.set`.
* Adding `tree/cursor.root` method.
* Reducing leak risks by making cursors and combinations lazier.

## v0.4.0

* Several webpack-friendly changes.
* Fixing complex paths solving.
* Better `release` methods.
* Tree instantiation minimal polymorphism.
* Shooting gremlins in the head.
* Better internals.
* Implementing the `unset` and `remove` methods.

## v0.3.2

* Bug fixes thanks to [@jacomyal](https://github.com/jacomyal), [@jondot](https://github.com/jondot).
* Better perfs thanks to [@christianalfoni](https://github.com/christianalfoni).
* `release` method for the tree.

## v0.3.1

* Fixing reference shifting behaviours.
* `release` method for cursors.

## v0.3.0

* Exposing `getIn` helper.
* Merged mixins are now executed after baobab's ones.
* Cursor combinations.
* Cursor data now available through component's state.
* Retrieval and selection sugar with functions and descriptive objects.
* Adding `referenceShifting` option.
* Cursor predicates.
* `$merge` command.
* Various optimizations and bug fixes.

## v0.2.2

* Updating dependencies.
* Fixing several bugs.
* Better unit testing for mixins.
* `mixins` settings.
* Bower support.

## v0.2.1

* Several bug fixes.
