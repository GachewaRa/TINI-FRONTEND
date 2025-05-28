// src/lib/types/projects.ts

import type { Tag } from './tags'; // Assuming tags type is defined here or similar path
import type { Note } from './notes'; // Assuming notes type is defined here or similar path

export interface ProjectBase {
  title: string;
  content: string; // Assuming HTML content
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'; // Define possible statuses
  folder_id: string | null; // UUID for folder, can be null for root projects
}

// Full Project interface as received from the API (after date conversion)
export interface Project extends ProjectBase {
  id: string; // UUID
  created_at: Date; // Converted from string to Date
  updated_at: Date; // Converted from string to Date
  tags: Tag[]; // Nested Tag objects
  notes: Note[]; // Nested Note objects (adjust if these are just IDs or summaries)
}

// Data structure for creating a new project
export interface ProjectCreate {
  title: string;
  content?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'; // Optional for creation if backend has defaults
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

// API Response for a single project (as it comes directly from the backend before Date conversion)
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

// --- Project Folder Types ---

export interface ProjectFolderBase {
  name: string;
  description?: string;
}

// Full ProjectFolder interface as received from the API (after date conversion)
export interface ProjectFolder extends ProjectFolderBase {
  id: string; // UUID
  created_at: Date; // Converted from string to Date
  updated_at: Date; // Converted from string to Date
  // projects?: Project[]; // Optional: if you fetch nested projects
}

// Data structure for creating a new project folder
export interface ProjectFolderCreate {
  name: string;
  description?: string;
}

// Data structure for updating an existing project folder
export interface ProjectFolderUpdate {
  name?: string;
  description?: string;
}

// API Response for a single project folder (as it comes directly from the backend before Date conversion)
export interface ProjectFolderResponse extends Omit<ProjectFolder, 'created_at' | 'updated_at'> {
  created_at: string; // String format from API
  updated_at: string; // String format from API
  // projects?: ProjectResponse[]; // If backend sends nested projects
}

// Query parameters for fetching multiple project folders
export interface ProjectFoldersQueryParams {
  search?: string;
  limit?: number;
  offset?: number;
}