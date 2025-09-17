import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { Document } from "langchain/document";
import { IDocumentLoader } from "../interfaces/document-loader.interface";

/**
 * PDF Document Loader Implementation
 */
export class PDFDocumentLoader implements IDocumentLoader {
  async load(filePath: string): Promise<Document[]> {
    try {
      const loader = new PDFLoader(filePath);
      return await loader.load();
    } catch (error) {
      console.error(`Error loading PDF file ${filePath}:`, error);
      throw new Error(`Failed to load PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  supports(fileType: string): boolean {
    return fileType === 'application/pdf' || fileType.toLowerCase().endsWith('.pdf');
  }
}

/**
 * Text Document Loader Implementation
 */
export class TextDocumentLoader implements IDocumentLoader {
  async load(filePath: string): Promise<Document[]> {
    try {
      const loader = new TextLoader(filePath);
      return await loader.load();
    } catch (error) {
      console.error(`Error loading text file ${filePath}:`, error);
      throw new Error(`Failed to load text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  supports(fileType: string): boolean {
    const textTypes = ['text/plain', 'text/markdown', 'application/json'];
    const textExtensions = ['.txt', '.md', '.json', '.csv'];
    
    return textTypes.includes(fileType) || 
           textExtensions.some(ext => fileType.toLowerCase().endsWith(ext));
  }
}

/**
 * DOCX Document Loader Implementation
 */
export class DocxDocumentLoader implements IDocumentLoader {
  async load(filePath: string): Promise<Document[]> {
    try {
      const loader = new DocxLoader(filePath);
      return await loader.load();
    } catch (error) {
      console.error(`Error loading DOCX file ${filePath}:`, error);
      throw new Error(`Failed to load DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  supports(fileType: string): boolean {
    return fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
           fileType.toLowerCase().endsWith('.docx');
  }
}

/**
 * Document Loader Factory - Factory Pattern Implementation
 */
export class DocumentLoaderFactory {
  private static loaders: IDocumentLoader[] = [
    new PDFDocumentLoader(),
    new TextDocumentLoader(),
    new DocxDocumentLoader()
  ];

  /**
   * Get appropriate document loader for file type
   * @param fileType - MIME type or file extension
   * @returns Document loader instance or null if not supported
   */
  static getLoader(fileType: string): IDocumentLoader | null {
    return this.loaders.find(loader => loader.supports(fileType)) || null;
  }

  /**
   * Check if file type is supported
   * @param fileType - MIME type or file extension
   * @returns boolean indicating support
   */
  static isSupported(fileType: string): boolean {
    return this.loaders.some(loader => loader.supports(fileType));
  }

  /**
   * Get list of supported file types
   * @returns Array of supported MIME types and extensions
   */
  static getSupportedTypes(): string[] {
    return [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pdf',
      '.txt',
      '.md',
      '.json',
      '.csv',
      '.docx'
    ];
  }
}