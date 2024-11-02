import React, { createContext, useContext, ReactNode } from 'react';

export interface VscodeApi {
  postMessage: (msg: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

const defaultVscode: VscodeApi = {
  postMessage: () => console.warn("VS Code API not available"),
  getState: () => undefined,
  setState: () => {},
};

const VscodeContext = createContext<VscodeApi>(defaultVscode);

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

export const useVscode = () => useContext(VscodeContext);
