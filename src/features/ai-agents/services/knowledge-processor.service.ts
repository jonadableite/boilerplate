import { Document } from "langchain/document";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

// Import our SOLID-compliant services and interfaces
import { DocumentLoaderFactory } from "../loaders/document-loaders";
import {
  TextSplitterService,
  TextSplitterConfig,
} from "./text-splitter.service";
import { VectorStoreService, VectorStoreConfig } from "./vector-store.service";
import {
  IKnowledgeProcessor,
  ProcessedKnowledgeFile,
  KnowledgeChunk,
} from "../interfaces/document-loader.interface";

/**
 * Configuration interface for Knowledge Processor
 */
export interface KnowledgeProcessorConfig {
  textSplitter?: TextSplitterConfig;
  vectorStore?: VectorStoreConfig;
  uploadDir?: string;
}

/**
 * Knowledge Processor Service Implementation
 * Follows SOLID principles:
 * - Single Responsibility: Only handles knowledge processing orchestration
 * - Open/Closed: Extensible through dependency injection
 * - Liskov Substitution: Implements IKnowledgeProcessor interface
 * - Interface Segregation: Uses specific interfaces for each responsibility
 * - Dependency Inversion: Depends on abstractions, not concretions
 */
export class KnowledgeProcessorService implements IKnowledgeProcessor {
  private textSplitterService: TextSplitterService;
  private vectorStoreService: VectorStoreService;
  private processedFiles: Map<string, ProcessedKnowledgeFile> = new Map();
  private config: KnowledgeProcessorConfig;
  private uploadDir: string;

