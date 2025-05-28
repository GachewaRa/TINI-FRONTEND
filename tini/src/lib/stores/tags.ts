// src/lib/stores/tags.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { TagsAPI } from '../api/tags';
import type { Tag, TagNode } from '../types/tags';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface TagsState {
  tags: Tag[];
  lastFetched: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TagsState = {
  tags: [],
  lastFetched: null,
  isLoading: false,
  error: null
};

// Create the main tags store
function createTagsStore() {
  const { subscribe, set, update } = writable<TagsState>(initialState);

  return {
    subscribe,
    
    // Load tags from API with caching
    async load(forceRefresh = false) {
      if (!browser) return;

      update(state => {
        // Check if we have cached data that's still fresh
        if (!forceRefresh && 
            state.tags.length > 0 && 
            state.lastFetched && 
            Date.now() - state.lastFetched < CACHE_DURATION) {
          return state; // Return cached data
        }

        return { ...state, isLoading: true, error: null };
      });

      try {
        const tags = await TagsAPI.getTags({ include_children: true });
        
        update(state => ({
          ...state,
          tags,
          lastFetched: Date.now(),
          isLoading: false,
          error: null
        }));
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load tags'
        }));
        throw error;
      }
    },

    // Add a new tag to the store
    async addTag(tagData: { name: string; description?: string; color?: string; parent_id?: string }) {
      try {
        const newTag = await TagsAPI.createTag(tagData);
        
        update(state => ({
          ...state,
          tags: [...state.tags, newTag]
        }));

        return newTag;
      } catch (error) {
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to create tag'
        }));
        throw error;
      }
    },

    // Update a tag in the store
    async updateTag(tagId: string, updates: Partial<Tag>) {
      try {
        const updatedTag = await TagsAPI.updateTag(tagId, updates);
        
        update(state => ({
          ...state,
          tags: state.tags.map(tag => 
            tag.id === tagId ? updatedTag : tag
          )
        }));

        return updatedTag;
      } catch (error) {
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to update tag'
        }));
        throw error;
      }
    },

    // Move a tag (for drag & drop)
    async moveTag(tagId: string, newParentId?: string | null) {
      try {
        const updatedTag = await TagsAPI.moveTag(tagId, newParentId);
        
        update(state => ({
          ...state,
          tags: state.tags.map(tag => 
            tag.id === tagId ? updatedTag : tag
          )
        }));

        return updatedTag;
      } catch (error) {
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to move tag'
        }));
        throw error;
      }
    },

    // Delete a tag from the store
    async deleteTag(tagId: string) {
      try {
        await TagsAPI.deleteTag(tagId);
        
        update(state => ({
          ...state,
          tags: state.tags.filter(tag => tag.id !== tagId)
        }));
      } catch (error) {
        update(state => ({
          ...state,
          error: error instanceof Error ? error.message : 'Failed to delete tag'
        }));
        throw error;
      }
    },

    // Clear error state
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    // Force refresh
    async refresh() {
      return this.load(true);
    },

    // Clear cache and reset store
    reset() {
      set(initialState);
    }
  };
}

export const tagsStore = createTagsStore();

// Derived stores for convenience
export const tags = derived(tagsStore, state => state.tags);
export const tagsLoading = derived(tagsStore, state => state.isLoading);
export const tagsError = derived(tagsStore, state => state.error);

// Derived store for tag hierarchy
export const tagHierarchy = derived(tags, (tagList) => {
  return buildHierarchy(tagList);
});

// Derived store for root tags only
export const rootTags = derived(tags, (tagList) => {
  return tagList.filter(tag => !tag.parent_id);
});

// Helper function to build hierarchy
function buildHierarchy(tagList: Tag[]): TagNode[] {
  const tagMap = new Map(tagList.map(tag => [tag.id, { ...tag, children: [] as TagNode[] }]));
  const roots: TagNode[] = [];
  
  tagList.forEach(tag => {
    const tagNode = tagMap.get(tag.id);
    if (tag.parent_id && tagMap.has(tag.parent_id)) {
      tagMap.get(tag.parent_id)!.children.push(tagNode!);
    } else {
      roots.push(tagNode!);
    }
  });
  
  // Add depth information
  function addDepth(nodes: TagNode[], depth = 0) {
    nodes.forEach(node => {
      node.depth = depth;
      addDepth(node.children, depth + 1);
    });
  }
  
  addDepth(roots);
  
  return roots;
}

// Helper functions for working with tags
export function getTagById(tagList: Tag[], id: string): Tag | undefined {
  return tagList.find(tag => tag.id === id);
}

export function getTagsByParent(tagList: Tag[], parentId: string | null): Tag[] {
  return tagList.filter(tag => tag.parent_id === parentId);
}

export function getTagDescendants(tagList: Tag[], tagId: string): Tag[] {
  const children = tagList.filter(tag => tag.parent_id === tagId);
  const descendants = [...children];
  
  children.forEach(child => {
    descendants.push(...getTagDescendants(tagList, child.id));
  });
  
  return descendants;
}

export function getTagDepth(tagList: Tag[], tag: Tag): number {
  let depth = 0;
  let current = tag;
  
  while (current.parent_id) {
    depth++;
    const parent = tagList.find(t => t.id === current.parent_id);
    if (!parent) break;
    current = parent;
  }
  
  return depth;
}