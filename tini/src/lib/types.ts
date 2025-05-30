// src/lib/types.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  source: string;
  extra_metadata?: Record<string, any>;
  highlights_id?: string;
  created_at: Date;
  updated_at: Date;
  tags: Tag[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  note_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Highlight {
  id: string;
  content: string;
  book_title: string;
  author?: string;
  created_at: Date;
  updated_at: Date;
  notes_from_highlight: Note[];
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  parent_id?: string;
  created_at: Date;
  updated_at: Date;
  children?: Tag[];
  parent?: Tag;
}

export interface Project {
  id: string;
  title: string;
  content: string;
  status: ProjectStatus;
  folder_id?: string;
  created_at: Date;
  updated_at: Date;
  folder?: ProjectFolder;
  notes: Note[];
  tags: Tag[];
}

export interface ProjectFolder {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  projects: Project[];
}

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface SearchFilters {
  keyword: string;
  tags: string[];
  tagOperation: 'and' | 'or';
}

// src/lib/types.ts - Updated with new fields for API integration

// export interface Note {
//   id: string;
//   title: string;
//   content: string;
//   source: string;
//   created_at: string | Date;
//   updated_at: string | Date;
//   extra_metadata?: Record<string, any>;
//   highlights_id?: string;
  
//   // Relationships
//   tags?: Tag[];
//   comments?: Comment[];
//   matters?: Matter[];
//   projects?: Project[];
//   source_highlights?: Highlight[];
// }

// export interface Comment {
//   id: string;
//   content: string;
//   note_id: string;
//   created_at: string | Date;
//   updated_at: string | Date;
// }

// export interface Tag {
//   id: string;
//   name: string;
//   color: string;
//   description?: string;
//   created_at: string | Date;
//   updated_at: string | Date;
// }

// export interface Project {
//   id: string;
//   name: string;
//   description?: string;
//   status?: string;
//   created_at: string | Date;
//   updated_at: string | Date;
  
//   // Relationships
//   notes?: Note[];
// }

// export interface Matter {
//   id: string;
//   name: string;
//   description?: string;
//   status?: string;
//   created_at: string | Date;
//   updated_at: string | Date;
  
//   // Relationships
//   notes?: Note[];
// }

// export interface Highlight {
//   id: string;
//   content: string;
//   source: string;
//   created_at: string | Date;
//   updated_at: string | Date;
  
//   // Relationships
//   notes?: Note[];
// }

// // Search and filter types
// export interface SearchFilters {
//   keyword: string;
//   tags: string[];
//   tagOperation: 'and' | 'or';
//   dateRange?: {
//     start: Date;
//     end: Date;
//   };
// }

// // API Response types
// export interface APIResponse<T> {
//   data: T;
//   message?: string;
//   status: number;
// }

// export interface PaginatedResponse<T> {
//   items: T[];
//   total: number;
//   page: number;
//   per_page: number;
//   pages: number;
// }

// // Form data types
// export interface CreateNoteData {
//   title: string;
//   content: string;
//   source: string;
//   tag_ids?: string[];
// }

// export interface UpdateNoteData {
//   title?: string;
//   content?: string;
//   source?: string;
//   tag_ids?: string[];
// }