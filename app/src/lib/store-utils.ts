/**
 * Typesafe object update utilities for Zustand stores.
 *
 * These helpers eliminate the repetitive `{ ...obj, ...updates }` spread
 * pattern and provide a more readable, composable way to do partial updates
 * on deeply-nested state.
 */

/**
 * Merges `updates` into `base`, returning a new object.
 *
 * Accepts either a plain partial object or an updater function. The updater
 * function form is useful when the new values depend on the current state of
 * `base` (e.g. incrementing a counter, deriving a new title).
 *
 * @param base - The original object to update. Never mutated.
 * @param updates - A partial object whose keys override those in `base`, or a
 *   function that receives `base` and returns such a partial object.
 * @returns A new object with all properties of `base` shallow-merged with the
 *   resolved `updates`.
 *
 * @example
 * patch(tab, { pinned: true })
 * patch(tab, (t) => ({ title: t.title + ' (copy)' }))
 */
export function patch<T extends object>(
  base: T,
  updates: Partial<T> | ((base: T) => Partial<T>)
): T {
  const resolved = typeof updates === 'function' ? updates(base) : updates;
  return { ...base, ...resolved };
}

/**
 * Updates a single nested key inside `base` via a shallow merge.
 *
 * Only works when the value at `key` is itself an object — the type constraint
 * `T[K] extends object` is enforced at the type level so callers cannot
 * accidentally target a primitive field.
 *
 * @param base - The original object to update. Never mutated.
 * @param key - The key of the nested object property to update.
 * @param updates - A partial object to merge into `base[key]`, or a function
 *   that receives the current value at `key` and returns such a partial object.
 * @returns A new object where `base[key]` has been shallow-merged with the
 *   resolved `updates`. All other top-level properties are unchanged.
 *
 * @example
 * patchNested(tab, 'readingState', { currentIndex: 3 })
 * patchNested(tab, 'readingState', (rs) => ({ sections: parsed }))
 */
export function patchNested<T extends object, K extends keyof T>(
  base: T,
  key: K,
  updates:
    | (T[K] extends object ? Partial<T[K]> : never)
    | ((value: T[K]) => T[K] extends object ? Partial<T[K]> : never)
): T {
  const current = base[key];
  const resolved =
    typeof updates === 'function'
      ? (updates as (v: T[K]) => Partial<T[K] & object>)(current)
      : updates;
  return { ...base, [key]: { ...(current as object), ...resolved } };
}

/**
 * Returns a new array where the first element matching `predicate` has been
 * updated via {@link patch}. All other elements are returned by reference,
 * unchanged.
 *
 * @param items - The source array. Never mutated.
 * @param predicate - A function that returns `true` for the element to update.
 * @param updater - A partial object or updater function forwarded to {@link patch}.
 * @returns A new array with the matching element replaced by its patched version.
 *
 * @example
 * patchWhere(state.tabs, (t) => t.id === tabId, { pinned: true })
 */
export function patchWhere<T extends object>(
  items: T[],
  predicate: (item: T) => boolean,
  updater: Partial<T> | ((item: T) => Partial<T>)
): T[] {
  return items.map((item) => (predicate(item) ? patch(item, updater) : item));
}

/**
 * Returns a new array where the element whose property `key` equals `value`
 * has been updated via {@link patch}.
 *
 * A convenience wrapper around {@link patchWhere} for the common case of
 * matching by a unique identifier such as `id`.
 *
 * @param items - The source array. Never mutated.
 * @param key - The property name to match on (e.g. `'id'`).
 * @param value - The value that `item[key]` must equal for the update to apply.
 * @param updater - A partial object or updater function forwarded to {@link patch}.
 * @returns A new array with the matching element replaced by its patched version.
 *
 * @example
 * patchById(state.tabs, 'id', tabId, { pinned: true })
 */
export function patchById<T extends object, K extends keyof T>(
  items: T[],
  key: K,
  value: T[K],
  updater: Partial<T> | ((item: T) => Partial<T>)
): T[] {
  return patchWhere(items, (item) => item[key] === value, updater);
}