  constructor(config: KnowledgeProcessorConfig = {}) {
    this.config = {
      uploadDir: "uploads",
      ...config,
    };

    // Dependency injection - services are injected, not created internally
    this.textSplitterService = new TextSplitterService(
      this.config.textSplitter,
    );
    this.vectorStoreService = new VectorStoreService(this.config.vectorStore);

    this.uploadDir = path.join(
      process.cwd(),
      this.config.uploadDir || "uploads",
      "knowledge-base",
    );
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Process a file and extract knowledge chunks
   * @param filePath - Path to the file
   * @param originalName - Original filename
   * @returns Promise of processed knowledge file
   */
  async processFile(
    filePath: string,
    originalName: string,
  ): Promise<ProcessedKnowledgeFile> {
    try {
      console.log(`Processing file: ${originalName}`);

      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileStats = fs.statSync(filePath);
      const fileType = this.getFileType(originalName);

      // Use factory pattern to get appropriate loader
      const loader = DocumentLoaderFactory.getLoader(fileType);
      if (!loader) {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Load documents using the appropriate loader
      const documents = await loader.load(filePath);
      console.log(`Loaded ${documents.length} documents from ${originalName}`);

      if (documents.length === 0) {
        throw new Error(`No content could be extracted from ${originalName}`);
      }

      // Split documents into chunks using text splitter service
      const splitDocs =
        await this.textSplitterService.splitDocuments(documents);
      console.log(`Split into ${splitDocs.length} chunks`);

      // Add documents to vector store
      await this.vectorStoreService.addDocuments(splitDocs);

      // Create knowledge chunks with proper metadata
      const chunks: KnowledgeChunk[] = splitDocs.map((doc, index) => ({
        id: uuidv4(),
        content: doc.pageContent,
        metadata: {
          source: originalName,
          page: doc.metadata.page || undefined,
          chunk: index,
          totalChunks: splitDocs.length,
          ...doc.metadata,
        },
      }));

      const processedFile: ProcessedKnowledgeFile = {
        id: uuidv4(),
        filename: path.basename(filePath),
        originalName,
        size: fileStats.size,
        type: fileType,
        chunks,
        processedAt: new Date(),
      };

      // Store processed file for future reference
      this.processedFiles.set(processedFile.id, processedFile);

      console.log(
        `Successfully processed ${originalName} with ${chunks.length} chunks`,
      );
      return processedFile;
    } catch (error) {
      console.error(`Error processing file ${originalName}:`, error);
      throw new Error(
        `Failed to process file ${originalName}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    switch (extension) {
      case ".pdf":
        return "application/pdf";
      case ".txt":
      case ".md":
        return "text/plain";
      case ".docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case ".doc":
        return "application/msword";
      default:
        return "application/octet-stream";
    }
  }

  /**
   * Load document using appropriate loader
   * @param filePath - Path to the file
   * @param fileType - MIME type of the file
   * @returns Promise of loaded documents
   */
  private async loadDocument(
    filePath: string,
    fileType: string,
  ): Promise<Document[]> {
    try {
      const loader = DocumentLoaderFactory.getLoader(fileType);

      if (!loader) {
        throw new Error(`No loader available for file type: ${fileType}`);
      }

      const documents = await loader.load(filePath);

      if (!documents || documents.length === 0) {
        throw new Error(`No content could be extracted from file: ${filePath}`);
      }

      console.log(
        `Successfully loaded ${documents.length} documents from ${filePath}`,
      );
      return documents;
    } catch (error) {
      console.error(`Error loading document from ${filePath}:`, error);
      throw new Error(
        `Failed to load document: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Process multiple files
   */
  async processMultipleFiles(
    filePaths: string[],
  ): Promise<ProcessedKnowledgeFile[]> {
    const results: ProcessedKnowledgeFile[] = [];

    for (const filePath of filePaths) {
      try {
        const originalName = path.basename(filePath);
        const processed = await this.processFile(filePath, originalName);
        results.push(processed);
      } catch (error) {
        console.error("Failed to process file", {
          filePath,
          error,
        });
        // Continue processing other files
      }
    }

    return results;
  }

  /**
   * Search for relevant knowledge chunks
   * @param query - Search query
   * @param fileId - Optional file ID to search within
   * @returns Promise of relevant chunks
   */
  async searchKnowledge(
    query: string,
    fileId?: string,
  ): Promise<KnowledgeChunk[]> {
    try {
      if (!query || query.trim().length === 0) {
        console.log("Empty query provided for knowledge search");
        return [];
      }

      console.log(
        `Searching knowledge for query: "${query.substring(0, 50)}..."`,
      );

      if (fileId) {
        // Search within specific file
        const processedFile = this.processedFiles.get(fileId);
        if (!processedFile) {
          throw new Error(`Processed file not found for ID: ${fileId}`);
        }

        // Use vector store service for similarity search
        const results = await this.vectorStoreService.similaritySearch(
          query,
          5,
        );
        return this.convertToKnowledgeChunks(results, processedFile);
      } else {
        // Search across all processed files
        if (this.processedFiles.size === 0) {
          console.log("No processed files available for search");
          return [];
        }

        // Use vector store service for global search
        const results = await this.vectorStoreService.similaritySearch(
          query,
          10,
        );
        return this.convertToKnowledgeChunks(results);
      }
    } catch (error) {
      console.error(`Error searching knowledge:`, error);
      throw new Error(
        `Failed to search knowledge: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Convert search results to knowledge chunks
   */
  private convertToKnowledgeChunks(
    results: Document[],
    processedFile?: ProcessedKnowledgeFile,
  ): KnowledgeChunk[] {
    return results.map((doc, index) => ({
      id: uuidv4(),
      content: doc.pageContent,
      metadata: {
        source: processedFile?.originalName || doc.metadata.source || "unknown",
        page: doc.metadata.page || undefined,
        chunk: index,
        ...doc.metadata,
      },
    }));
  }

  /**
   * Get all processed files
   */
  getProcessedFiles(): ProcessedKnowledgeFile[] {
    return Array.from(this.processedFiles.values());
  }

  /**
   * Get processed file by ID
   */
  getProcessedFile(fileId: string): ProcessedKnowledgeFile | undefined {
    return this.processedFiles.get(fileId);
  }

  /**
   * Clear all processed files
   */
  async clearProcessedFiles(): Promise<void> {
    try {
      // Reset vector store (clear method doesn't exist, use reset instead)
      this.vectorStoreService.reset();

      // Clear processed files map
      this.processedFiles.clear();

      console.log("All processed files cleared");
    } catch (error) {
      console.error("Error clearing processed files:", error);
      throw error;
    }
  }

  /**
   * Remove processed file
   */
  async removeProcessedFile(fileId: string): Promise<void> {
    try {
      const processedFile = this.processedFiles.get(fileId);
      if (!processedFile) {
        throw new Error(`Processed file not found for ID: ${fileId}`);
      }

      // Remove from vector store (this would need to be implemented in VectorStoreService)
      // await this.vectorStoreService.removeDocuments(processedFile.chunks);

      // Remove physical file
      const filePath = path.join(this.uploadDir, processedFile.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Remove from processed files map
      this.processedFiles.delete(fileId);

      console.log("Processed file removed", {
        fileId: processedFile.id,
        filename: processedFile.originalName,
      });
    } catch (error) {
      console.error("Error removing processed file", {
        fileId,
        error,
      });
      throw error;
    }
  }

  /**
   * Check if file type is supported
   */
  isFileSupported(filename: string): boolean {
    const fileType = this.getFileType(filename);
    const supportedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    return supportedTypes.includes(fileType);
  }

  /**
   * Validate file size
   */
  isFileSizeValid(filePath: string, maxSizeMB: number = 10): boolean {
    try {
      const stats = fs.statSync(filePath);
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      return stats.size <= maxSizeBytes;
    } catch (error) {
      console.error(`Error checking file size for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de um arquivo processado
   */
  getFileStats(processedFile: ProcessedKnowledgeFile): {
    chunksCount: number;
    totalCharacters: number;
    averageChunkSize: number;
  } {
    const chunksCount = processedFile.chunks.length;
    const totalCharacters = processedFile.chunks.reduce(
      (total, chunk) => total + chunk.content.length,
      0,
    );
    const averageChunkSize =
      chunksCount > 0 ? totalCharacters / chunksCount : 0;

    return {
      chunksCount,
      totalCharacters,
      averageChunkSize: Math.round(averageChunkSize),
    };
  }
}
