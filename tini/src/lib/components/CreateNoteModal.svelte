<!-- src/lib/components/CreateNoteModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { X, Save } from 'lucide-svelte';
  import TagSelector from './TagSelector.svelte';
  import type { Note, Tag } from '$lib/types';
    import { NotesAPI } from '$lib/api/notes';
  
  // Props
  export let selectedText: string = '';
  export let source: string = '';
  export let highlightId: string = '';
  
  // Local state
  let title = '';
  let selectedTags: Tag[] = [];
  let isLoading = false;
  let modalElement: HTMLElement;
  let titleInput: HTMLInputElement;
  
  const dispatch = createEventDispatcher<{
    noteCreated: Note;
    close: void;
  }>();
  
  console.log('CreateNoteModal initialized with:', {
    selectedText,
    source,
    highlightId
  });
  
  onMount(() => {
    console.log('Modal mounted, setting up focus and event handling');
    
    // Focus the title input after a brief delay to ensure modal is rendered
    setTimeout(() => {
      if (titleInput) {
        titleInput.focus();
        console.log('Title input focused');
      }
    }, 100);
    
    // Handle escape key to close modal
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        console.log('Escape key pressed, closing modal');
        closeModal();
      }
    }
    
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
      console.log('Modal unmounting, cleaning up event listeners');
      document.removeEventListener('keydown', handleKeydown);
    };
  });
  
  function closeModal() {
    console.log('Closing modal');
    title = '';
    selectedTags = [];
    dispatch('close');
  }
  
  function handleBackdropClick(event: MouseEvent) {
    // Only close if clicking the backdrop itself, not its children
    if (event.target === event.currentTarget) {
      console.log('Backdrop clicked, closing modal');
      closeModal();
    }
  }
  
  function handleModalClick(event: MouseEvent) {
    // Prevent event bubbling to backdrop
    event.stopPropagation();
    console.log('Modal content clicked, preventing backdrop close');
  }
  
  async function createNote() {
    console.log('Create note function called');
    console.log('Current form state:', {
      title: title.trim(),
      selectedText,
      source,
      highlightId,
      selectedTags
    });
    
    if (!title.trim()) {
      console.warn('No title provided');
      alert('Please enter a title for the note');
      
      // Refocus the title input
      if (titleInput) {
        titleInput.focus();
      }
      return;
    }
    
    isLoading = true;
    console.log('Starting note creation...');
    
    try {
      const newNote: Note = {
        // id: Date.now().toString(),
        title: title.trim(),
        content: selectedText,
        source: source,
        highlights_id: highlightId,
        created_at: new Date(),
        updated_at: new Date(),
        tags: selectedTags,
        comments: []
      };
      
      console.log('Created new note object:', newNote);
      
      await NotesAPI.createNote(newNote);
      
      console.log('Dispatching noteCreated event');
      dispatch('noteCreated', newNote);
      
      // Reset form
      title = '';
      selectedTags = [];
      
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Error creating note. Please try again.');
    } finally {
      isLoading = false;
      console.log('Note creation process completed');
    }
  }
  
  function handleTitleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    title = target.value;
    console.log('Title input changed:', title);
  }
  
  function handleTitleKeydown(event: KeyboardEvent) {
    console.log('Title input keydown:', event.key);
    
    // Handle Enter key to submit form
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (title.trim()) {
        createNote();
      }
    }
  }
  
  // Log when props change
  $: {
    console.log('Props updated:', { selectedText, source, highlightId });
  }
</script>

<!-- Modal Backdrop -->
<div 
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  on:click={handleBackdropClick}
  bind:this={modalElement}
>
  <div 
    class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
    on:click={handleModalClick}
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-200">Create Note from Selection</h3>
      <button
        on:click={closeModal}
        class="text-gray-400 hover:text-white transition-colors"
        disabled={isLoading}
      >
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
      <label for="note-title" class="block text-sm font-medium text-gray-300 mb-2">
        Note Title <span class="text-red-400">*</span>
      </label>
      <input
        bind:this={titleInput}
        id="note-title"
        type="text"
        value={title}
        on:input={handleTitleInput}
        on:keydown={handleTitleKeydown}
        placeholder="Enter note title..."
        class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
        disabled={isLoading}
      />
    </div>
    
    <!-- Tags -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-300 mb-2">Tags</label>
      <TagSelector bind:selectedTags />
    </div>
    
    <!-- Actions -->
    <div class="flex justify-end space-x-3">
      <button
        on:click={closeModal}
        class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        disabled={isLoading}
      >
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