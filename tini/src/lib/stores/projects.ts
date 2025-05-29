// src/lib/stores/projects.ts
import { writable, derived, get } from 'svelte/store'; // Import get for direct store access
import { ProjectsAPI } from '$lib/api/projects';
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
  load: async () => {
    update(state => ({ ...state, isLoading: true, error: null }));
    try {
      const data: ProjectResponse[] = await ProjectsAPI.getProjects();
      const processedProjects: Project[] = data.map(project => ({
        ...project,
        created_at: new Date(project.created_at),
        updated_at: new Date(project.updated_at),
      }));
      set({ projects: processedProjects, isLoading: false, error: null });
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      set({ projects: [], isLoading: false, error: err.detail || 'Failed to load projects' });
    }
  },
  // --- START MODIFICATION ---
  // Method to add a new project to the store (after successful API creation)
  addProject: (newProject: Project) => {
    update(state => ({
      ...state,
      projects: [...state.projects, newProject]
    }));
  },
  // --- END MODIFICATION ---
  clearError: () => update(state => ({ ...state, error: null })),
  refresh: async () => {
    await projectsStore.load();
  }
};

export const projects = derived(projectsStore, $state => $state.projects);
export const projectsLoading = derived(projectsStore, $state => $state.isLoading);
export const projectsError = derived(projectsStore, $state => $state.error);

// Helper function to get a project by ID directly from the store's current value
export function getProjectById(id: string): Project | undefined {
  return get(projects).find(p => p.id === id);
}