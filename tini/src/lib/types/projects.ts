// // src/lib/types/projects.ts
export interface ProjectFolderBase {
  name: string;
  description?: string;
}

export interface ProjectFolderCreate extends ProjectFolderBase {}

export interface ProjectFolderUpdate extends Partial<ProjectFolderBase> {}

export interface ProjectFoldersQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  include_projects?: boolean;
}

// Make sure these are also defined in your existing types:
export interface Project {
  id: string;
  title: string;
  content: string;
  status: ProjectStatus;
  folder_id?: string;
  folder?: ProjectFolder;
  notes?: Note[];
  tags: Tag[];
  created_at: Date;
  updated_at: Date;
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
}

// Data structure for creating a new project
export interface ProjectCreate {
  title: string;
  content?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'; // Optional for creation if backend has defaults
  folder_id?: string | null;
  tag_ids?: string[]; // Array of tag IDs to associate
}

// Data structure for updating an existing project
export interface ProjectUpdate {
  title?: string;
  content?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  folder_id?: string | null;
  tag_ids?: string[]; // For updating associated tags
}

// // API Response for a single project (as it comes directly from the backend before Date conversion)
export interface ProjectResponse extends Omit<Project, 'created_at' | 'updated_at' | 'tags' | 'notes'> {
  created_at: string; // String format from API
  updated_at: string; // String format from API
  tags: Tag[]; // Backend might send full tags or just IDs; adjust based on your API
  notes: Note[]; // Backend might send full notes or just IDs; adjust based on your API
}

// Query parameters for fetching multiple projects
export interface ProjectsQueryParams {
  search?: string;
  tag_ids?: string[]; // Filter by tag IDs
  folder_id?: string; // Filter by folder ID
  status?: string; // Filter by status
  limit?: number;
  offset?: number;
}

// Full ProjectFolder interface as received from the API (after date conversion)
export interface ProjectFolder extends ProjectFolderBase {
  id: string; // UUID
  created_at: Date; // Converted from string to Date
  updated_at: Date; // Converted from string to Date
  // projects?: Project[]; // Optional: if you fetch nested projects
}

// API Response for a single project folder (as it comes directly from the backend before Date conversion)
export interface ProjectFolderResponse extends Omit<ProjectFolder, 'created_at' | 'updated_at'> {
  created_at: string; // String format from API
  updated_at: string; // String format from API
  // projects?: ProjectResponse[]; // If backend sends nested projects
}
