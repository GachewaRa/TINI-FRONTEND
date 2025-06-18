// src/lib/utils/document.ts
// import type { TextSelection } from '$lib/types/document';

// export function formatFileSize(bytes: number): string {
//   if (bytes === 0) return '0 B';
  
//   const k = 1024;
//   const sizes = ['B', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
  
//   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
// }

export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function getFileType(filename: string): 'pdf' | 'epub' | 'unknown' {
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'epub':
      return 'epub';
    default:
      return 'unknown';
  }
}

export function isValidDocumentFile(file: File): boolean {
  const validTypes = ['application/pdf', 'application/epub+zip'];
  const validExtensions = ['pdf', 'epub'];
  const extension = file.name.toLowerCase().split('.').pop();
  
  return validTypes.includes(file.type) || (extension && validExtensions.includes(extension));
}

// export function getTextSelection(): TextSelection | null {
//   const selection = window.getSelection();
//   if (!selection || selection.rangeCount === 0) return null;
  
//   const range = selection.getRangeAt(0);
//   const selectedText = selection.toString().trim();
  
//   if (!selectedText) return null;
  
//   // Get context around selection
//   const container = range.commonAncestorContainer;
//   const fullText = container.textContent || '';
//   const startOffset = range.startOffset;
//   const endOffset = range.endOffset;
  
//   // Extract context (50 characters before and after)
//   const contextStart = Math.max(0, startOffset - 50);
//   const contextEnd = Math.min(fullText.length, endOffset + 50);
//   const contextBefore = fullText.substring(contextStart, startOffset);
//   const contextAfter = fullText.substring(endOffset, contextEnd);
  
//   // Get bounding rectangle
//   const boundingRect = range.getBoundingClientRect();
  
//   return {
//     text: selectedText,
//     startOffset,
//     endOffset,
//     contextBefore,
//     contextAfter,
//     boundingRect
//   };
// }

// export function clearSelection(): void {
//   const selection = window.getSelection();
//   if (selection) {
//     selection.removeAllRanges();
//   }
// }

// export function highlightColor(color: string = '#ffff00'): string {
//   // Convert hex to rgba with opacity
//   const hex = color.replace('#', '');
//   const r = parseInt(hex.substr(0, 2), 16);
//   const g = parseInt(hex.substr(2, 2), 16);
//   const b = parseInt(hex.substr(4, 2), 16);
//   return `rgba(${r}, ${g}, ${b}, 0.3)`;
// }

// export function truncateText(text: string, maxLength: number = 100): string {
//   if (text.length <= maxLength) return text;
//   return text.substring(0, maxLength) + '...';
// }






// src/lib/utils/document.ts

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function getFileTypeIcon(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'epub':
      return '📚';
    default:
      return '📄';
  }
}

export function getProcessingStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-500';
    case 'PROCESSING':
      return 'text-yellow-500';
    case 'FAILED':
    case 'ERROR':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getProcessingStatusText(status: string): string {
  switch (status) {
    case 'UPLOADED':
      return 'Uploaded';
    case 'PROCESSING':
      return 'Processing...';
    case 'COMPLETED':
      return 'Ready';
    case 'FAILED':
      return 'Failed';
    case 'ERROR':
      return 'Error';
    default:
      return 'Unknown';
  }
}

export function canHighlightDocument(document: { file_type: string; is_html_ready: boolean }): boolean {
  return document.file_type === 'epub' || 
         (document.file_type === 'pdf' && document.is_html_ready);
}

export function extractTextFromHTML(html: string): string {
  // Create a temporary div to extract text content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getHighlightColors(): Array<{ name: string; value: string }> {
  return [
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#90ee90' },
    { name: 'Blue', value: '#87ceeb' },
    { name: 'Pink', value: '#ffb6c1' },
    { name: 'Orange', value: '#ffa500' },
    { name: 'Purple', value: '#dda0dd' },
    { name: 'Red', value: '#ff6b6b' },
    { name: 'Cyan', value: '#40e0d0' }
  ];
}