<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Save, ArrowLeft, Folder, Tag as TagIcon } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import TagSelector from '$lib/components/TagSelector.svelte';
  import { projectFolders } from '$lib/stores'; // Keep this if it's working
  import { tags, tagsStore } from '$lib/stores/tags'; // Import both the derived store and main store
  import { projectFoldersStore } from '$lib/stores/projectFolders';
  import { projectsStore } from '$lib/stores/projects';
  import { ProjectsAPI } from '$lib/api/projects';
  import type { Project, ProjectFolder } from '$lib/types/projects';
  import type { Tag } from '$lib/types/tags';

  let title = '';
  let content = '';
  let status = 'ACTIVE';
  let selectedFolder: ProjectFolder | null = null;
  let selectedTags: Tag[] = [];
  let isSubmitting = false;
  let errors: { [key: string]: string } = {};

  let allProjectFolders: ProjectFolder[] = [];
  let allAvailableTags: Tag[] = [];

  // Load data for folders and tags on mount
  onMount(async () => {
    await Promise.all([
      projectFoldersStore.load(),
      tagsStore.load()
    ]);
  });

  projectFolders.subscribe(value => {
    allProjectFolders = value;
    if (!selectedFolder && allProjectFolders.length > 0) {
      selectedFolder = allProjectFolders[0];
    }
  });

  $: {
    allAvailableTags = $tags;
  }

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', description: 'Currently working on' },
    { value: 'COMPLETED', label: 'Completed', description: 'Finished project' },
    { value: 'ARCHIVED', label: 'Archived', description: 'No longer active' }
  ];

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
    if (!validateForm()) return;

    isSubmitting = true;

    try {
      const projectData: ProjectCreate = {
        title: title.trim(),
        content: content.trim(),
        status: status as Project['status'],
        folder_id: selectedFolder?.id ? selectedFolder.id.toString() : null,
        tags: selectedTags.map(tag => tag.id.toString())
      };

      console.log("PROJECT DATA TO CREATE: ", projectData)

      const createdProjectResponse = await ProjectsAPI.createProject(projectData);

      const newProject: Project = {
        ...createdProjectResponse,
        created_at: new Date(createdProjectResponse.created_at),
        updated_at: new Date(createdProjectResponse.updated_at),
        tags: createdProjectResponse.tags || [],
        notes: createdProjectResponse.notes || []
      };

      projectsStore.addProject(newProject);
      goto(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      errors.submit = error instanceof Error ? error.message : 'Failed to create project.';
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
      case 'DRAFT':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'COMPLETED':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'ARCHIVED':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  }
</script>

{#if errors.submit}
  <p class="mt-4 text-sm text-red-400 text-center">{errors.submit}</p>
{/if}

<svelte:head>
  <title>New Project - PKMS</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
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
        <h1 class="text-3xl font-bold text-gray-200">New Project</h1>
        <p class="text-gray-400 mt-1">Create a new writing project</p>
      </div>
    </div>

    <div class="flex items-center space-x-3">
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
        disabled={isSubmitting}
        class="btn-primary flex items-center space-x-2"
      >
        <Save class="w-4 h-4" />
        <span>{isSubmitting ? 'Saving...' : 'Save Project'}</span>
      </button>
    </div>
  </div>

  <div class="card p-6 space-y-6">
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
        Start writing or paste content for your project.
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

  </div>
</div>