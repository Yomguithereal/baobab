// https://stackoverflow.com/a/58993872/4941530

import {Path} from "./baobab";

// eslint-disable-next-line @typescript-eslint/ban-types
type ImmutablePrimitive = undefined | null | boolean | string | number | Function;

export type Immutable<T> =
    T extends ImmutablePrimitive ? T :
    T extends Array<infer U> ? ImmutableArray<U> :
    T extends Map<infer K, infer V> ? ImmutableMap<K, V> :
    T extends Set<infer M> ? ImmutableSet<M> : ImmutableObject<T>;

type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = {readonly [K in keyof T]: Immutable<T[K]>};

type Vals<T> = T[keyof T];
type PathsOf<T> =
    T extends Array<infer X> ? X extends object ? [number, ...PathsOf<X>] : [number] :
    Vals<{
        [P in keyof T]-?: T[P] extends object
        ? [P] | [P, ...PathsOf<T[P]>]
        : [P];
    }>;


type Predicate<T> = (data: T) => boolean;
type Constraint<T> = Partial<T>;

type FullPathTree<T> = {
    [P in keyof T]-?: T[P] extends object
    ? [P] | [Predicate<P>] | [Constraint<P>] | [P, ...FullDeepPath<T[P]>] | [Predicate<P>, ...FullDeepPath<T[P]>] | [Constraint<P>, ...FullDeepPath<T[P]>]
    : [P];
};



export type FullDeepPath<T> = FullPathTree<T>[keyof PathTree<T>];

// https://stackoverflow.com/a/61648690
type Keys = readonly PropertyKey[];
export type DeepIndex<T, KS extends Keys, Fail = undefined> =
    KS extends [infer F, ...infer R] ?
    F extends keyof T ?
    R extends Keys ?
    DeepIndex<T[F], R, Fail> :
    Fail :
    Fail :
    T;

interface Fail1 {}
interface Fail2 {}
interface Fail3 {}
interface Fail4 {}
interface Fail5 {}
interface Fail6 {}

interface Wrapper1<T> {val: T;}
interface Wrapper2<T> {val: T;}
interface Wrapper3<T> {val: T;}
interface Wrapper4<T> {val: T;}

type Obj = Record<PropertyKey, unknown>;
export type FullKeys = (PropertyKey | Obj | Function)[];
export type FullDeepIndex<T, KS extends FullKeys> =  //, Fail = undefined> =
    KS extends [infer Keyish, ...infer Rest] // have a key?
    ? Rest extends FullKeys // rest is an array?
    ? Keyish extends Obj | Function // key is special
    ? T extends Array<unknown> // value is array
    ? FullDeepIndex<T[number], Rest> // descend with special key
    : Fail1 // special key on non-array value
    : Keyish extends keyof T // (key not special) key is valid
    ? FullDeepIndex<T[Keyish], Rest> // descend with regular key
    : Fail2 // invalid key
    : Fail3 // not an array at all
    : T; // otherwise


export type Im<T> = Immutable<T>;
// export type DP<T> = DeepPath<T>;
export type DP<T> = FullDeepPath<T>;
export type DI<T, KS extends FullKeys> = FullDeepIndex<T, KS>;

export type At<T, K> = K extends keyof T ? T[K] : K extends FullKeys ? FullDeepIndex<T, K> : Fail4;
export type Ks<T> = keyof T | FullDeepPath<T>;

// const o = {x: 1};
// function f() {}
// type Test<T> = T extends Obj ? number : string;
// type T1 = Test<typeof o>;
// type T2 = Test<typeof f>;

const o1 = {x: {y: {z: 1}}};
type T1 = At<typeof o1, ['x', 'y', 'z']>;
type O2 = {x: {y: {k: number; val: string;}[];};};
type T2 = At<O2, ['x', 'y', {k: 4;}, 'val']>;
type DP1 = DeepPath<{nums: {key: string, val: string;}[];}>;