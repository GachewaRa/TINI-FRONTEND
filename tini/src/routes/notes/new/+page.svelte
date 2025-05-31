<!-- src/routes/notes/new/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Save, X } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import TagSelector from '$lib/components/TagSelector.svelte';
  import { NotesAPI } from '$lib/api/notes';
  import type { Tag } from '$lib/types';
  import { tags } from '$lib/stores/tags';
  
  let title = '';
  let content = '';
  let source = '';
  let selectedTags: Tag[] = [];
  let allAvailableTags: Tag[] = [];
  let isLoading = false;
  let error = '';
  
  async function saveNote() {
    if (!title.trim() || !content.trim() || !source.trim()) {
      error = 'Please fill in all required fields';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        source: source.trim(),
        tag_ids: selectedTags.map(tag => tag.id)
      };
      console.log("NOTE DATA: ", noteData)
      await NotesAPI.createNote(noteData);
      goto('/notes');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error saving note. Please try again.';
      console.error('Error saving note:', err);
    } finally {
      isLoading = false;
    }
  }
  
  $: allAvailableTags = $tags;

  function cancel() {
    goto('/notes');
  }
</script>

<svelte:head>
  <title>New Note - PKMS</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold text-gray-200">Create New Note</h1>
    <div class="flex items-center space-x-3">
      <button
        on:click={cancel}
        class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        disabled={isLoading}
      >
        <X class="w-4 h-4 mr-2 inline" />
        Cancel
      </button>
      <button
        on:click={saveNote}
        class="btn-primary flex items-center space-x-2"
        disabled={isLoading || !title.trim() || !content.trim() || !source.trim()}
      >
        <Save class="w-4 h-4" />
        <span>{isLoading ? 'Saving...' : 'Save Note'}</span>
      </button>
    </div>
  </div>
  
  <!-- Error Message -->
  {#if error}
    <div class="bg-red-600/20 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
      {error}
    </div>
  {/if}
  
  <!-- Form -->
  <div class="card p-6 space-y-6">
    <!-- Title -->
    <div class="space-y-2">
      <label for="title" class="block text-sm font-medium text-gray-300">
        Title <span class="text-red-400">*</span>
      </label>
      <input
        id="title"
        type="text"
        bind:value={title}
        placeholder="Enter note title..."
        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
        disabled={isLoading}
      />
    </div>
    
    <!-- Source -->
    <div class="space-y-2">
      <label for="source" class="block text-sm font-medium text-gray-300">
        Source <span class="text-red-400">*</span>
      </label>
      <input
        id="source"
        type="text"
        bind:value={source}
        placeholder="Enter source (book title, article, etc.)..."
        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
        disabled={isLoading}
      />
    </div>
    
    <!-- Tags -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-300">Tags</label>
      {#if allAvailableTags.length > 0}
      <TagSelector 
        bind:selectedTags={selectedTags} 
        availableTags={allAvailableTags} 
      />
      {:else}
        <div class="text-sm text-gray-400">Loading tags...</div>
      {/if}
    </div>
    
    <!-- Content -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-300">
        Content <span class="text-red-400">*</span>
      </label>
      <TinyMCEEditor bind:content disabled={isLoading} />
    </div>
  </div>
</div>