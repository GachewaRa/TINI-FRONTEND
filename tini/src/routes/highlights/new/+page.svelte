<!-- src/routes/highlights/new/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Save, ArrowLeft, AlertCircle } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import { highlights } from '$lib/stores';
  import { createHighlight } from '$lib/api/highlights';
  import type { CreateHighlightRequest } from '$lib/api/highlights';
  
  let book_title = '';
  let author = '';
  let content = '';
  let isSubmitting = false;
  let errors: { [key: string]: string } = {};
  let submitError = '';
  
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
    if (!validateForm()) return;
    
    isSubmitting = true;
    submitError = '';
    
    try {
      const highlightData: CreateHighlightRequest = {
        book_title: book_title.trim(),
        content: content.trim(),
        ...(author.trim() && { author: author.trim() })
      };
      
      const newHighlight = await createHighlight(highlightData);
      
      // Add to store for immediate UI update
      highlights.update(current => [...current, newHighlight]);
      
      // Redirect to highlights list
      goto('/highlights');
    } catch (error) {
      console.error('Error creating highlight:', error);
      submitError = error instanceof Error ? error.message : 'Failed to create highlight';
    } finally {
      isSubmitting = false;
    }
  }
  
  function handleCancel() {
    goto('/highlights');
  }
  
  function clearSubmitError() {
    submitError = '';
  }
</script>

<svelte:head>
  <title>New Highlight - PKMS</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <button
        on:click={handleCancel}
        class="p-2 text-gray-400 hover:text-gray-200 transition-colors"
        aria-label="Go back"
        disabled={isSubmitting}
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-3xl font-bold text-gray-200">New Highlight</h1>
        <p class="text-gray-400 mt-1">Add highlights from books or articles</p>
      </div>
    </div>
    
    <div class="flex items-center space-x-3">
      <button
        type="button"
        on:click={handleCancel}
        disabled={isSubmitting}
        class="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
      <button
        type="button"
        on:click={handleSubmit}
        disabled={isSubmitting}
        class="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save class="w-4 h-4" />
        <span>{isSubmitting ? 'Saving...' : 'Save Highlight'}</span>
      </button>
    </div>
  </div>
  
  <!-- Submit Error -->
  {#if submitError}
    <div class="card p-4 bg-red-900/20 border-red-500/30">
      <div class="flex items-start space-x-3">
        <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h4 class="text-sm font-medium text-red-400 mb-1">Error creating highlight</h4>
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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
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
        Paste your highlights or excerpts from the book. You'll be able to create individual notes from selected portions later.
      </p>
      <div class="min-h-[400px]" class:border-red-500={errors.content}>
        <TinyMCEEditor
          bind:content
          placeholder="Paste your book highlights here..."
          height="400"
          disabled={isSubmitting}
          on:input={clearSubmitError}
        />
      </div>
      {#if errors.content}
        <p class="mt-1 text-sm text-red-400">{errors.content}</p>
      {/if}
    </div>
    
    <!-- Help Text -->
    <div class="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-600">
      <h4 class="text-sm font-medium text-yellow-600 mb-2">Tips for adding highlights:</h4>
      <ul class="text-sm text-gray-300 space-y-1">
        <li>• Copy and paste text directly from e-books or documents</li>
        <li>• Keep related highlights from the same book together</li>
        <li>• You can create individual notes from specific portions later</li>
        <li>• Use formatting to organize different sections or chapters</li>
      </ul>
    </div>
  </div>
</div>