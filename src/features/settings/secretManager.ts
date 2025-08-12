import * as vscode from 'vscode';
import { Logger } from '../../core/logging/Logger';

// Lightweight representations of the settings structure sent from the webview.
interface ProviderConfigPartial { apiKey?: string }
interface IncomingSettingsState { configs?: { openai?: ProviderConfigPartial; azure?: ProviderConfigPartial } }

export interface SecretManagerDeps {
  context: vscode.ExtensionContext;
  getActivePanels: () => vscode.WebviewView[];
}

const OPENAI_KEY = 'neoCopilot.secret.openai.apiKey';
const AZURE_KEY = 'neoCopilot.secret.azure.apiKey';

async function broadcastStatus(deps: SecretManagerDeps) {
  const openai = await deps.context.secrets.get(OPENAI_KEY);
  const azure = await deps.context.secrets.get(AZURE_KEY);
  const logger = Logger.getInstance();
  logger.debug('[SecretManager] Broadcasting API key status', { openaiPresent: !!openai, azurePresent: !!azure });
  deps.getActivePanels().forEach(panel => panel.webview.postMessage({
    command: 'settings:apiKeyStatus',
    payload: { openai: !!openai, azure: !!azure }
  }));
}

function maskSecret(secret: string | undefined): string {
  if (!secret) { return 'empty'; }
  if (secret.length <= 8) { return `${'*'.repeat(secret.length)} (len=${secret.length})`; }
  return `${secret.slice(0,4)}***${secret.slice(-2)} (len=${secret.length})`;
}

export async function handleSettingsSecretMessage(
  deps: SecretManagerDeps,
  message: { command: string; [key: string]: unknown }
): Promise<boolean> {
  switch (message.command) {
    case 'settings:update': {
      try {
        const payload = message.payload as IncomingSettingsState | undefined;
        const configs = payload?.configs;
        if (configs) {
          const logger = Logger.getInstance();
          if (configs.openai?.apiKey) {
            await deps.context.secrets.store(OPENAI_KEY, configs.openai.apiKey);
            logger.info('[SecretManager] Stored OpenAI API key', { preview: maskSecret(configs.openai.apiKey) });
          }
          if (configs.azure?.apiKey) {
            await deps.context.secrets.store(AZURE_KEY, configs.azure.apiKey);
            logger.info('[SecretManager] Stored Azure API key');
          }
          await broadcastStatus(deps);
        }
      } catch (err) {
        vscode.window.showErrorMessage('Failed to store API key securely: ' + (err as Error).message);
      }
      return true;
    }
    case 'settings:requestApiKeyStatus': {
      await broadcastStatus(deps);
      return true;
    }
    case 'settings:clearApiKey': {
      const provider = message.provider as string | undefined;
      const logger = Logger.getInstance();
      if (provider === 'openai') {
        await deps.context.secrets.delete(OPENAI_KEY);
        logger.info('[SecretManager] Cleared OpenAI API key');
      } else if (provider === 'azure') {
        await deps.context.secrets.delete(AZURE_KEY);
        logger.info('[SecretManager] Cleared Azure API key');
      } else {
        logger.warn('[SecretManager] clearApiKey called with unknown provider', { provider });
      }
      await broadcastStatus(deps);
      return true;
    }
    default:
      return false;
  }
}
