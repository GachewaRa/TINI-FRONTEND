<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { X, Save } from 'lucide-svelte';
  import TagSelector from './TagSelector.svelte';
  import type { Note, Tag, NoteCreate } from '$lib/types';
  import { NotesAPI } from '$lib/api/notes';
  import { tags, tagsStore } from '$lib/stores/tags';
  import { projectsStore } from '$lib/stores/projects';
  
  export let selectedText: string = '';
  export let source: string = '';
  export let highlightId: string = '';
  
  let title = '';
  let selectedTags: Tag[] = [];
  let allAvailableTags: Tag[] = [];
  let selectedProjectId = '';
  let isLoading = false;
  let modalElement: HTMLElement;
  let titleInput: HTMLInputElement;
  
  const dispatch = createEventDispatcher<{
    noteCreated: Note;
    close: void;
  }>();
  
  // Load tags and projects when component mounts
  onMount(async () => {
    try {
      await tagsStore.load();
      await projectsStore.load();
    } catch (err) {
      console.error('Failed to load tags/projects:', err);
    }
    
    // Focus the title input
    setTimeout(() => titleInput?.focus(), 100);
    
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeModal();
    }
    
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
  
  // Update available tags when store changes
  $: {
    allAvailableTags = $tags;
  }
  
  function closeModal() {
    title = '';
    selectedTags = [];
    selectedProjectId = '';
    dispatch('close');
  }
  
  async function createNote() {
    if (!title.trim()) {
      alert('Please enter a title for the note');
      titleInput?.focus();
      return;
    }
    
    isLoading = true;
    
    try {
      const noteData: NoteCreate = {
        title: title.trim(),
        content: selectedText,
        source: source,
        highlights_id: highlightId,
        tags: selectedTags.map(tag => tag.name.toString()),
        project_id: selectedProjectId || undefined // Only include if a project is selected
      };

      console.log("NOTE DATA TO BACKEND: ", noteData)

      const createdNote = await NotesAPI.createNote(noteData);
      
      // Reset form
      title = '';
      selectedTags = [];
      selectedProjectId = '';
      
      dispatch('noteCreated', createdNote);
      closeModal();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Error creating note. Please try again.');
    } finally {
      isLoading = false;
    }
  }
</script>

<!-- Modal Backdrop -->
<div 
  class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50"
  on:click|self={closeModal}
  bind:this={modalElement}
>
  <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-200">Create Note from Selection</h3>
      <button on:click={closeModal} class="text-gray-400 hover:text-white">
        <X class="w-5 h-5" />
      </button>
    </div>
    
    <!-- Source Information -->
    {#if source}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">Source</label>
        <div class="bg-gray-700 p-3 rounded text-sm text-gray-300">
          {source}
        </div>
      </div>
    {/if}
    
    <!-- Selected Text Preview -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">Selected Text</label>
      <div class="bg-gray-700 p-3 rounded text-sm text-gray-300 max-h-24 overflow-y-auto">
        {selectedText}
      </div>
    </div>
    
    <!-- Title Input -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">
        Note Title <span class="text-red-400">*</span>
      </label>
      <input
        bind:this={titleInput}
        bind:value={title}
        placeholder="Enter note title..."
        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-600"
        on:keydown={(e) => e.key === 'Enter' && createNote()}
        disabled={isLoading}
      />
    </div>
    
    <!-- Project Selection -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">Add to Project (Optional)</label>
      {#if $projectsStore.isLoading}
        <div class="text-sm text-gray-400">Loading projects...</div>
      {:else}
        <select
          bind:value={selectedProjectId}
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-600"
          disabled={isLoading}
        >
          <option value="">No project selected</option>
          {#each $projectsStore.projects.filter(p => p.status === 'ACTIVE') as project}
            <option value={project.id}>{project.title}</option>
          {/each}
        </select>
      {/if}
      </div>
    
    
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-300 mb-2">Tags</label>
      {#if allAvailableTags.length > 0}
        <TagSelector 
          bind:selectedTags={selectedTags} 
          availableTags={allAvailableTags} 
        />
      {:else}
        <div class="text-sm text-gray-400">Loading tags...</div>
      {/if}
    </div>
    
    <!-- Actions -->
    <div class="flex justify-end space-x-3">
      <button on:click={closeModal} class="px-4 py-2 text-gray-400 hover:text-white">
        Cancel
      </button>
      <button
        on:click={createNote}
        class="btn-primary flex items-center space-x-2"
        disabled={isLoading || !title.trim()}
      >
        <Save class="w-4 h-4" />
        <span>{isLoading ? 'Creating...' : 'Create Note'}</span>
      </button>
    </div>
  </div>
</div>