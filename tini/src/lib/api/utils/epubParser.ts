// src/lib/utils/epubParser.ts

export interface EpubChapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface EpubMetadata {
  title?: string;
  author?: string;
  publisher?: string;
  language?: string;
  description?: string;
}

export class EpubParser {
  private content: string;
  
  constructor(content: string) {
    this.content = content;
  }

  /**
   * Parse EPUB content and extract chapters
   */
  parseChapters(): EpubChapter[] {
    try {
      // If content is already processed HTML
      if (this.isHtmlContent()) {
        return this.parseHtmlChapters();
      }
      
      // If it's raw EPUB text content
      return this.parseTextChapters();
    } catch (error) {
      console.error('Error parsing EPUB chapters:', error);
      return this.createFallbackChapter();
    }
  }

  /**
   * Extract metadata from EPUB content
   */
  parseMetadata(): EpubMetadata {
    const metadata: EpubMetadata = {};
    
    try {
      // Try to extract metadata from HTML meta tags
      if (this.isHtmlContent()) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.content, 'text/html');
        
        // Extract title
        const titleEl = doc.querySelector('title, h1');
        if (titleEl) {
          metadata.title = titleEl.textContent?.trim();
        }
        
        // Extract meta tags
        const metaTags = doc.querySelectorAll('meta');
        metaTags.forEach(meta => {
          const name = meta.getAttribute('name')?.toLowerCase();
          const property = meta.getAttribute('property')?.toLowerCase();
          const content = meta.getAttribute('content');
          
          if (content) {
            if (name === 'author' || property === 'dc:creator') {
              metadata.author = content;
            } else if (name === 'publisher' || property === 'dc:publisher') {
              metadata.publisher = content;
            } else if (name === 'language' || property === 'dc:language') {
              metadata.language = content;
            } else if (name === 'description' || property === 'dc:description') {
              metadata.description = content;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing EPUB metadata:', error);
    }
    
    return metadata;
  }

  private isHtmlContent(): boolean {
    return this.content.includes('<html') || 
           this.content.includes('<body') || 
           this.content.includes('<!DOCTYPE');
  }

  private parseHtmlChapters(): EpubChapter[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.content, 'text/html');
    
    // Try to find chapter divisions
    const chapterElements = this.findChapterElements(doc);
    
    if (chapterElements.length > 1) {
      return chapterElements.map((el, index) => ({
        id: `chapter-${index + 1}`,
        title: this.extractTitleFromElement(el) || `Chapter ${index + 1}`,
        content: el.innerHTML,
        order: index + 1
      }));
    }
    
    // If no clear chapter divisions, treat as single chapter
    return [{
      id: 'chapter-1',
      title: this.extractDocumentTitle(doc) || 'Document',
      content: doc.body?.innerHTML || this.content,
      order: 1
    }];
  }

  private parseTextChapters(): EpubChapter[] {
    // Split by common chapter markers
    const chapterPatterns = [
      /(?:\n\s*){2,}(?=Chapter\s+\d+)/gi,
      /(?:\n\s*){2,}(?=CHAPTER\s+\d+)/gi,
      /(?:\n\s*){2,}(?=\d+\.\s+[A-Z])/gi,
      /(?:\n\s*){3,}/gi // Fallback: split by multiple line breaks
    ];
    
    let chapters: string[] = [this.content];
    
    // Try each pattern until we get meaningful splits
    for (const pattern of chapterPatterns) {
      const splits = this.content.split(pattern);
      if (splits.length > 1 && splits.length < 50) { // Reasonable number of chapters
        chapters = splits.filter(chapter => chapter.trim().length > 100); // Filter out short segments
        break;
      }
    }
    
    return chapters.map((content, index) => ({
      id: `chapter-${index + 1}`,
      title: this.extractTitleFromText(content) || `Chapter ${index + 1}`,
      content: this.formatTextContent(content),
      order: index + 1
    }));
  }

  private findChapterElements(doc: Document): Element[] {
    // Look for common chapter container patterns
    const selectors = [
      'section[class*="chapter"]',
      'div[class*="chapter"]',
      'article',
      'section',
      'div[id*="chapter"]',
      'div[id*="ch"]'
    ];
    
    for (const selector of selectors) {
      const elements = Array.from(doc.querySelectorAll(selector));
      if (elements.length > 1) {
        return elements;
      }
    }
    
    // Fallback: split by h1, h2 tags
    const headings = Array.from(doc.querySelectorAll('h1, h2'));
    if (headings.length > 1) {
      return this.splitByHeadings(doc, headings);
    }
    
    return [doc.body || doc.documentElement];
  }

  private splitByHeadings(doc: Document, headings: Element[]): Element[] {
    const chapters: Element[] = [];
    
    for (let i = 0; i < headings.length; i++) {
      const startHeading = headings[i];
      const endHeading = headings[i + 1];
      
      const chapterDiv = doc.createElement('div');
      chapterDiv.appendChild(startHeading.cloneNode(true));
      
      let currentElement = startHeading.nextElementSibling;
      while (currentElement && currentElement !== endHeading) {
        chapterDiv.appendChild(currentElement.cloneNode(true));
        currentElement = currentElement.nextElementSibling;
      }
      
      chapters.push(chapterDiv);
    }
    
    return chapters;
  }

  private extractTitleFromElement(element: Element): string | null {
    const titleEl = element.querySelector('h1, h2, h3, .title, .chapter-title');
    return titleEl?.textContent?.trim() || null;
  }

  private extractDocumentTitle(doc: Document): string | null {
    const titleEl = doc.querySelector('title, h1');
    return titleEl?.textContent?.trim() || null;
  }

  private extractTitleFromText(content: string): string | null {
    const lines = content.trim().split('\n');
    const firstLine = lines[0]?.trim();
    
    // Check if first line looks like a title
    if (firstLine && firstLine.length < 100 && 
        (firstLine.match(/^(Chapter|CHAPTER|\d+\.)/i) || 
         firstLine === firstLine.toUpperCase())) {
      return firstLine;
    }
    
    return null;
  }

  private formatTextContent(content: string): string {
    // Convert plain text to HTML with proper paragraph structure
    const paragraphs = content.trim()
      .split(/\n\s*\n/)
      .filter(p => p.trim())
      .map((p, index) => {
        const text = p.trim().replace(/\n/g, ' ');
        return `<p id="para-${index}" class="mb-4">${this.escapeHtml(text)}</p>`;
      });
    
    return paragraphs.join('\n');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private createFallbackChapter(): EpubChapter[] {
    return [{
      id: 'chapter-1',
      title: 'Document',
      content: this.formatTextContent(this.content),
      order: 1
    }];
  }
}

/**
 * Utility function to parse EPUB content
 */
export function parseEpubContent(content: string): {
  chapters: EpubChapter[];
  metadata: EpubMetadata;
} {
  const parser = new EpubParser(content);
  
  return {
    chapters: parser.parseChapters(),
    metadata: parser.parseMetadata()
  };
}