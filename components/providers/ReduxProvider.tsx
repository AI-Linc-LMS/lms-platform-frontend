'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store/store';
import { ReactNode } from 'react';

interface ReduxProviderProps {
  children: ReactNode;
}

export const ReduxProvider = ({ children }: ReduxProviderProps) => {
  return <Provider store={store}>{children}</Provider>;
};

