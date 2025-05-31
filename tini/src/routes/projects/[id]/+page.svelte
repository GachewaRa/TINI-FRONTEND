<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Save, ArrowLeft, Folder, Tag as TagIcon, FileText } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import TagSelector from '$lib/components/TagSelector.svelte';
  import NoteCard from '$lib/components/NoteCard.svelte';
  // Fixed imports - using consistent pattern like in create component
  import { projectFolders } from '$lib/stores/projectFolders';
  import { tags } from '$lib/stores/tags';
  import { projects } from '$lib/stores/projects';
  import { notes as allNotesStore } from '$lib/stores';
  import { projectFoldersStore } from '$lib/stores/projectFolders';
  import { tagsStore } from '$lib/stores/tags';
  import { projectsStore } from '$lib/stores/projects';
  import { ProjectsAPI } from '$lib/api/projects';
  import type { Project, ProjectFolder, Tag, Note } from '$lib/types';

  let projectId: string;
  let project: Project | null = null;

  let title = '';
  let content = '';
  let status = 'ACTIVE';
  let selectedFolder: ProjectFolder | null = null;
  let selectedTags: Tag[] = [];
  let isSubmitting = false;
  let errors: { [key: string]: string } = {};

  let allProjectFolders: ProjectFolder[] = [];
  let allAvailableTags: Tag[] = [];
  let allNotes: Note[] = [];

  // Derived state for related notes
  $: relatedNotes = allNotes.filter(note =>
    note.projects?.some(p => p.id === project?.id)
  );

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', description: 'Currently working on' },
    { value: 'COMPLETED', label: 'Completed', description: 'Finished project' },
    { value: 'ARCHIVED', label: 'Archived', description: 'No longer active' }
  ];

  // Subscribe to stores - using consistent pattern
  projectFolders.subscribe(value => {
    allProjectFolders = value;
  });

  // Fixed: Use the derived store consistently
  $: {
    allAvailableTags = $tags;
  }

  allNotesStore.subscribe(value => {
    allNotes = value;
  });

  onMount(async () => {
    projectId = $page.params.id;
    
    try {
      // Load all required data first - similar to create component
      await Promise.all([
        projectFoldersStore.load(),
        tagsStore.load(),
        projectsStore.load()
      ]);

      // Find project in store
      const foundProject = $projects.find(p => p.id === projectId);
      
      if (!foundProject) {
        // If not in store, try fetching directly
        const apiProject = await ProjectsAPI.getProject(projectId);
        project = {
          ...apiProject,
          created_at: new Date(apiProject.created_at),
          updated_at: new Date(apiProject.updated_at)
        };
      } else {
        project = foundProject;
      }

      // Initialize form fields
      title = project.title;
      content = project.content;
      status = project.status;
      
      // Set selected folder
      selectedFolder = allProjectFolders.find(f => f.id === project.folder_id) || null;
      
      // Set selected tags
      selectedTags = project.tags || [];
      
    } catch (error) {
      console.error('Failed to load project:', error);
      goto('/projects');
    }
  });

  function validateForm(): boolean {
    errors = {};

    if (!title.trim()) {
      errors.title = 'Project title is required';
    }

    if (!content.trim()) {
      errors.content = 'Project content is required';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm() || !project) return;

    isSubmitting = true;

    try {
      const updateData = {
        title: title.trim(),
        content: content.trim(),
        status,
        folder_id: selectedFolder?.id?.toString() || null,
        tags: selectedTags.map(t => t.id.toString()) // Ensure string IDs like in create component
      };

      // Update via API
      const updatedProject = await ProjectsAPI.updateProject(project.id, updateData);
      
      // Update local project reference
      project = {
        ...updatedProject,
        created_at: new Date(updatedProject.created_at),
        updated_at: new Date(updatedProject.updated_at),
        tags: updatedProject.tags || [],
        notes: updatedProject.notes || []
      };

      // Update the store
      projectsStore.updateProject(project);

    } catch (error) {
      console.error('Error updating project:', error);
      errors.submit = error instanceof Error ? error.message : 'Failed to update project';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete() {
    if (!project) return;

    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    isSubmitting = true;
    try {
      await ProjectsAPI.deleteProject(project.id);
      projectsStore.removeProject(project.id);
      goto('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      errors.submit = error instanceof Error ? error.message : 'Failed to delete project';
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto('/projects');
  }

  function getStatusColor(statusValue: string): string {
    switch (statusValue) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'COMPLETED':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'ARCHIVED':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  }
</script>

<svelte:head>
  <title>{project?.title || 'Loading Project'} - PKMS</title>
</svelte:head>

<div class="flex h-[calc(100vh-64px)] overflow-hidden">
  <div class="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          on:click={handleCancel}
          class="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-3xl font-bold text-gray-200">
            {project ? 'Edit Project' : 'Loading Project...'}
          </h1>
          <p class="text-gray-400 mt-1">
            {project ? 'Update your writing project' : 'Fetching project details...'}
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        {#if project}
          <button
            type="button"
            on:click={handleDelete}
            disabled={isSubmitting}
            class="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
          >
            Delete Project
          </button>
        {/if}
        <button
          type="button"
          on:click={handleCancel}
          class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={handleSubmit}
          disabled={isSubmitting || !project}
          class="btn-primary flex items-center space-x-2"
        >
          <Save class="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>

    <div class="card p-6 space-y-6">
      {#if !project}
        <div class="text-center py-12 text-gray-400">
          <p>Loading project details...</p>
        </div>
      {:else}
        <div>
          <label for="title" class="block text-sm font-medium text-gray-300 mb-2">
            Project Title *
          </label>
          <input
            id="title"
            type="text"
            bind:value={title}
            placeholder="Enter project title"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
            class:border-red-500={errors.title}
          />
          {#if errors.title}
            <p class="mt-1 text-sm text-red-400">{errors.title}</p>
          {/if}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Project Content *
          </label>
          <p class="text-sm text-gray-400 mb-4">
            Edit the content of your project.
          </p>
          <div class="min-h-[400px]" class:border-red-500={errors.content}>
            <TinyMCEEditor
              bind:content
              placeholder="Start writing your project here..."
              height="400"
            />
          </div>
          {#if errors.content}
            <p class="mt-1 text-sm text-red-400">{errors.content}</p>
          {/if}
        </div>

        {#if errors.submit}
          <div class="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p class="text-red-400">{errors.submit}</p>
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="status" class="block text-sm font-medium text-gray-300 mb-2">
              Project Status
            </label>
            <div class="relative">
              <select
                id="status"
                bind:value={status}
                class="block appearance-none w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent pr-8"
              >
                {#each statusOptions as option}
                  <option value={option.value} class="bg-gray-800 text-gray-200">
                    {option.label}
                  </option>
                {/each}
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
            <p class="mt-1 text-sm text-gray-500">
              {@html statusOptions.find(opt => opt.value === status)?.description || ''}
            </p>
          </div>

          <div>
            <label for="folder" class="block text-sm font-medium text-gray-300 mb-2">
              Project Folder
            </label>
            <div class="relative">
              <select
                id="folder"
                bind:value={selectedFolder}
                class="block appearance-none w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent pr-8"
              >
                <option value={null}>No folder</option>
                {#each allProjectFolders as folder (folder.id)}
                  <option value={folder} class="bg-gray-800 text-gray-200">
                    {folder.name}
                  </option>
                {/each}
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label for="tags" class="block text-sm font-medium text-gray-300 mb-2">
            Tags
          </label>
          {#if allAvailableTags.length > 0}
            <TagSelector 
              bind:selectedTags={selectedTags} 
              availableTags={allAvailableTags} 
            />
          {:else}
            <div class="text-sm text-gray-400">Loading tags...</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <div class="w-80 border-l border-gray-700 pl-6 pr-6 py-6 flex-shrink-0 overflow-y-auto">
    <div class="sticky top-0 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-200">Related Notes</h2>
        <span class="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
          {relatedNotes.length}
        </span>
      </div>

      <div class="space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto">
        {#if project} 
          {#each relatedNotes as note (note.id)}
            <div class="transform scale-90 origin-top-left">
              <NoteCard {note} compact={true} />
            </div>
          {:else}
            <div class="text-center py-8">
              <FileText class="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p class="text-sm text-gray-400 mb-2">No notes yet</p>
              <p class="text-xs text-gray-500">
                Notes linked to this project will appear here.
              </p>
            </div>
          {/each}
        {:else}
          <div class="text-center py-8 text-gray-500">
            <p>Loading notes...</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>