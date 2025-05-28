// src/lib/api/projectFolders.ts
import { apiClient, withLoading } from './client';
import type {
  ProjectFolderResponse,
  ProjectFolderCreate,
  ProjectFolderUpdate,
  ProjectFoldersQueryParams
} from '../types/projects'; // Adjust path if needed (using projects.ts for shared folder types)

export class ProjectFoldersAPI {
  private static readonly BASE_PATH = '/api/v1/project-folders'; // Assuming this endpoint

  /**
   * Get all project folders with optional filtering
   */
  static async getProjectFolders(params?: ProjectFoldersQueryParams): Promise<ProjectFolderResponse[]> {
    return withLoading(
      apiClient.get<ProjectFolderResponse[]>(this.BASE_PATH, params)
    );
  }

  /**
   * Get a specific project folder by ID
   */
  static async getProjectFolder(folderId: string): Promise<ProjectFolderResponse> {
    return withLoading(
      apiClient.get<ProjectFolderResponse>(`${this.BASE_PATH}/${folderId}`)
    );
  }

  /**
   * Create a new project folder
   */
  static async createProjectFolder(folderData: ProjectFolderCreate): Promise<ProjectFolderResponse> {
    return withLoading(
      apiClient.post<ProjectFolderResponse>(this.BASE_PATH, folderData)
    );
  }

  /**
   * Update a project folder
   */
  static async updateProjectFolder(folderId: string, folderData: ProjectFolderUpdate): Promise<ProjectFolderResponse> {
    return withLoading(
      apiClient.put<ProjectFolderResponse>(`${this.BASE_PATH}/${folderId}`, folderData)
    );
  }

  /**
   * Delete a project folder
   */
  static async deleteProjectFolder(folderId: string): Promise<void> {
    return withLoading(
      apiClient.delete<void>(`${this.BASE_PATH}/${folderId}`)
    );
  }
}