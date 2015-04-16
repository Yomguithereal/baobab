# Changelog

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

* Adding React mixins function polymorphisms thanks to **@denisw**.
* Fixing `cursor.chain` thanks to **@jonypawks**.
* Fixing transaction flow issues thanks to **@jmisterka**.

## v0.4.2

* Fixing deep object comparison and dynamic paths matching thanks to **@angus-c**.

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

* Bug fixes thanks to **@jacomyal**, **@jondot**.
* Better perfs thanks to **@christianalfoni**.
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
