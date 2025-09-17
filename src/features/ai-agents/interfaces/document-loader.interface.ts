import { Document } from "langchain/document";

/**
 * Interface for document loaders following Single Responsibility Principle
 */
export interface IDocumentLoader {
  /**
   * Load and parse a document from file path
   * @param filePath - Path to the document file
   * @returns Promise of parsed documents
   */
  load(filePath: string): Promise<Document[]>;

  /**
   * Check if the loader supports the given file type
   * @param fileType - MIME type or file extension
   * @returns boolean indicating support
   */
  supports(fileType: string): boolean;
}

/**
 * Interface for text splitting operations
 */
export interface ITextSplitter {
  /**
   * Split documents into smaller chunks
   * @param documents - Array of documents to split
   * @returns Promise of split document chunks
   */
  splitDocuments(documents: Document[]): Promise<Document[]>;
}

/**
 * Interface for vector store operations
 */
export interface IVectorStore {
  /**
   * Add documents to the vector store
   * @param documents - Documents to add
   * @returns Promise of document IDs
   */
  addDocuments(documents: Document[]): Promise<string[]>;

  /**
   * Search for similar documents
   * @param query - Search query
   * @param k - Number of results to return
   * @returns Promise of similar documents with scores
   */
  similaritySearch(query: string, k?: number): Promise<Document[]>;
}

/**
 * Interface for knowledge processing operations
 */
export interface IKnowledgeProcessor {
  /**
   * Process a file and extract knowledge chunks
   * @param filePath - Path to the file
   * @param originalName - Original filename
   * @returns Promise of processed knowledge file
   */
  processFile(filePath: string, originalName: string): Promise<ProcessedKnowledgeFile>;

  /**
   * Search for relevant knowledge chunks
   * @param query - Search query
   * @param fileId - Optional file ID to search within
   * @returns Promise of relevant chunks
   */
  searchKnowledge(query: string, fileId?: string): Promise<KnowledgeChunk[]>;
}

/**
 * Knowledge chunk interface
 */
export interface KnowledgeChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    chunk: number;
    [key: string]: any;
  };
  embedding?: number[];
}

/**
 * Processed knowledge file interface
 */
export interface ProcessedKnowledgeFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  chunks: KnowledgeChunk[];
  processedAt: Date;
}