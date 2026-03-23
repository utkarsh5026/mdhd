import { createContext } from 'react';

const ReadingTabContext = createContext<string | null>(null);

export default ReadingTabContext;

export const ReadingTabProvider = ReadingTabContext.Provider;
