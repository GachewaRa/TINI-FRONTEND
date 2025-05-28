// src/lib/types/tags.ts
export interface Tag {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  children?: Tag[];
}

export interface TagCreate {
  name: string;
  description?: string | null;
  color?: string | null;
  parent_id?: string | null;
}

export interface TagUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  parent_id?: string | null;
}

export interface TagResponse extends Tag {}

export interface TagsListResponse {
  tags: Tag[];
  total: number;
}

// Query parameters for tag endpoints
export interface TagsQueryParams {
  skip?: number;
  limit?: number;
  parent_id?: string | null;
  include_children?: boolean;
}

// For hierarchy building
export interface TagNode extends Tag {
  children: TagNode[];
  depth?: number;
}