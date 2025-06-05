// src/lib/types/document.ts
export interface Document {
  id: string;
  title: string;
  original_filename: string;
  file_type: 'pdf' | 'epub';
  file_size: number;
  cloudinary_public_id: string;
  cloudinary_url: string;
  total_pages?: number;
  upload_date: Date;
  document_highlights?: DocumentHighlight[];
}

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
  highlight_date: Date;
  is_favorite: boolean;
  document?: Document;
  notes_from_highlight?: any[];
}

export interface CreateDocumentHighlightRequest {
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
  color?: string;
  is_favorite?: boolean;
}

export interface DocumentUploadRequest {
  title: string;
  file: File;
}

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  contextBefore?: string;
  contextAfter?: string;
  boundingRect?: DOMRect;
  pageNumber?: number;
  chapterTitle?: string;
  sectionId?: string;
}