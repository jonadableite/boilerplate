import { KnowledgeProcessorService } from '../features/ai-agents/services/knowledge-processor.service';
import { TTSService } from '../features/ai-agents/services/tts.service';
import { TextSplitterService } from '../features/ai-agents/services/text-splitter.service';
import { VectorStoreService } from '../features/ai-agents/services/vector-store.service';

/**
 * AI Services Provider following IgniterJS patterns
 * Provides singleton instances of AI-related services with proper dependency injection
 */
class AIServicesProvider {
  private static knowledgeProcessor: KnowledgeProcessorService | null = null;
  private static ttsService: TTSService | null = null;
  private static textSplitter: TextSplitterService | null = null;
  private static vectorStore: VectorStoreService | null = null;

  /**
   * Get TextSplitter service instance
   */
  static getTextSplitterService(): TextSplitterService {
    if (!this.textSplitter) {
      this.textSplitter = new TextSplitterService();
    }
    return this.textSplitter;
  }

  /**
   * Get VectorStore service instance
   */
  static getVectorStoreService(): VectorStoreService {
    if (!this.vectorStore) {
      this.vectorStore = new VectorStoreService();
    }
    return this.vectorStore;
  }

  /**
   * Get KnowledgeProcessor service instance with injected dependencies
   */
  static getKnowledgeProcessor(): KnowledgeProcessorService {
    if (!this.knowledgeProcessor) {
      const textSplitter = this.getTextSplitterService();
      const vectorStore = this.getVectorStoreService();
      
      this.knowledgeProcessor = new KnowledgeProcessorService(
        textSplitter,
        vectorStore
      );
    }
    return this.knowledgeProcessor;
  }

  /**
   * Get TTS service instance
   */
  static getTTSService(): TTSService {
    if (!this.ttsService) {
      this.ttsService = new TTSService();
    }
    return this.ttsService;
  }

  /**
   * Reset all service instances (useful for testing)
   */
  static reset(): void {
    this.knowledgeProcessor = null;
    this.ttsService = null;
    this.textSplitter = null;
    this.vectorStore = null;
  }
}

export { AIServicesProvider };