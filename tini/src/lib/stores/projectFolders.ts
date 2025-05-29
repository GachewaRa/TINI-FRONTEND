// src/lib/stores/projectFolders.ts
import { writable, derived } from 'svelte/store';
import { ProjectFoldersAPI } from '$lib/api/projectFolders'; // Import your new API client
import type { ProjectFolder, ProjectFolderResponse } from '$lib/types/projects';


interface ProjectFoldersState {
  folders: ProjectFolder[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectFoldersState = {
  folders: [],
  isLoading: false,
  error: null,
};

const { subscribe, set, update } = writable<ProjectFoldersState>(initialState);

export const projectFoldersStore = {
  subscribe,
  load: async () => { 
    update(state => ({ ...state, isLoading: true, error: null }));
    try {
      const data: ProjectFolderResponse[] = await ProjectFoldersAPI.getProjectFolders();
      const processedFolders: ProjectFolder[] = data.map(folder => ({
        ...folder,
        created_at: new Date(folder.created_at),
        updated_at: new Date(folder.updated_at),
      }));
      set({ folders: processedFolders, isLoading: false, error: null });
    } catch (err: any) {
      console.error('Failed to load project folders:', err);
      set({ folders: [], isLoading: false, error: err.detail || 'Failed to load project folders' });
    }
  },
  clearError: () => update(state => ({ ...state, error: null })),
  refresh: async () => {
    await projectFoldersStore.load();
  }
};

// Derived stores for easy access
export const projectFolders = derived(projectFoldersStore, $state => $state.folders);
export const projectFoldersLoading = derived(projectFoldersStore, $state => $state.isLoading);
export const projectFoldersError = derived(projectFoldersStore, $state => $state.error);