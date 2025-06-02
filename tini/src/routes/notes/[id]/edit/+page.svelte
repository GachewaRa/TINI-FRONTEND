<!-- src/routes/notes/[id]/edit/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Save, X, MessageCircle, Plus, ArrowLeft } from 'lucide-svelte';
  import TinyMCEEditor from '$lib/components/TinyMCEEditor.svelte';
  import TagSelector from '$lib/components/TagSelector.svelte';
  import { NotesAPI } from '$lib/api/notes';
  import type { Note, Tag, Comment } from '$lib/types';
  import { tags } from '$lib/stores/tags';
  import { tagsStore } from '$lib/stores/tags';
  
  let note: Note | null = null;
  let title = '';
  let content = '';
  let source = '';
  let selectedTags: Tag[] = [];
  let allAvailableTags: Tag[] = [];
  let isLoading = false;
  let isLoadingNote = true;
  let error = '';
  
  // Comments
  let showComments = false;
  let newComment = '';
  let isAddingComment = false;
  
  $: noteId = $page.params.id;
  $: allAvailableTags = $tags;
  
  onMount(async () => {
    await tagsStore.load();
    await loadNote();
  });
  
  async function loadNote() {
    try {
      isLoadingNote = true;
      error = '';
      note = await NotesAPI.getNote(noteId);
      
      // Populate form fields
      title = note.title;
      content = note.content;
      source = note.source;
      
      // Handle tags properly - similar to your project component
      if (note.tags && note.tags.length > 0) {
        // If your API returns tag objects, use them directly
        selectedTags = note.tags;
        
        // If your API returns tag IDs or names, resolve them like in your project component:
        // selectedTags = note.tags
        //   .map(tagId => allAvailableTags.find(tag => tag.id === tagId))
        //   .filter(tag => tag !== null);
      } else {
        selectedTags = [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load note';
      console.error('Error loading note:', err);
    } finally {
      isLoadingNote = false;
    }
  }

  tags.subscribe(value => {
    allAvailableTags = value;
  });
  
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
      
      await NotesAPI.updateNote(noteId, noteData);
      goto(`/notes/${noteId}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error updating note. Please try again.';
      console.error('Error updating note:', err);
    } finally {
      isLoading = false;
    }
  }
  
  async function addComment() {
    if (!newComment.trim()) return;
    
    isAddingComment = true;
    
    try {
      await NotesAPI.addComment(noteId, newComment.trim());
      newComment = '';
      
      // Reload note to get updated comments
      await loadNote();
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    } finally {
      isAddingComment = false;
    }
  }
  
  function cancel() {
    goto(`/notes/${noteId}`);
  }
  
  function goBack() {
    goto('/notes');
  }
</script>

<svelte:head>
  <title>{note?.title || 'Edit Note'} - PKMS</title>
</svelte:head>

{#if isLoadingNote}
  <div class="text-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
    <p class="text-gray-400 mt-4">Loading note...</p>
  </div>
{:else if error && !note}
  <div class="text-center py-12">
    <p class="text-xl text-gray-400 mb-4">Failed to load note</p>
    <p class="text-red-400 mb-4">{error}</p>
    <button on:click={goBack} class="btn-primary">
      Go Back to Notes
    </button>
  </div>
{:else if note}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          on:click={goBack}
          class="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-3xl font-bold text-gray-200">Edit Note</h1>
      </div>
      
      <div class="flex items-center space-x-3">
        <button
          on:click={() => showComments = !showComments}
          class="btn-secondary flex items-center space-x-2"
        >
          <MessageCircle class="w-4 h-4" />
          <span>Comments ({note.comments?.length || 0})</span>
        </button>
        
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
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
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
    
    <!-- Comments Section -->
    {#if showComments}
      <div class="card p-6 space-y-4">
        <h3 class="text-xl font-semibold text-gray-200">Comments</h3>
        
        {#if note.comments && note.comments.length > 0}
          <div class="space-y-3">
            {#each note.comments as comment}
              <div class="bg-gray-700 p-4 rounded-lg">
                <p class="text-gray-300">{comment.content}</p>
                <div class="text-xs text-gray-500 mt-2">
                  {new Date(comment.created_at).toLocaleString()}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-400">No comments yet.</p>
        {/if}
        
        <!-- Add Comment Form -->
        <div class="border-t border-gray-700 pt-4">
          <textarea
            bind:value={newComment}
            placeholder="Add a comment..."
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent resize-none"
            rows="3"
            disabled={isAddingComment}
          ></textarea>
          <div class="flex justify-end mt-2">
            <button 
              on:click={addComment}
              class="btn-primary flex items-center space-x-2"
              disabled={isAddingComment || !newComment.trim()}
            >
              <Plus class="w-4 h-4" />
              <span>{isAddingComment ? 'Adding...' : 'Add Comment'}</span>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}