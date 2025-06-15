// First, update your projects store to handle individual project updates
// src/lib/stores/projects.ts
import { writable, derived, get } from 'svelte/store';
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
  addProject: (newProject: Project) => {
    update(state => ({
      ...state,
      projects: [...state.projects, newProject]
    }));
  },
  // ADD THIS METHOD to update individual projects
  updateProject: (updatedProject: Project | ProjectResponse) => {
    const processedProject: Project = {
      ...updatedProject,
      created_at: new Date(updatedProject.created_at),
      updated_at: new Date(updatedProject.updated_at),
      tags: updatedProject.tags || [],
      notes: updatedProject.notes || []
    };
    
    update(state => ({
      ...state,
      projects: state.projects.map(p => 
        p.id === processedProject.id ? processedProject : p
      )
    }));
    
    return processedProject;
  },
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