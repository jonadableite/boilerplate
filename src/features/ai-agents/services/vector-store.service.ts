import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";
import { IVectorStore } from "../interfaces/document-loader.interface";

/**
 * Configuration interface for vector store
 */
export interface VectorStoreConfig {
  openaiApiKey?: string;
  modelName?: string;
  batchSize?: number;
}

/**
 * Vector Store Service Implementation
 * Follows Single Responsibility Principle - only handles vector operations
 */
export class VectorStoreService implements IVectorStore {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: MemoryVectorStore | null = null;
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig = {}) {
    this.config = {
      modelName: "text-embedding-ada-002",
      batchSize: 512,
      ...config,
    };

    // Initialize OpenAI embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
      modelName: this.config.modelName,
      batchSize: this.config.batchSize,
    });
  }

  /**
   * Initialize vector store if not already initialized
   * @private
   */
  private async initializeVectorStore(): Promise<void> {
    if (!this.vectorStore) {
      try {
        this.vectorStore = new MemoryVectorStore(this.embeddings);
        console.log("Vector store initialized successfully");
      } catch (error) {
        console.error("Error initializing vector store:", error);
        throw new Error(
          `Failed to initialize vector store: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  /**
   * Add documents to the vector store
   * @param documents - Documents to add
   * @returns Promise of document IDs
   */
  async addDocuments(documents: Document[]): Promise<string[]> {
    try {
      if (!documents || documents.length === 0) {
        console.log("No documents provided to add to vector store");
        return [];
      }

      await this.initializeVectorStore();

      if (!this.vectorStore) {
        throw new Error("Vector store not initialized");
      }

      console.log(`Adding ${documents.length} documents to vector store`);
      const ids = await this.vectorStore.addDocuments(documents);

      console.log(`Successfully added ${ids.length} documents to vector store`);
      return ids;
    } catch (error) {
      console.error("Error adding documents to vector store:", error);
      throw new Error(
        `Failed to add documents: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Search for similar documents
   * @param query - Search query
   * @param k - Number of results to return
   * @returns Promise of similar documents with scores
   */
  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    try {
      if (!query || query.trim().length === 0) {
        console.log("Empty query provided for similarity search");
        return [];
      }

      await this.initializeVectorStore();

      if (!this.vectorStore) {
        throw new Error("Vector store not initialized");
      }

      console.log(
        `Searching for similar documents with query: "${query.substring(0, 50)}..."`,
      );
      const results = await this.vectorStore.similaritySearch(query, k);

      console.log(`Found ${results.length} similar documents`);
      return results;
    } catch (error) {
      console.error("Error performing similarity search:", error);
      throw new Error(
        `Failed to search documents: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Search for similar documents with scores
   * @param query - Search query
   * @param k - Number of results to return
   * @returns Promise of similar documents with similarity scores
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 4,
  ): Promise<[Document, number][]> {
    try {
      if (!query || query.trim().length === 0) {
        console.log("Empty query provided for similarity search with score");
        return [];
      }

      await this.initializeVectorStore();

      if (!this.vectorStore) {
        throw new Error("Vector store not initialized");
      }

      console.log(
        `Searching for similar documents with scores for query: "${query.substring(0, 50)}..."`,
      );
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        k,
      );

      console.log(`Found ${results.length} similar documents with scores`);
      return results;
    } catch (error) {
      console.error("Error performing similarity search with score:", error);
      throw new Error(
        `Failed to search documents with scores: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get the current vector store instance
   * @returns Vector store instance or null if not initialized
   */
  getVectorStore(): MemoryVectorStore | null {
    return this.vectorStore;
  }

  /**
   * Reset the vector store (useful for testing or clearing data)
   */
  reset(): void {
    this.vectorStore = null;
    console.log("Vector store reset");
  }

  /**
   * Update configuration
   * @param config - New configuration
   */
  updateConfig(config: Partial<VectorStoreConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize embeddings with new config
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
      modelName: this.config.modelName,
      batchSize: this.config.batchSize,
    });

    // Reset vector store to use new embeddings
    this.reset();
  }

  /**
   * Get current configuration
   * @returns Current vector store configuration
   */
  getConfig(): VectorStoreConfig {
    return { ...this.config };
  }
}
