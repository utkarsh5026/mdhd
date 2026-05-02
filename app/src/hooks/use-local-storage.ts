import { useState } from 'react';

import { tryCatch } from '@/utils/error';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = globalThis.localStorage.getItem(key);
    return item ? tryCatch(() => JSON.parse(item) as T, initialValue) : initialValue;
  });

  const setValue = (value: T) => {
    const valueToStore = typeof value === 'function' ? value(storedValue) : value;
    setStoredValue(valueToStore);
    tryCatch(() => globalThis.localStorage.setItem(key, JSON.stringify(valueToStore)), undefined);
  };

  return { storedValue, setValue };
};
