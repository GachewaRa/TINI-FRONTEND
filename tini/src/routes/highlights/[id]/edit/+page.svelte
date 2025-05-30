<!-- src/routes/highlights/[id]/edit/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Save, ArrowLeft, Trash2, AlertCircle, Loader2 } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import { highlights } from '$lib/stores';
  import { fetchHighlight, updateHighlight, deleteHighlight } from '$lib/api/highlights';
  import type { Highlight } from '$lib/types';
  
  let highlight: Highlight | undefined;
  let book_title = '';
  let author = '';
  let content = '';
  let isLoading = true;
  let isSubmitting = false;
  let isDeleting = false;
  let errors: { [key: string]: string } = {};
  let submitError = '';
  let loadError = '';
  let showDeleteConfirm = false;
  
  // Get highlight ID from URL
  $: highlightId = $page.params.id;
  
  onMount(async () => {
    if (highlightId) {
      await loadHighlight();
    }
  });
  
  async function loadHighlight() {
    try {
      isLoading = true;
      loadError = '';
      
      highlight = await fetchHighlight(highlightId);
      
      // Populate form fields
      book_title = highlight.book_title;
      author = highlight.author || '';
      content = highlight.content;
      
      // Update store if needed
      highlights.update(current => {
        const existing = current.find(h => h.id === highlight!.id);
        if (!existing) {
          return [...current, highlight!];
        }
        return current.map(h => h.id === highlight!.id ? highlight! : h);
      });
      
    } catch (error) {
      console.error('Error loading highlight:', error);
      loadError = error instanceof Error ? error.message : 'Failed to load highlight';
    } finally {
      isLoading = false;
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
    submitError = '';
    
    try {
      const updateData = {
        book_title: book_title.trim(),
        content: content.trim(),
        ...(author.trim() && { author: author.trim() })
      };
      
      const updatedHighlight = await updateHighlight(highlight.id, updateData);
      
      // Update in store
      highlights.update(current => 
        current.map(h => h.id === highlight!.id ? updatedHighlight : h)
      );
      
      // Update local reference
      highlight = updatedHighlight;
      
      // Redirect back to highlight detail
      goto(`/highlights/${highlight.id}`);
    } catch (error) {
      console.error('Error updating highlight:', error);
      submitError = error instanceof Error ? error.message : 'Failed to update highlight';
    } finally {
      isSubmitting = false;
    }
  }
  
  async function handleDelete() {
    if (!highlight) return;
    
    isDeleting = true;
    
    try {
      await deleteHighlight(highlight.id);
      
      // Remove from store
      highlights.update(current => current.filter(h => h.id !== highlight!.id));
      
      // Redirect to highlights list
      goto('/highlights');
    } catch (error) {
      console.error('Error deleting highlight:', error);
      submitError = error instanceof Error ? error.message : 'Failed to delete highlight';
      isDeleting = false;
      showDeleteConfirm = false;
    }
  }
  
  function handleCancel() {
    goto(`/highlights/${highlightId}`);
  }
  
  function clearSubmitError() {
    submitError = '';
  }
  
  async function handleRetryLoad() {
    await loadHighlight();
  }
</script>

<svelte:head>
  <title>{highlight ? `Edit ${highlight.book_title}` : 'Edit Highlight'} - PKMS</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Loading State -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3 text-gray-400">
        <Loader2 class="w-6 h-6 animate-spin" />
        <span>Loading highlight...</span>
      </div>
    </div>
  
  <!-- Load Error State -->
  {:else if loadError}
    <div class="card p-6 text-center">
      <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-200 mb-2">Failed to load highlight</h3>
      <p class="text-gray-400 mb-4">{loadError}</p>
      <div class="flex items-center justify-center space-x-3">
        <button
          on:click={handleRetryLoad}
          class="btn-primary"
        >
          Try Again
        </button>
        <button
          on:click={() => goto('/highlights')}
          class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          Back to Highlights
        </button>
      </div>
    </div>
  
  <!-- Main Content -->
  {:else if highlight}
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          on:click={handleCancel}
          class="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Go back"
          disabled={isSubmitting || isDeleting}
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-3xl font-bold text-gray-200">Edit Highlight</h1>
          <p class="text-gray-400 mt-1">Update highlight information and content</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-3">
        <button
          type="button"
          on:click={() => showDeleteConfirm = true}
          disabled={isSubmitting || isDeleting}
          class="px-4 py-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Trash2 class="w-4 h-4" />
          <span>Delete</span>
        </button>
        <button
          type="button"
          on:click={handleCancel}
          disabled={isSubmitting || isDeleting}
          class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          on:click={handleSubmit}
          disabled={isSubmitting || isDeleting}
          class="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save class="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
    
    <!-- Submit Error -->
    {#if submitError}
      <div class="card p-4 bg-red-900/20 border-red-500/30">
        <div class="flex items-start space-x-3">
          <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <h4 class="text-sm font-medium text-red-400 mb-1">Error</h4>
            <p class="text-sm text-red-300">{submitError}</p>
          </div>
          <button
            on:click={clearSubmitError}
            class="text-red-400 hover:text-red-300 text-sm"
          >
            ×
          </button>
        </div>
      </div>
    {/if}
    
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
            disabled={isSubmitting || isDeleting}
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            class:border-red-500={errors.book_title}
            on:input={clearSubmitError}
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
            disabled={isSubmitting || isDeleting}
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            on:input={clearSubmitError}
          />
        </div>
      </div>
      
      <!-- Content Editor -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Highlights Content *
        </label>
        <p class="text-sm text-gray-400 mb-4">
          Update your highlights or excerpts from the book.
        </p>
        <div class="min-h-[400px]" class:border-red-500={errors.content}>
          <TinyMCEEditor
            bind:content
            placeholder="Enter your book highlights here..."
            height="400"
            disabled={isSubmitting || isDeleting}
            on:input={clearSubmitError}
          />
        </div>
        {#if errors.content}
          <p class="mt-1 text-sm text-red-400">{errors.content}</p>
        {/if}
      </div>
      
      <!-- Last Updated Info -->
      <div class="text-sm text-gray-400 pt-4 border-t border-gray-700">
        Last updated: {highlight.updated_at.toLocaleDateString()} at {highlight.updated_at.toLocaleTimeString()}
      </div>
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold text-gray-200 mb-4">Delete Highlight</h3>
      <p class="text-gray-300 mb-6">
        Are you sure you want to delete this highlight? This action cannot be undone.
      </p>
      
      <div class="flex items-center justify-end space-x-3">
        <button
          on:click={() => showDeleteConfirm = false}
          disabled={isDeleting}
          class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          on:click={handleDelete}
          disabled={isDeleting}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Trash2 class="w-4 h-4" />
          <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
        </button>
      </div>
    </div>
  </div>
{/if}