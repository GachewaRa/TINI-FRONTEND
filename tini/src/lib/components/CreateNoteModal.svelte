<!-- src/lib/components/CreateNoteModal.svelte -->
<script lang="ts">
  import { X, Save } from 'lucide-svelte';
  import { selectedText, isCreatingNote, notes } from '$lib/stores';
  import TagSelector from './TagSelector.svelte';
  import type { Note, Tag } from '$lib/types';
  
  export let highlightTitle = '';
  export let onNoteCreated: (text: string) => void = () => {};
  
  let title = '';
  let selectedTags: Tag[] = [];
  let isLoading = false;
  
  function closeModal() {
    isCreatingNote.set(false);
    selectedText.set('');
    title = '';
    selectedTags = [];
  }
  
  async function createNote() {
    if (!title.trim()) {
      alert('Please enter a title for the note');
      return;
    }
    
    isLoading = true;
    
    try {
      const newNote: Note = {
        id: Date.now().toString(),
        title: title.trim(),
        content: $selectedText,
        source: highlightTitle,
        created_at: new Date(),
        updated_at: new Date(),
        tags: selectedTags,
        comments: []
      };
      
      notes.update(n => [...n, newNote]);
      
      // Notify parent component to highlight the text
      onNoteCreated($selectedText);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      closeModal();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Error creating note. Please try again.');
    } finally {
      isLoading = false;
    }
  }
</script>

{#if $isCreatingNote}
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
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
      
      <!-- Selected Text Preview -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">Selected Text</label>
        <div class="bg-gray-700 p-3 rounded text-sm text-gray-300 max-h-24 overflow-y-auto">
          {$selectedText}
        </div>
      </div>
      
      <!-- Title Input -->
      <div class="mb-4">
        <label for="note-title" class="block text-sm font-medium text-gray-300 mb-2">
          Note Title <span class="text-red-400">*</span>
        </label>
        <input
          id="note-title"
          type="text"
          bind:value={title}
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
{/if}

