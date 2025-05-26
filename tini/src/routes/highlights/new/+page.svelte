<!-- src/routes/highlights/new/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Save, ArrowLeft } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import { highlights } from '$lib/stores';
  import type { Highlight } from '$lib/types';
  
  let book_title = '';
  let author = '';
  let content = '';
  let isSubmitting = false;
  let errors: { [key: string]: string } = {};
  
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
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        book_title: book_title.trim(),
        author: author.trim() || undefined,
        content: content.trim(),
        created_at: new Date(),
        updated_at: new Date(),
        notes_from_highlight: []
      };
      
      // Add to store
      highlights.update(current => [...current, newHighlight]);
      
      // Redirect to highlights list
      goto('/highlights');
    } catch (error) {
      console.error('Error creating highlight:', error);
    } finally {
      isSubmitting = false;
    }
  }
  
  function handleCancel() {
    goto('/highlights');
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
        <span>{isSubmitting ? 'Saving...' : 'Save Highlight'}</span>
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
      <p class="text-sm text-gray-400 mb-4">
        Paste your highlights or excerpts from the book. You'll be able to create individual notes from selected portions later.
      </p>
      <div class="min-h-[400px]" class:border-red-500={errors.content}>
        <TinyMCEEditor
          bind:content
          placeholder="Paste your book highlights here..."
          height="400"
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