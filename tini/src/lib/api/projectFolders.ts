// src/lib/api/projectFolders.ts
import { apiClient, withLoading } from './client';
import type {
  ProjectFolderResponse,
  ProjectFolderCreate,
  ProjectFolderUpdate,
  ProjectFoldersQueryParams,
  ProjectResponse
} from '../types/projects';

export class ProjectFoldersAPI {
  private static readonly BASE_PATH = '/api/v1/project-folders'; 

  static async getProjectFolders(params?: ProjectFoldersQueryParams): Promise<ProjectFolderResponse[]> {
    return withLoading(
      apiClient.get<ProjectFolderResponse[]>(this.BASE_PATH, params)
    );
  }

  static async getProjectFolder(folderId: string): Promise<ProjectFolderResponse> {
    return withLoading(
      apiClient.get<ProjectFolderResponse>(`${this.BASE_PATH}/${folderId}`)
    );
  }

  /**
   * Get all projects in a specific folder
   */
  static async getFolderProjects(folderId: string): Promise<ProjectResponse[]> {
    return withLoading(
      apiClient.get<ProjectResponse[]>(`/api/v1/projects/folders/${folderId}/projects`)
    );
  }

  static async createProjectFolder(folderData: ProjectFolderCreate): Promise<ProjectFolderResponse> {
    return withLoading(
      apiClient.post<ProjectFolderResponse>(this.BASE_PATH, folderData)
    );
  }

  static async updateProjectFolder(folderId: string, folderData: ProjectFolderUpdate): Promise<ProjectFolderResponse> {
    return withLoading(
      apiClient.put<ProjectFolderResponse>(`${this.BASE_PATH}/${folderId}`, folderData)
    );
  }

  static async deleteProjectFolder(folderId: string): Promise<void> {
    return withLoading(
      apiClient.delete<void>(`${this.BASE_PATH}/${folderId}`)
    );
  }
}