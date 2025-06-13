// src/lib/api/projects.ts
import { apiClient, withLoading } from './client';
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectResponse,
  ProjectsQueryParams
} from '../types/projects'; // Adjust path if needed

export class ProjectsAPI {
  private static readonly BASE_PATH = '/api/v1/projects';

  /**
   * Get all projects with optional filtering
   */
  static async getProjects(params?: ProjectsQueryParams): Promise<ProjectResponse[]> {
    return withLoading(
      apiClient.get<ProjectResponse[]>(this.BASE_PATH, params)
    );
  }

  /**
   * Get all projects in a specific folder
   */
  static async getProjectsInFolder(folderId: string): Promise<ProjectResponse[]> {
    return withLoading(
      apiClient.get<ProjectResponse[]>(`/api/v1/projects/folders/${folderId}/projects`)
    );
  }


  /**
   * Get a specific project by ID
   */
  static async getProject(projectId: string): Promise<ProjectResponse> {
    return withLoading(
      apiClient.get<ProjectResponse>(`${this.BASE_PATH}/${projectId}`)
    );
  }

  /**
   * Create a new project
   */
  static async createProject(projectData: ProjectCreate): Promise<ProjectResponse> {
    return withLoading(
      apiClient.post<ProjectResponse>(this.BASE_PATH, projectData)
    );
  }

  /**
   * Update a project
   */
  static async updateProject(projectId: string, projectData: ProjectUpdate): Promise<ProjectResponse> {
    return withLoading(
      apiClient.put<ProjectResponse>(`${this.BASE_PATH}/${projectId}`, projectData)
    );
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string): Promise<void> {
    return withLoading(
      apiClient.delete<void>(`${this.BASE_PATH}/${projectId}`)
    );
  }

  static async addNoteToProject(projectId: string, noteId: string): Promise<void> {
    return withLoading(
      apiClient.post<void>( // Specify <void> as the expected return type from the API response data
        `${this.BASE_PATH}/${projectId}/notes`,
        { note_id: noteId }
      )
    );
  }


  // Remove note from project
  static async removeNoteFromProject(projectId: string, noteId: string): Promise<ProjectResponse> {
    // Append noteId directly to the URL path
    return withLoading(
      apiClient.delete<ProjectResponse>(
        `${this.BASE_PATH}/${projectId}/notes/${noteId}` // <--- Changed HERE
        // No request body needed anymore
      )
    );
  }

  // Hide note in project
  static async hideNoteInProject(projectId: string, noteId: string): Promise<ProjectResponse> {
    return withLoading(
      apiClient.post<ProjectResponse>(
        `${this.BASE_PATH}/${projectId}/notes/${noteId}/hide`
      )
    );
  }

  // Unhide note in project
  static async unhideNoteInProject(projectId: string, noteId: string): Promise<ProjectResponse> {
    return withLoading(
      apiClient.delete<ProjectResponse>(
        `${this.BASE_PATH}/${projectId}/notes/${noteId}/hide`
      )
    );
  }
}