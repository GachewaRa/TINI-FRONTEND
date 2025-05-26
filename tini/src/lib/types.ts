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