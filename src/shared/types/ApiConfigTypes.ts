export type ApiProviderType = 'openai' | 'azure' | 'gemini';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
  azureApiVersion?: string; // Specific to Azure
}

export interface AllApiConfigs {
  openai: ApiConfig;
  azure: ApiConfig;
  gemini: ApiConfig;
}