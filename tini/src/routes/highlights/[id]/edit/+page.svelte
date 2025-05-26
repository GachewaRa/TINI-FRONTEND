<!-- src/routes/highlights/[id]/edit/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Save, ArrowLeft, Trash2 } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import { highlights } from '$lib/stores';
  import type { Highlight } from '$lib/types';
  
  let highlight: Highlight | undefined;
  let book_title = '';
  let author = '';
  let content = '';
  let isSubmitting = false;
  let isDeleting = false;
  let errors: { [key: string]: string } = {};
  let showDeleteConfirm = false;
  
  // Get highlight ID from URL
  $: highlightId = $page.params.id;
  
  // Find and load the highlight
  $: if (highlightId) {
    highlight = $highlights.find(h => h.id === highlightId);
    if (highlight) {
      book_title = highlight.book_title;
      author = highlight.author || '';
      content = highlight.content;
    }
  }
  
  function validateForm(): boolean {
    errors = {};
    
    if (!book_title.trim()) {
      errors.book_title = 'Book title is required';
    }
    
    if (!content.trim()) {
      errors.content = 'Content is required';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm() || !highlight) return;
    
    isSubmitting = true;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedHighlight: Highlight = {
        ...highlight,
        book_title: book_title.trim(),
        author: author.trim() || undefined,
        content: content.trim(),
        updated_at: new Date()
      };
      
      // Update in store
      highlights.update(current => 
        current.map(h => h.id === highlight!.id ? updatedHighlight : h)
      );
      
      // Redirect back to highlight detail
      goto(`/highlights/${highlight.id}`);
    } catch (error) {
      console.error('Error updating highlight:', error);
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleDelete() {
    if (!highlight) return;
    
    isDeleting = true;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove from store
      highlights.update(current => current.filter(h => h.id !== highlight!.id));
      
      // Redirect to highlights list
      goto('/highlights');
    } catch (error) {
      console.error('Error deleting highlight:', error);
    } finally {
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }
  
  function handleCancel() {
    goto(`/highlights/${highlightId}`);
  }
</script>

<svelte:head>
  <title>Edit {highlight?.book_title || 'Highlight'} - PKMS</title>
</svelte:head>

{#if highlight}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
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
          <h1 class="text-3xl font-bold text-gray-200">Edit Highlight</h1>
          <p class="text-gray-400 mt-1">Modify highlight details and content</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-3">
        <button
          type="button"
          on:click={() => showDeleteConfirm = true}
          class="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors rounded-lg flex items-center space-x-2"
        >
          <Trash2 class="w-4 h-4" />
          <span>Delete</span>
        </button>
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
          <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
    
    <!-- Form -->
    <div class="card p-6 space-y-6">
      <!-- Book Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="book_title" class="block text-sm font-medium text-gray-300 mb-2">
            Book Title *
          </label>
          <input
            id="book_title"
            type="text"
            bind:value={book_title}
            placeholder="Enter book title"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
            class:border-red-500={errors.book_title}
          />
          {#if errors.book_title}
            <p class="mt-1 text-sm text-red-400">{errors.book_title}</p>
          {/if}
        </div>
        
        <div>
          <label for="author" class="block text-sm font-medium text-gray-300 mb-2">
            Author
          </label>
          <input
            id="author"
            type="text"
            bind:value={author}
            placeholder="Enter author name"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
          />
        </div>
      </div>
      
      <!-- Content Editor -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Highlights Content *
        </label>
        <div class="min-h-[400px]" class:border-red-500={errors.content}>
          <TinyMCEEditor
            bind:content
            placeholder="Edit your book highlights here..."
            height="400"
          />
        </div>
        {#if errors.content}
          <p class="mt-1 text-sm text-red-400">{errors.content}</p>
        {/if}
      </div>
      
      <!-- Metadata -->
      <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div class="flex items-center justify-between text-sm text-gray-400">
          <div class="flex items-center space-x-4">
            <span>Created: {highlight.created_at.toLocaleDateString()}</span>
            <span>•</span>
            <span>Last modified: {highlight.updated_at.toLocaleDateString()}</span>
          </div>
          <div>
            <span>{highlight.notes_from_highlight.length} notes created</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <h3 class="text-lg font-semibold text-gray-200 mb-4">Delete Highlight</h3>
        <p class="text-gray-300 mb-6">
          Are you sure you want to delete this highlight? This action cannot be undone.
          {#if highlight.notes_from_highlight.length > 0}
            <br><br>
            <span class="text-yellow-400 font-medium">
              Note: This highlight has {highlight.notes_from_highlight.length} associated notes that will remain unaffected.
            </span>
          {/if}
        </p>
        
        <div class="flex items-center space-x-3 justify-end">
          <button
            type="button"
            on:click={() => showDeleteConfirm = false}
            class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            on:click={handleDelete}
            disabled={isDeleting}
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Trash2 class="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="flex items-center justify-center h-64">
    <div class="text-center">
      <h2 class="text-xl font-semibold text-gray-400 mb-2">Highlight not found</h2>
      <p class="text-gray-500 mb-4">The highlight you're trying to edit doesn't exist.</p>
      <a href="/highlights" class="btn-primary">
        Back to Highlights
      </a>
    </div>
  </div>
{/if}