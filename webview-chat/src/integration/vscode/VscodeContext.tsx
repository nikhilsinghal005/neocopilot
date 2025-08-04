import React, { ReactNode } from 'react';
import { VscodeApi, VscodeContext } from './api';

// Define props including children
interface VscodeProviderProps {
  vscode: VscodeApi;
  children: ReactNode;
}

export const VscodeProvider: React.FC<VscodeProviderProps> = ({ vscode, children }) => (
  <VscodeContext.Provider value={vscode}>
    {children}
  </VscodeContext.Provider>
);
