<!-- src/routes/notes/new/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Save, X, Plus } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import TagSelector from '$lib/components/TagSelector.svelte';
  import { notes, tags, mockTags } from '$lib/stores';
  import type { Note, Tag } from '$lib/types';
  import { onMount } from 'svelte';
  
  let title = '';
  let content = '';
  let source = '';
  let selectedTags: Tag[] = [];
  let isLoading = false;
  
  onMount(() => {
    tags.set(mockTags);
  });
  
  async function saveNote() {
    if (!title.trim() || !content.trim() || !source.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    isLoading = true;
    
    try {
      const newNote: Note = {
        id: Date.now().toString(), // In real app, this would come from backend
        title: title.trim(),
        content: content.trim(),
        source: source.trim(),
        created_at: new Date(),
        updated_at: new Date(),
        tags: selectedTags,
        comments: []
      };
      
      notes.update(n => [...n, newNote]);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      goto('/notes');
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Error saving note. Please try again.');
    } finally {
      isLoading = false;
    }
  }
  
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
      <TagSelector bind:selectedTags />
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

