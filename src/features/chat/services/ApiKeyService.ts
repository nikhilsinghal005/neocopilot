import * as vscode from 'vscode';
import { Logger } from '../../../core/logging/Logger';

/**
 * Interface for API configuration status
 */
export interface ApiConfigStatus {
  hasOpenAIKey: boolean;
  hasAzureKey: boolean;
  openaiKeyLength: number;
  azureKeyLength: number;
}

/**
 * Interface for API key preview (masked for security)
 */
export interface ApiKeyPreview {
  provider: string;
  preview: string;
  length: number;
}

/**
 * Service for managing and checking API key access
 */
export class ApiKeyService {
  private logger: Logger;
  private context: vscode.ExtensionContext;

  // Secret storage keys
  private static readonly openaiKey = 'neoCopilot.secret.openai.apiKey';
  private static readonly azureKey = 'neoCopilot.secret.azure.apiKey';

  constructor(context: vscode.ExtensionContext) {
    this.logger = Logger.getInstance();
    this.context = context;
  }

  /**
   * Check the availability and status of all API keys
   */
  public async checkApiKeyAccess(): Promise<ApiConfigStatus> {
    try {
      // Check for OpenAI API key
      const openaiKey = await this.context.secrets.get(ApiKeyService.openaiKey);
      
      // Check for Azure API key  
      const azureKey = await this.context.secrets.get(ApiKeyService.azureKey);

      const status: ApiConfigStatus = {
        hasOpenAIKey: !!openaiKey,
        hasAzureKey: !!azureKey,
        openaiKeyLength: openaiKey ? openaiKey.length : 0,
        azureKeyLength: azureKey ? azureKey.length : 0
      };

      this.logger.info('API Configuration Status:', status);

      // Log masked previews if keys exist
      if (openaiKey) {
        const preview = this.maskApiKey(openaiKey);
        this.logger.info('OpenAI Key Preview:', { preview });
      }

      if (azureKey) {
        const preview = this.maskApiKey(azureKey);
        this.logger.info('Azure Key Preview:', { preview });
      }

      if (!openaiKey && !azureKey) {
        this.logger.warn('No API keys configured. User needs to configure API keys in settings.');
      }

      return status;

    } catch (error) {
      this.logger.error('Error checking API key access:', error);
      throw error;
    }
  }

  /**
   * Get API key for a specific provider
   */
  public async getApiKey(provider: 'openai' | 'azure'): Promise<string | undefined> {
    try {
      const key = provider === 'openai' 
        ? ApiKeyService.openaiKey 
        : ApiKeyService.azureKey;
      
      return await this.context.secrets.get(key);
    } catch (error) {
      this.logger.error(`Error retrieving ${provider} API key:`, error);
      return undefined;
    }
  }

  /**
   * Get masked previews of available API keys
   */
  public async getApiKeyPreviews(): Promise<ApiKeyPreview[]> {
    const previews: ApiKeyPreview[] = [];

    try {
      const openaiKey = await this.getApiKey('openai');
      if (openaiKey) {
        previews.push({
          provider: 'openai',
          preview: this.maskApiKey(openaiKey),
          length: openaiKey.length
        });
      }

      const azureKey = await this.getApiKey('azure');
      if (azureKey) {
        previews.push({
          provider: 'azure',
          preview: this.maskApiKey(azureKey),
          length: azureKey.length
        });
      }
    } catch (error) {
      this.logger.error('Error getting API key previews:', error);
    }

    return previews;
  }

  /**
   * Check if any API key is available
   */
  public async hasAnyApiKey(): Promise<boolean> {
    const status = await this.checkApiKeyAccess();
    return status.hasOpenAIKey || status.hasAzureKey;
  }

  /**
   * Helper method to mask API keys for secure logging
   */
  public maskApiKey(key: string): string {
    if (!key) { 
      return 'empty'; 
    }
    if (key.length <= 8) { 
      return `${'*'.repeat(key.length)} (len=${key.length})`;
    }
    return `${key.slice(0,4)}***${key.slice(-2)} (len=${key.length})`;
  }
}
