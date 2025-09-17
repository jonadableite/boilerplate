import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { ITextSplitter } from "../interfaces/document-loader.interface";

/**
 * Configuration interface for text splitting
 */
export interface TextSplitterConfig {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

/**
 * Text Splitter Service Implementation
 * Follows Single Responsibility Principle - only handles text splitting
 */
export class TextSplitterService implements ITextSplitter {
  private splitter: RecursiveCharacterTextSplitter;
  private config: TextSplitterConfig;

  constructor(
    config: TextSplitterConfig = {
      chunkSize: 1000,
      chunkOverlap: 200,
    },
  ) {
    this.config = config;
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: config.separators,
    });
  }

  /**
   * Split documents into smaller chunks
   * @param documents - Array of documents to split
   * @returns Promise of split document chunks
   */
  async splitDocuments(documents: Document[]): Promise<Document[]> {
    try {
      if (!documents || documents.length === 0) {
        console.log("No documents provided for splitting");
        return [];
      }

      console.log(
        `Splitting ${documents.length} documents with chunk size ${this.config.chunkSize}`,
      );
      const splitDocs = await this.splitter.splitDocuments(documents);

      console.log(`Split into ${splitDocs.length} chunks`);
      return splitDocs;
    } catch (error) {
      console.error("Error splitting documents:", error);
      throw new Error(
        `Failed to split documents: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update splitter configuration
   * @param config - New configuration
   */
  updateConfig(config: Partial<TextSplitterConfig>): void {
    this.config = { ...this.config, ...config };
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      separators: this.config.separators,
    });
  }

  /**
   * Get current configuration
   * @returns Current text splitter configuration
   */
  getConfig(): TextSplitterConfig {
    return { ...this.config };
  }
}
