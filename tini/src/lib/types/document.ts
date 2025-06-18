// src/lib/types/document.ts
// export interface Document {
//   id: string;
//   title: string;
//   original_filename: string;
//   file_type: 'pdf' | 'epub';
//   file_size: number;
//   cloudinary_public_id: string;
//   cloudinary_url: string;
//   total_pages?: number;
//   upload_date: Date;
//   document_highlights?: DocumentHighlight[];
// }

// export interface DocumentHighlight {
//   id: string;
//   document_id: string;
//   selected_text: string;
//   context_before?: string;
//   context_after?: string;
//   page_number?: number;
//   chapter_title?: string;
//   section_id?: string;
//   start_offset?: number;
//   end_offset?: number;
//   x_coordinate?: number;
//   y_coordinate?: number;
//   width?: number;
//   height?: number;
//   user_note?: string;
//   color: string;
//   highlight_date: Date;
//   is_favorite: boolean;
//   document?: Document;
//   notes_from_highlight?: any[];
// }

// export interface CreateDocumentHighlightRequest {
//   document_id: string;
//   selected_text: string;
//   context_before?: string;
//   context_after?: string;
//   page_number?: number;
//   chapter_title?: string;
//   section_id?: string;
//   start_offset?: number;
//   end_offset?: number;
//   x_coordinate?: number;
//   y_coordinate?: number;
//   width?: number;
//   height?: number;
//   user_note?: string;
//   color?: string;
//   is_favorite?: boolean;
// }

// export interface DocumentUploadRequest {
//   title: string;
//   file: File;
// }

// export interface TextSelection {
//   text: string;
//   startOffset: number;
//   endOffset: number;
//   contextBefore?: string;
//   contextAfter?: string;
//   boundingRect?: DOMRect;
//   pageNumber?: number;
//   chapterTitle?: string;
//   sectionId?: string;
// }

// src/lib/types/document.ts

export interface Document {
  id: string;
  title: string;
  original_filename: string;
  file_type: 'pdf' | 'epub';
  file_size: number;
  cloudinary_url: string;
  html_url?: string;
  total_pages?: number;
  upload_date: Date;
  highlight_count: number;
  processing_status: DocumentStatus;
  is_html_ready: boolean;
  document_highlights?: DocumentHighlight[];
}

export type DocumentStatus = 
  | 'UPLOADED' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'ERROR';

export interface DocumentHighlight {
  id: string;
  document_id: string;
  selected_text: string;
  context_before?: string;
  context_after?: string;
  page_number?: number;
  chapter_title?: string;
  section_id?: string;
  start_offset?: number;
  end_offset?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  width?: number;
  height?: number;
  user_note?: string;
  color: string;
  is_favorite: boolean;
  highlight_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TextSelection {
  selected_text: string;
  start_container_id: string;
  end_container_id: string;
  start_offset: number;
  end_offset: number;
  page_number: number;
  bounding_rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  context_before?: string;
  context_after?: string;
  chapter_title?: string;
}

export interface CreateDocumentHighlightRequest {
  selected_text: string;
  context_before?: string;
  context_after?: string;
  page_number?: number;
  chapter_title?: string;
  section_id?: string;
  start_offset?: number;
  end_offset?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  width?: number;
  height?: number;
  user_note?: string;
  color: string;
  is_favorite?: boolean;
}

export interface DocumentUploadRequest {
  title: string;
  file: File;
}

export interface DocumentHighlightStatistics {
  total_highlights: number;
  by_color: Record<string, number>;
  by_page: Record<number, number>;
  favorites: number;
}