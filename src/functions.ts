
type Omitted<T, R extends keyof T> = {
  [K in keyof T]: R extends K ? never : T[K];
}

export function omit<T, R extends keyof T>(t: T, attr: R): Omitted<T, R> {
  const result: T = { ...t };
  delete result[attr];
  return result as Omitted<T, R>;
}