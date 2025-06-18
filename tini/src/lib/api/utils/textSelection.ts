// src/lib/utils/textSelection.ts
import type { TextSelection } from '$lib/types/document';

export interface SelectionInfo {
  selectedText: string;
  startContainerId: string;
  endContainerId: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number;
  boundingRect?: DOMRect;
  contextBefore?: string;
  contextAfter?: string;
  chapterTitle?: string;
}

export function getTextSelection(): SelectionInfo | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const selectedText = range.toString().trim();
  
  if (!selectedText) {
    return null;
  }

  // Get bounding rectangle
  const boundingRect = range.getBoundingClientRect();

  // Get container elements
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  // Find the closest elements with IDs or create unique identifiers
  const startElement = getClosestElementWithId(startContainer);
  const endElement = getClosestElementWithId(endContainer);

  // Extract page number from context
  const pageNumber = extractPageNumber(startElement) || 1;

  // Extract chapter title if available
  const chapterTitle = extractChapterTitle(startElement);

  // Get context before and after
  const contextBefore = getContextBefore(range, 100);
  const contextAfter = getContextAfter(range, 100);

  return {
    selectedText,
    startContainerId: startElement.id || generateElementId(startElement),
    endContainerId: endElement.id || generateElementId(endElement),
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    pageNumber,
    boundingRect,
    contextBefore,
    contextAfter,
    chapterTitle
  };
}

function getClosestElementWithId(node: Node): Element {
  let element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  
  while (element && !element.id) {
    element = element.parentElement;
  }
  
  return element || (node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement!);
}

function generateElementId(element: Element): string {
  // Generate a unique ID based on the element's position and content
  const tagName = element.tagName.toLowerCase();
  const textContent = element.textContent?.substring(0, 50).replace(/\s+/g, '-') || '';
  const timestamp = Date.now();
  
  return `${tagName}-${textContent}-${timestamp}`.replace(/[^a-zA-Z0-9-]/g, '');
}

function extractPageNumber(element: Element): number | null {
  // Look for page indicators in the element tree
  let current = element;
  
  while (current) {
    // Check for data attributes
    if (current.dataset?.page) {
      return parseInt(current.dataset.page, 10);
    }
    
    // Check for class names containing page numbers
    const pageMatch = current.className.match(/page-(\d+)/);
    if (pageMatch) {
      return parseInt(pageMatch[1], 10);
    }
    
    // Check for ID containing page numbers
    const idMatch = current.id.match(/page-?(\d+)/i);
    if (idMatch) {
      return parseInt(idMatch[1], 10);
    }
    
    current = current.parentElement!;
  }
  
  return null;
}

function extractChapterTitle(element: Element): string | undefined {
  // Look for chapter titles in headings near the selection
  let current = element;
  
  while (current) {
    // Check if current element is a heading
    if (/^h[1-6]$/i.test(current.tagName)) {
      return current.textContent?.trim();
    }
    
    // Look for chapter indicators
    if (current.dataset?.chapter) {
      return current.dataset.chapter;
    }
    
    // Find previous headings
    const headings = current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      const lastHeading = headings[headings.length - 1];
      return lastHeading.textContent?.trim();
    }
    
    current = current.parentElement!;
  }
  
  return undefined;
}

function getContextBefore(range: Range, maxLength: number): string {
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;
  
  let context = '';
  
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = startContainer as Text;
    const beforeText = textNode.textContent?.substring(0, startOffset) || '';
    context = beforeText.substring(Math.max(0, beforeText.length - maxLength));
  }
  
  return context.trim();
}

function getContextAfter(range: Range, maxLength: number): string {
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;
  
  let context = '';
  
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const textNode = endContainer as Text;
    const afterText = textNode.textContent?.substring(endOffset) || '';
    context = afterText.substring(0, maxLength);
  }
  
  return context.trim();
}

export function applyHighlights(content: string, highlights: Array<{ id: string; color: string; selected_text: string }>): string {
  let highlightedContent = content;
  
  // Sort highlights by length (longest first) to avoid conflicts
  const sortedHighlights = [...highlights].sort((a, b) => b.selected_text.length - a.selected_text.length);
  
  for (const highlight of sortedHighlights) {
    const regex = new RegExp(escapeRegExp(highlight.selected_text), 'gi');
    highlightedContent = highlightedContent.replace(regex, (match) => {
      return `<mark class="highlight" style="background-color: ${highlight.color};" data-highlight-id="${highlight.id}">${match}</mark>`;
    });
  }
  
  return highlightedContent;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function clearSelection(): void {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}