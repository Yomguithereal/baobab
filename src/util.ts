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


// https://stackoverflow.com/a/65963590
type PathTree<T> = {
    [P in keyof T]-?: T[P] extends object
    ? [P] | [P, ...DeepPath<T[P]>]
    : [P];
};

export type DeepPath<T> = PathTree<T>[keyof PathTree<T>];

// https://stackoverflow.com/a/61648690
type Keys = readonly PropertyKey[];
export type DeepIndex<T, KS extends Keys, Fail = undefined> =
    KS extends [infer F, ...infer R] ? F extends keyof T ? R extends Keys ?
    DeepIndex<T[F], R, Fail> : Fail : Fail : T;


export type Im<T> = Immutable<T>;
export type DP<T> = DeepPath<T>;
export type DI<T, KS extends Keys, Fail = undefined> = DeepIndex<T, KS, Fail>;
