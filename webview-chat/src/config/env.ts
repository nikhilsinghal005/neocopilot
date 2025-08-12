// Centralized environment & runtime configuration
// Extend this as needed; during build you can inject values via Vite's define or env files.

export interface RuntimeConfig {
  appName: string;
  buildMode: 'development' | 'production';
  version: string;
}

// Vite exposes import.meta.env.* — whitelist only what you need
export const runtimeConfig: RuntimeConfig = {
  appName: 'NeoCopilot Chat',
  buildMode: (import.meta.env.MODE as 'development' | 'production') || 'development',
  version: import.meta.env.VITE_APP_VERSION || '0.0.0',
};

export const isProd = runtimeConfig.buildMode === 'production';
export const isDev = !isProd;
