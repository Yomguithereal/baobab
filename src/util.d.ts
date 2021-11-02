// https://stackoverflow.com/a/58993872/4941530

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
// https://stackoverflow.com/questions/58434389
// type PathsOf<T> =
//     T extends object ?
//     T extends Array<infer Item> ?
//     [] | [number, ...PathsOf<Item>] :
//     Vals<{[P in keyof T]-?: [] | [P, ...PathsOf<T[P]>]}> :
//     [];


type Predicate<T> = (data: T) => boolean;
type Constraint<T> = Partial<T>;

type FullPathsOf<T> =
    T extends object ?
    T extends Array<infer Item> ?
    [] | [number, ...FullPathsOf<Item>] | [Predicate<Item>, ...FullPathsOf<Item>] | (Item extends object ? [Constraint<Item>, ...FullPathsOf<Item>] : []) :
    Vals<{[P in keyof T]-?: [] | [P, ...FullPathsOf<T[P]>]}> :
    [];

// https://stackoverflow.com/a/61648690
//  type DeepIndex<T, KS extends PropertyKey[], Fail = undefined> =
//     KS extends [infer F, ...infer R] ?
//     F extends keyof T ?
//     R extends PropertyKey[] ?
//     DeepIndex<T[F], R, Fail> :
//     Fail :
//     Fail :
//     T;

interface Fail1 {}
interface Fail2 {}
interface Fail3 {}

type Obj = Record<PropertyKey, unknown>;
export type FullKeys = (PropertyKey | Obj | Function)[];
export type FullDeepIndex<T, KS extends FullKeys> =
    KS extends [infer Keyish, ...infer Rest] // A: have a key?
    ? Rest extends FullKeys // B: rest is an array?
    ? Keyish extends Obj | Function // C: key is special?
    ? T extends Array<unknown> // D: value is array?
    ? FullDeepIndex<T[number], Rest> // descend with special key.
    : Fail1 // not D: special key on non-array value
    : Keyish extends keyof T // (not C) E: key is valid
    ? FullDeepIndex<T[Keyish], Rest> // descend with regular key
    : Fail2 // not E: invalid key
    : Fail3 // not B: not an array at all
    : T; // not A: stop descending

// TODO: immutable types causing tons problems in other packages using baobab
// export type Im<T> = Immutable<T>;
export type Im<T> = T;
// export type ImDI<T, P extends FullKeys> = Immutable<FullDeepIndex<T, P>>;
export type ImDI<T, P extends FullKeys> = FullDeepIndex<T, P>;
export type DP<T> = FullPathsOf<T>; // TODO? as FullKeys
export type DI<T, Path extends FullKeys> = FullDeepIndex<T, Path>;


export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

interface HeadOfErr {}
export type HeadOf<T extends any[]> = T extends [...infer Head, infer Last] ? Head : HeadOfErr;

export type IfEquals<T, U, Y = unknown, N = never> =
    (<G>() => G extends T ? 1 : 2) extends
    (<G>() => G extends U ? 1 : 2) ? Y : N;

type Foo = 'blarg' | 'smarf';
type IMFoo = Immutable<Foo>;