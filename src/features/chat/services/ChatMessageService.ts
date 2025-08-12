import { Logger } from '../../../core/logging/Logger';
import { EditorContextService } from './EditorContextService';
import { ApiKeyService } from './ApiKeyService';

/**
 * Interface for chat message data received from webview
 */
export interface ChatMessageData {
  chatSession?: {
    chatId?: string;
    chatName?: string;
    messages?: unknown[];
    createdAt?: string;
    timestamp?: string;
  };
  /** New canonical field replacing selectedModel (legacy). */
  selectedAgent?: {
    agentId: string;
    agentName: string;
    agentDescription: string;
  };
  userMessage?: {
    text: string;
    images?: Array<{
      fileName: string;
      filePath: string;
      fileType: string;
      fileContent: string;
      isActive: boolean;
      isManuallyAddedByUser: boolean;
    }>;
  };
  timestamp?: string;
}

/**
 * Interface for message summary logging
 */
export interface MessageSummary {
  hasText: boolean;
  textLength: number;
  hasImages: boolean;
  imageCount: number;
  model?: string;
  sessionId?: string;
  timestamp?: string;
}

/**
 * Service responsible for processing and handling chat messages
 */
export class ChatMessageService {
  private logger: Logger;
  private editorContextService: EditorContextService;
  private apiKeyService: ApiKeyService;

  constructor(
    logger: Logger,
    editorContextService: EditorContextService,
    apiKeyService: ApiKeyService
  ) {
    this.logger = logger;
    this.editorContextService = editorContextService;
    this.apiKeyService = apiKeyService;
  }

  /**
   * Process incoming chat message from webview
   */
  public async processMessage(data: ChatMessageData): Promise<void> {
    try {
      this.logger.info('=== Processing Chat Message ===');
      this.logger.info('Received data:', JSON.stringify(data, null, 2));

      // Extract data from the message
  const { chatSession, selectedAgent: selectedAgentRaw, userMessage, timestamp } = data;
  const selectedAgent = selectedAgentRaw; // canonical
      
      this.logger.info('Chat session info:', {
        sessionId: chatSession?.chatId,
        timestamp: timestamp
      });
      if (selectedAgent) {
        this.logger.info('Selected agent (canonical):', selectedAgent);
      } else {
        this.logger.warn('No selectedAgent / selectedModel provided');
      }
      
      this.logger.info('User message:', {
        text: userMessage?.text,
        hasImages: userMessage?.images && userMessage.images.length > 0,
        imageCount: userMessage?.images?.length || 0
      });

      // Get editor context
      const editorContext = await this.editorContextService.getEditorContext();
      this.logger.info('Editor context:', editorContext);

      // Check API key access
      const apiStatus = await this.apiKeyService.checkApiKeyAccess();
      this.logger.info('API Key Status:', apiStatus);

      // Log API key availability (masked for security)
      if (apiStatus.hasOpenAIKey) {
        const maskedKey = this.apiKeyService.maskApiKey(
          await this.apiKeyService.getApiKey('openai') || ''
        );
        this.logger.info('OpenAI API Key available:', maskedKey);
      } else {
        this.logger.warn('No OpenAI API key found');
      }

      if (apiStatus.hasAzureKey) {
        const maskedKey = this.apiKeyService.maskApiKey(
          await this.apiKeyService.getApiKey('azure') || ''
        );
        this.logger.info('Azure API Key available:', maskedKey);
      } else {
        this.logger.warn('No Azure API key found');
      }

      // Here we would implement the actual AI processing logic
      this.logger.info('Chat message processing completed successfully');

    } catch (error) {
      this.logger.error('Error processing chat message:', error);
      throw error;
    }
  }

  /**
   * Validate message data structure
   */
  private validateMessageData(data: ChatMessageData): boolean {
    if (!data) {
      this.logger.warn('No data provided in message');
      return false;
    }

    if (!data.userMessage?.text) {
      this.logger.warn('No user message text provided');
      return false;
    }

    if (!data.selectedAgent) {
      this.logger.warn('No agent selected');
      return false;
    }

    return true;
  }

  /**
   * Get message summary for logging
   */
  private getMessageSummary(data: ChatMessageData): MessageSummary {
  const canonical = data.selectedAgent;
    return {
      hasText: !!data.userMessage?.text,
      textLength: data.userMessage?.text?.length || 0,
      hasImages: !!(data.userMessage?.images && data.userMessage.images.length > 0),
      imageCount: data.userMessage?.images?.length || 0,
      model: canonical?.agentName,
      sessionId: data.chatSession?.chatId,
      timestamp: data.timestamp
    };
  }
}
