export type Nullable<T> = T | null;

export type AnyKeyInArray<T> = {
    [K in keyof T]: keyof T[K]
}

export type NonEmptyArray<T> = [T, ...T[]];

export type OptionalMulti<T> = T | NonEmptyArray<T>;

export const prepOptionalMulti = <T>(value: OptionalMulti<T>): NonEmptyArray<T> => {
    return Array.isArray(value) ? value : [value];
}