<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Save, ArrowLeft, Folder, Tag as TagIcon, FileText, Settings, ChevronUp, ChevronDown, Eye, EyeOff, X, Trash2 } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import TagSelector from '$lib/components/TagSelector.svelte';
  import ProjectNoteCard from '$lib/components/ProjectNoteCard.svelte';
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
  let showMetadata = false;

  let allProjectFolders: ProjectFolder[] = [];
  let allAvailableTags: Tag[] = [];
  let allNotes: Note[] = [];

  // Note management state
  let hiddenNoteIds: Set<string> = new Set();
  let showHiddenNotes = false;
  let noteActionsLoading: Set<string> = new Set();

  $: relatedNotes = project?.notes || [];
  $: visibleNotes = relatedNotes.filter(note => !hiddenNoteIds.has(note.id));
  $: hiddenNotes = relatedNotes.filter(note => hiddenNoteIds.has(note.id));

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active', description: 'Currently working on' },
    { value: 'COMPLETED', label: 'Completed', description: 'Finished project' },
    { value: 'ARCHIVED', label: 'Archived', description: 'No longer active' }
  ];

  // Subscribe to stores
  projectFolders.subscribe(value => {
    allProjectFolders = value;
  });

  $: {
    allAvailableTags = $tags;
  }

  onMount(async () => {
    projectId = $page.params.id;
    try {
        await Promise.all([
            projectFoldersStore.load(),
            tagsStore.load(),
            projectsStore.load()
        ]);

        const foundProject = $projects.find(p => p.id === projectId);
        if (!foundProject) {
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
        selectedFolder = allProjectFolders.find(f => f.id === project.folder_id) || null;
        
        if (project.tags && project.tags.length > 0) {
            selectedTags = project.tags
                .map(tagName => {
                    const foundTag = $tags.find(tag => tag.name === tagName);
                    if (foundTag) {
                        return foundTag;
                    } else {
                        console.warn("⚠️ Edit Project - Tag not found for name:", tagName);
                        return null;
                    }
                })
                .filter(tag => tag !== null);
        } else {
            selectedTags = [];
        }

        // Initialize hidden notes from backend
        hiddenNoteIds = new Set(project.hidden_note_ids?.map(id => id.toString()) || []);
        
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
        tags: selectedTags.map(t => t.id.toString())
      };

      const updatedProject = await ProjectsAPI.updateProject(project.id, updateData);

      project = {
        ...updatedProject,
        created_at: new Date(updatedProject.created_at),
        updated_at: new Date(updatedProject.updated_at),
        tags: updatedProject.tags || [],
        notes: updatedProject.notes || []
      };

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
      goto('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      errors.submit = error instanceof Error ? error.message : 'Failed to delete project';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleHideNote(noteId: string) {
    if (!project) return;
    
    noteActionsLoading = new Set([...noteActionsLoading, noteId]);
    
    try {
      await ProjectsAPI.hideNoteInProject(project.id, noteId);
      hiddenNoteIds = new Set([...hiddenNoteIds, noteId]);
    } catch (error) {
      console.error('Error hiding note:', error);
      errors.submit = error instanceof Error ? error.message : 'Failed to hide note';
    } finally {
      noteActionsLoading = new Set([...noteActionsLoading].filter(id => id !== noteId));
    }
  }

  async function handleUnhideNote(noteId: string) {
    if (!project) return;
    
    noteActionsLoading = new Set([...noteActionsLoading, noteId]);
    
    try {
      await ProjectsAPI.unhideNoteInProject(project.id, noteId);
      hiddenNoteIds = new Set([...hiddenNoteIds].filter(id => id !== noteId));
    } catch (error) {
      console.error('Error unhiding note:', error);
      errors.submit = error instanceof Error ? error.message : 'Failed to unhide note';
    } finally {
      noteActionsLoading = new Set([...noteActionsLoading].filter(id => id !== noteId));
    }
  }

  async function handleRemoveNote(noteId: string) {
    if (!project) return;

    if (!confirm('Are you sure you want to remove this note from the project?')) {
      return;
    }
    
    noteActionsLoading = new Set([...noteActionsLoading, noteId]);
    
    try {
      
      const updatedProject = await ProjectsAPI.removeNoteFromProject(project.id, noteId);
      project = {
        ...updatedProject,
        created_at: new Date(updatedProject.created_at),
        updated_at: new Date(updatedProject.updated_at),
        tags: updatedProject.tags || [],
        notes: updatedProject.notes || []
      };
      // Remove from hidden notes if it was hidden
      hiddenNoteIds = new Set([...hiddenNoteIds].filter(id => id !== noteId));
    } catch (error) {
      console.error('Error removing note:', error);
      errors.submit = error instanceof Error ? error.message : 'Failed to remove note from project';
    } finally {
      noteActionsLoading = new Set([...noteActionsLoading].filter(id => id !== noteId));
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

<div class="flex h-[calc(100vh-64px)] overflow-hidden flex-col">
  <!-- Fixed Header Bar -->
  <div class="flex-shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <button
          on:click={handleCancel}
          class="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        
        <!-- Compact title input -->
        <div class="flex-1 max-w-md">
          <input
            type="text"
            bind:value={title}
            placeholder="Project title..."
            class="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-600 focus:border-transparent text-sm"
            class:border-red-500={errors.title}
          />
        </div>

        <!-- Status indicator -->
        {#if project}
          <div class="flex items-center space-x-2">
            <span class="px-2 py-1 rounded text-xs border {getStatusColor(status)}">
              {statusOptions.find(opt => opt.value === status)?.label || status}
            </span>
            {#if selectedFolder}
              <span class="text-xs text-gray-400 flex items-center">
                <Folder class="w-3 h-3 mr-1" />
                {selectedFolder.name}
              </span>
            {/if}
            {#if selectedTags.length > 0}
              <span class="text-xs text-gray-400 flex items-center">
                <TagIcon class="w-3 h-3 mr-1" />
                {selectedTags.length}
              </span>
            {/if}
          </div>
        {/if}
      </div>

      <div class="flex items-center space-x-2">
        <!-- Settings toggle -->
        <button
          type="button"
          on:click={() => showMetadata = !showMetadata}
          class="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Toggle settings"
        >
          <Settings class="w-4 h-4" />
        </button>
        
        {#if project}
          <button
            type="button"
            on:click={handleDelete}
            disabled={isSubmitting}
            class="px-3 py-1.5 text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            Delete
          </button>
        {/if}
        <button
          type="button"
          on:click={handleCancel}
          class="px-3 py-1.5 text-gray-400 hover:text-gray-200 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={handleSubmit}
          disabled={isSubmitting || !project}
          class="btn-primary flex items-center space-x-1.5 px-3 py-1.5 text-sm"
        >
          <Save class="w-3 h-3" />
          <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
        </button>
      </div>
    </div>

    <!-- Error display -->
    {#if errors.title}
      <p class="mt-1 text-xs text-red-400">{errors.title}</p>
    {/if}
    {#if errors.submit}
      <div class="mt-2 bg-red-900/20 border border-red-700 rounded px-3 py-2">
        <p class="text-red-400 text-xs">{errors.submit}</p>
      </div>
    {/if}
  </div>

  <!-- Main content area -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Editor section -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Collapsible metadata panel -->
      {#if showMetadata}
        <div class="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="status" class="block text-xs font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                bind:value={status}
                class="block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-yellow-600 text-xs"
              >
                {#each statusOptions as option}
                  <option value={option.value} class="bg-gray-700 text-gray-200">
                    {option.label}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label for="folder" class="block text-xs font-medium text-gray-300 mb-1">
                Folder
              </label>
              <select
                id="folder"
                bind:value={selectedFolder}
                class="block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-yellow-600 text-xs"
              >
                <option value={null}>No folder</option>
                {#each allProjectFolders as folder (folder.id)}
                  <option value={folder} class="bg-gray-700 text-gray-200">
                    {folder.name}
                  </option>
                {/each}
              </select>
            </div>

            <div>
              <label for="tags" class="block text-xs font-medium text-gray-300 mb-1">
                Tags
              </label>
              {#if allAvailableTags.length > 0}
                <TagSelector 
                  bind:selectedTags={selectedTags} 
                  availableTags={allAvailableTags} 
                />
              {:else}
                <div class="text-xs text-gray-400">Loading tags...</div>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Editor -->
      <div class="flex-1 overflow-hidden p-4">
        {#if !project}
          <div class="text-center py-12 text-gray-400">
            <p>Loading project details...</p>
          </div>
        {:else}
          <div class="h-full" class:border-red-500={errors.content}>
            <TinyMCEEditor
              bind:content
              placeholder="Start writing your project here..."
              height="100%"
            />
          </div>
          {#if errors.content}
            <p class="mt-1 text-xs text-red-400">{errors.content}</p>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Sidebar -->
    <div class="w-80 border-l border-gray-700 flex-shrink-0 overflow-hidden flex flex-col bg-gray-900">
      <div class="flex-shrink-0 p-4 border-b border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-200">Related Notes</h2>
          <div class="flex items-center space-x-2">
            <span class="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {visibleNotes.length}/{relatedNotes.length}
            </span>
            {#if hiddenNotes.length > 0}
              <button
                type="button"
                on:click={() => showHiddenNotes = !showHiddenNotes}
                class="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                title={showHiddenNotes ? 'Hide hidden notes' : 'Show hidden notes'}
              >
                {#if showHiddenNotes}
                  <EyeOff class="w-3 h-3" />
                {:else}
                  <Eye class="w-3 h-3" />
                {/if}
              </button>
            {/if}
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-3">
          {#if project}
            <!-- Visible Notes -->
            {#each visibleNotes as note (note.id)}
              <ProjectNoteCard 
                {note} 
                compact={true}
                isLoading={noteActionsLoading.has(note.id)}
                on:hide={(e) => handleHideNote(e.detail.noteId)}
                on:remove={(e) => handleRemoveNote(e.detail.noteId)}
              />
            {/each}

            <!-- Hidden Notes Section -->
            {#if showHiddenNotes && hiddenNotes.length > 0}
              <div class="border-t border-gray-700 pt-3 mt-3">
                <h3 class="text-xs font-medium text-gray-400 mb-2 flex items-center">
                  <EyeOff class="w-3 h-3 mr-1" />
                  Hidden Notes ({hiddenNotes.length})
                </h3>
                {#each hiddenNotes as note (note.id)}
                  <div class="mb-3">
                    <ProjectNoteCard 
                      {note} 
                      compact={true}
                      isHidden={true}
                      isLoading={noteActionsLoading.has(note.id)}
                      on:unhide={(e) => handleUnhideNote(e.detail.noteId)}
                      on:remove={(e) => handleRemoveNote(e.detail.noteId)}
                    />
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Empty State -->
            {#if relatedNotes.length === 0}
              <div class="text-center py-8">
                <FileText class="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p class="text-xs text-gray-400 mb-1">No notes yet</p>
                <p class="text-xs text-gray-500">
                  Notes linked to this project will appear here.
                </p>
              </div>
            {:else if visibleNotes.length === 0}
              <div class="text-center py-8">
                <EyeOff class="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p class="text-xs text-gray-400 mb-1">All notes are hidden</p>
                <p class="text-xs text-gray-500">
                  Click the eye icon above to show hidden notes.
                </p>
              </div>
            {/if}
          {:else}
            <div class="text-center py-8 text-gray-500">
              <p class="text-xs">Loading notes...</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>