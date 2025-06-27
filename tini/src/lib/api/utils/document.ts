export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function getFileType(filename: string): 'html' | 'epub' | 'unknown' {
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'html':
      return 'html';
    case 'epub':
      return 'epub';
    default:
      return 'unknown';
  }
}

export function isValidDocumentFile(file: File): boolean {
  const validTypes = ['application/html', 'application/epub+zip'];
  const validExtensions = ['html', 'epub'];
  const extension = file.name.toLowerCase().split('.').pop();
  
  return validTypes.includes(file.type) || (extension && validExtensions.includes(extension));
}

export function getFileTypeIcon(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'html':
      return '📄';
    case 'epub':
      return '📚';
    default:
      return '📄';
  }
}


export function canHighlightDocument(document: { file_type: string; is_html_ready: boolean }): boolean {
  return document.file_type === 'epub' || 
         (document.file_type === 'html' );
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