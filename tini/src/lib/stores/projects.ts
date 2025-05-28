// src/lib/stores/projects.ts
import { writable, derived } from 'svelte/store';
import { ProjectsAPI } from '$lib/api/projects'; // Import your new API client
import type { Project, ProjectResponse } from '$lib/types/projects';

interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  isLoading: false,
  error: null,
};

const { subscribe, set, update } = writable<ProjectsState>(initialState);

export const projectsStore = {
  subscribe,
  load: async () => { // Renamed from loadProjects to load for consistency
    update(state => ({ ...state, isLoading: true, error: null }));
    try {
      const data: ProjectResponse[] = await ProjectsAPI.getProjects();
      const processedProjects: Project[] = data.map(project => ({
        ...project,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
        // No need to explicitly handle tags/notes if your API returns them as full objects
        // and your types match. If they are just IDs, you'd process them here.
      }));
      set({ projects: processedProjects, isLoading: false, error: null });
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      set({ projects: [], isLoading: false, error: err.detail || 'Failed to load projects' });
    }
  },
  // Add other methods if you need them to update the store from the client
  // e.g., addProject, updateProject, deleteProject methods that call API then update store
  clearError: () => update(state => ({ ...state, error: null })),
  refresh: async () => {
    await projectsStore.load();
  }
};

// Derived stores for easy access
export const projects = derived(projectsStore, $state => $state.projects);
export const projectsLoading = derived(projectsStore, $state => $state.isLoading);
export const projectsError = derived(projectsStore, $state => $state.error);

// Add helper functions if you need them here (e.g., getProjectById from the store)
// export function getProjectById(id: string): Project | undefined {
//   return get(projects).find(p => p.id === id);
// }