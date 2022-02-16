// Nullable type
export type Nullable<T> = T | null;

// Gets all keys in an array of types
export type AnyKeyInArray<T> = {
  [K in keyof T]: keyof T[K];
};

// An array with atleast one element
export type NonEmptyArray<T> = [T, ...T[]];

// A single value or array of values
export type OptionalMulti<T> = T | NonEmptyArray<T>;

// A single value, array of values, or empty array
export type OptionalEmptyMulti<T> = T | T[];

// Source: https://stackoverflow.com/a/58310689
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Makes sure an optional multi is always an array.
 * @param value The value, single value or array of values.
 * @returns An array of the single value or values.
 */
export const prepOptionalMulti = <T>(
  value: OptionalMulti<T>
): NonEmptyArray<T> => {
  return Array.isArray(value) ? value : [value];
};

/**
 * Makes sure an optional empty multi is always an array.
 * @param value The value, single value, empty array, or array of values.
 * @returns An array of the single value, values, or empty.
 */
export const prepOptionalEmptyMulti = <T>(
  value: OptionalEmptyMulti<T>
): T[] => {
  return Array.isArray(value) ? value : [value];
};
