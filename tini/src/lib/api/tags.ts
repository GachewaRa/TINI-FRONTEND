// src/lib/api/tags.ts
import { apiClient, withLoading } from './client';
import type { 
  Tag, 
  TagCreate, 
  TagUpdate, 
  TagResponse, 
  TagsListResponse,
  TagsQueryParams 
} from '../types/tags';

export class TagsAPI {
  private static readonly BASE_PATH = '/api/v1/tags';

  /**
   * Get all tags with optional filtering
   */
  static async getTags(params?: TagsQueryParams): Promise<Tag[]> {
    return withLoading(
      apiClient.get<Tag[]>(this.BASE_PATH, params)
    );
  }

  /**
   * Get root tags (tags without parents)
   */
  static async getRootTags(): Promise<Tag[]> {
    return withLoading(
      apiClient.get<Tag[]>(`${this.BASE_PATH}/roots`)
    );
  }

  /**
   * Get a specific tag by ID
   */
  static async getTag(tagId: string): Promise<TagResponse> {
    return withLoading(
      apiClient.get<TagResponse>(`${this.BASE_PATH}/${tagId}`)
    );
  }

  /**
   * Get a tag with its full hierarchy (all descendants)
   */
  static async getTagHierarchy(tagId: string): Promise<TagResponse> {
    return withLoading(
      apiClient.get<TagResponse>(`${this.BASE_PATH}/${tagId}/hierarchy`)
    );
  }

  /**
   * Create a new tag
   */
  static async createTag(tagData: TagCreate): Promise<TagResponse> {
    return withLoading(
      apiClient.post<TagResponse>(this.BASE_PATH, tagData)
    );
  }

  /**
   * Update a tag
   */
  static async updateTag(tagId: string, tagData: TagUpdate): Promise<TagResponse> {
    return withLoading(
      apiClient.put<TagResponse>(`${this.BASE_PATH}/${tagId}`, tagData)
    );
  }

  /**
   * Delete a tag
   */
  static async deleteTag(tagId: string): Promise<void> {
    return withLoading(
      apiClient.delete<void>(`${this.BASE_PATH}/${tagId}`)
    );
  }

  /**
   * Move a tag to a new parent (used for drag & drop)
   */
  static async moveTag(tagId: string, newParentId?: string | null): Promise<TagResponse> {
    return this.updateTag(tagId, { parent_id: newParentId });
  }
}