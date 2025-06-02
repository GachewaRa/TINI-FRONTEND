<!-- src/routes/notes/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Edit, Trash2, MessageCircle, ArrowLeft, FolderOpen, FileText } from 'lucide-svelte';
  import { NotesAPI } from '$lib/api/notes';
  import type { Note } from '$lib/types';
  import { tags } from '$lib/stores/tags';
  
  let note: Note | null = null;
  let isLoading = true;
  let isDeleting = false;
  let error = '';
  let showComments = false;
  
  $: noteId = $page.params.id;
  
  // Add this reactive statement to resolve tag names to full tag objects
  $: resolvedTags = note?.tags ? note.tags.map(tagName => {
    const fullTag = $tags.find(tag => tag.name === tagName);
    return fullTag || { name: tagName, color: '#6B7280' }; // fallback color
  }) : [];

  onMount(async () => {
    await loadNote();
  });
  
  async function loadNote() {
    try {
      isLoading = true;
      error = '';
      note = await NotesAPI.getNote(noteId);
      console.log("LOADED NOTE: ", note)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load note';
      console.error('Error loading note:', err);
    } finally {
      isLoading = false;
    }
  }
  
  function editNote() {
    goto(`/notes/${noteId}/edit`);
  }
  
  async function deleteNote() {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    isDeleting = true;
    
    try {
      await NotesAPI.deleteNote(noteId);
      goto('/notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
      isDeleting = false;
    }
  }
  
  function goBack() {
    goto('/notes');
  }
  
</script>

<svelte:head>
  <title>{note?.title || 'Note'} - PKMS</title>
</svelte:head>

{#if isLoading}
  <div class="text-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
    <p class="text-gray-400 mt-4">Loading note...</p>
  </div>
{:else if error}
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
        <div>
          <h1 class="text-3xl font-bold text-gray-200">{note.title}</h1>
          <p class="text-gray-400 mt-1">Source: {note.source}</p>
        </div>
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
          on:click={editNote}
          class="btn-primary flex items-center space-x-2"
        >
          <Edit class="w-4 h-4" />
          <span>Edit</span>
        </button>
        
        <button
          on:click={deleteNote}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
          disabled={isDeleting}
          class:opacity-50={isDeleting}
        >
          <Trash2 class="w-4 h-4" />
          <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
        </button>
      </div>
    </div>
    
   <!-- Tags -->
    <!-- Then update the tags section -->
    {#if resolvedTags.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each resolvedTags as tag}
          <span 
            class="px-3 py-1 rounded-full text-sm font-medium"
            style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}"
          >
            {tag.name}
          </span>
        {/each}
      </div>
    {/if}
    
    <!-- Associated Projects and Matters -->
    {#if note.projects && note.projects.length > 0}
      <div class="card p-4">
        <div class="flex items-center space-x-2 text-blue-400 mb-2">
          <FolderOpen class="w-4 h-4" />
          <span class="font-medium">Associated Projects</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each note.projects as project}
            <a 
              href="/projects/{project.id}"
              class="px-3 py-1 bg-blue-600/20 border border-blue-600 text-blue-300 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
            >
              {project.name}
            </a>
          {/each}
        </div>
      </div>
    {/if}
    
    {#if note.matters && note.matters.length > 0}
      <div class="card p-4">
        <div class="flex items-center space-x-2 text-purple-400 mb-2">
          <FileText class="w-4 h-4" />
          <span class="font-medium">Associated Matters</span>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each note.matters as matter}
            <a 
              href="/matters/{matter.id}"
              class="px-3 py-1 bg-purple-600/20 border border-purple-600 text-purple-300 rounded-lg text-sm hover:bg-purple-600/30 transition-colors"
            >
              {matter.name}
            </a>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Content -->
    <div class="card p-6">
      <div class="prose prose-invert max-w-none">
        {@html note.content}
      </div>
    </div>
    
    <!-- Metadata -->
    <div class="card p-4">
      <div class="flex items-center justify-between text-sm text-gray-400">
        <div>
          <span>Created: {new Date(note.created_at).toLocaleString()}</span>
        </div>
        <div>
          <span>Updated: {new Date(note.updated_at).toLocaleString()}</span>
        </div>
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
        
        <div class="border-t border-gray-700 pt-4">
          <p class="text-sm text-gray-400 mb-2">
            To add comments, use the <button on:click={editNote} class="text-yellow-400 hover:text-yellow-300 underline">Edit</button> page.
          </p>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="text-center py-12">
    <p class="text-xl text-gray-400">Note not found</p>
    <button on:click={goBack} class="btn-primary mt-4">
      Go Back to Notes
    </button>
  </div>
{/if}