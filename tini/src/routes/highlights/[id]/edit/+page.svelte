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

<div class="flex h-[calc(100vh-64px)] overflow-hidden flex-col">
  <!-- Loading State -->
  {#if isLoading}
    <div class="flex-1 flex items-center justify-center">
      <div class="flex items-center space-x-3 text-gray-400">
        <Loader2 class="w-6 h-6 animate-spin" />
        <span>Loading highlight...</span>
      </div>
    </div>
  
  <!-- Load Error State -->
  {:else if loadError}
    <div class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-200 mb-2">Failed to load highlight</h3>
        <p class="text-gray-400 mb-4">{loadError}</p>
        <div class="flex items-center justify-center space-x-3">
          <button on:click={handleRetryLoad} class="btn-primary">Try Again</button>
          <button
            on:click={() => goto('/highlights')}
            class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Back to Highlights
          </button>
        </div>
      </div>
    </div>
  
  <!-- Main Content -->
  {:else if highlight}
    <!-- Fixed Header Bar -->
    <div class="flex-shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button
            on:click={handleCancel}
            class="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Go back"
            disabled={isSubmitting || isDeleting}
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          
          <div class="flex items-center space-x-4">
            <!-- Book Title Input -->
            <div class="flex-1 max-w-md">
              <input
                type="text"
                bind:value={book_title}
                placeholder="Book title..."
                disabled={isSubmitting || isDeleting}
                class="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-600 focus:border-transparent text-sm"
                class:border-red-500={errors.book_title}
                on:input={clearSubmitError}
              />
            </div>
            
            <!-- Author Input -->
            <div class="flex-1 max-w-xs">
              <input
                type="text"
                bind:value={author}
                placeholder="Author..."
                disabled={isSubmitting || isDeleting}
                class="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-600 focus:border-transparent text-sm"
                on:input={clearSubmitError}
              />
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            type="button"
            on:click={() => showDeleteConfirm = true}
            disabled={isSubmitting || isDeleting}
            class="px-3 py-1.5 text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            Delete
          </button>
          <button
            type="button"
            on:click={handleCancel}
            disabled={isSubmitting || isDeleting}
            class="px-3 py-1.5 text-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            on:click={handleSubmit}
            disabled={isSubmitting || isDeleting}
            class="btn-primary flex items-center space-x-1.5 px-3 py-1.5 text-sm"
          >
            <Save class="w-3 h-3" />
            <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      <!-- Error display -->
      {#if errors.book_title}
        <p class="mt-1 text-xs text-red-400">{errors.book_title}</p>
      {/if}
      {#if submitError}
        <div class="mt-2 bg-red-900/20 border border-red-700 rounded px-3 py-2">
          <p class="text-red-400 text-xs">{submitError}</p>
        </div>
      {/if}
    </div>

    <!-- Editor Section -->
    <div class="flex-1 overflow-hidden p-4">
      <div class="h-full" class:border-red-500={errors.content}>
        <TinyMCEEditor
          bind:content
          placeholder="Enter your book highlights here..."
          height="100%"
          disabled={isSubmitting || isDeleting}
          on:input={clearSubmitError}
        />
      </div>
      {#if errors.content}
        <p class="mt-1 text-xs text-red-400">{errors.content}</p>
      {/if}
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