import { useState } from 'react';

import { tryCatch } from '@/utils/functions/error';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key);
    return item ? tryCatch(() => JSON.parse(item) as T, initialValue) : initialValue;
  });

  const setValue = (value: T) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    tryCatch(() => window.localStorage.setItem(key, JSON.stringify(valueToStore)), undefined);
  };

  return { storedValue, setValue };
};
