import { createContext, useContext } from 'react';

export interface VscodeApi {
  postMessage: (msg: { command: string; [key: string]: unknown }) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

const defaultVscode: VscodeApi = {
  postMessage: () => console.warn("VS Code API not available"),
  getState: () => undefined,
  setState: () => {},
};

export const VscodeContext = createContext<VscodeApi>(defaultVscode);

export const useVscode = () => useContext(VscodeContext);