const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { createWorker } = require('tesseract.js');

class ContentProcessor {
  constructor() {
    this.supportedTypes = {
      'application/pdf': this.processPDF,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.processDOCX,
      'text/plain': this.processTXT,
      'text/markdown': this.processMarkdown,
      'text/csv': this.processCSV,
      'application/json': this.processJSON,
      'image/jpeg': this.processImage,
      'image/png': this.processImage,
      'image/gif': this.processImage
    };
  }

  /**
   * Process uploaded file and extract content
   */
  async processFile(filePath, mimeType) {
    try {
      const processor = this.supportedTypes[mimeType];
      if (!processor) {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const result = await processor.call(this, filePath);
      return {
        success: true,
        content: result.content,
        metadata: result.metadata,
        extractedText: result.extractedText || result.content
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process PDF files
   */
  async processPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    return {
      content: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        version: data.pdfInfo?.PDFFormatVersion
      },
      extractedText: data.text
    };
  }

  /**
   * Process DOCX files
   */
  async processDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    
    return {
      content: result.value,
      metadata: {
        messages: result.messages,
        hasImages: result.value.includes('[Image]')
      },
      extractedText: result.value
    };
  }

  /**
   * Process plain text files
   */
  async processTXT(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      content: content,
      metadata: {
        encoding: 'utf8',
        size: content.length
      },
      extractedText: content
    };
  }

  /**
   * Process Markdown files
   */
  async processMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    return {
      content: content,
      metadata: {
        type: 'markdown',
        size: content.length,
        hasCodeBlocks: content.includes('```'),
        hasLinks: content.includes('[') && content.includes('](')
      },
      extractedText: content
    };
  }

  /**
   * Process CSV files
   */
  async processCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    const rows = lines.slice(1).filter(line => line.trim()).map(line => 
      line.split(',').map(cell => cell.trim())
    );
    
    return {
      content: content,
      metadata: {
        type: 'csv',
        rows: rows.length,
        columns: headers.length,
        headers: headers
      },
      extractedText: content
    };
  }

  /**
   * Process JSON files
   */
  async processJSON(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    
    return {
      content: parsed,
      metadata: {
        type: 'json',
        keys: Object.keys(parsed),
        size: content.length
      },
      extractedText: JSON.stringify(parsed, null, 2)
    };
  }

  /**
   * Process image files using OCR
   */
  async processImage(filePath) {
    try {
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      
      return {
        content: text,
        metadata: {
          type: 'image',
          ocrProcessed: true,
          confidence: 'high'
        },
        extractedText: text
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        content: '[Image content - OCR failed]',
        metadata: {
          type: 'image',
          ocrProcessed: false,
          error: error.message
        },
        extractedText: '[Image content - OCR failed]'
      };
    }
  }

  /**
   * Extract key information from processed content
   */
  extractKeyInformation(content, contentType) {
    const info = {
      wordCount: 0,
      sentences: 0,
      paragraphs: 0,
      keywords: [],
      topics: []
    };

    if (typeof content === 'string') {
      // Word count
      info.wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      
      // Sentence count
      info.sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
      
      // Paragraph count
      info.paragraphs = content.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
      
      // Extract keywords (simple approach)
      const words = content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      const wordFreq = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      info.keywords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
    }

    return info;
  }

  /**
   * Generate training content suggestions
   */
  generateContentSuggestions(extractedContent, contentType) {
    const suggestions = [];
    
    if (extractedContent && typeof extractedContent === 'string') {
      const content = extractedContent.toLowerCase();
      
      // Suggest question nodes based on content
      if (content.includes('what') || content.includes('how') || content.includes('why')) {
        suggestions.push({
          type: 'question',
          suggestion: 'Add question nodes to test understanding of key concepts'
        });
      }
      
      // Suggest decision nodes based on content
      if (content.includes('if') || content.includes('when') || content.includes('choose')) {
        suggestions.push({
          type: 'decision',
          suggestion: 'Add decision nodes for conditional logic and branching'
        });
      }
      
      // Suggest content nodes
      if (content.length > 500) {
        suggestions.push({
          type: 'content',
          suggestion: 'Break down content into smaller, digestible chunks'
        });
      }
    }
    
    return suggestions;
  }
}

module.exports = new ContentProcessor();
