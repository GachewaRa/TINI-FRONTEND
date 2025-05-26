<!-- src/routes/notes/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Edit, Trash2, MessageCircle, Plus, ArrowLeft } from 'lucide-svelte';
  import { notes, mockNotes } from '$lib/stores';
  import type { Note } from '$lib/types';
  
  let note: Note | null = null;
  let isEditing = false;
  let showComments = false;
  
  $: noteId = $page.params.id;
  
  onMount(() => {
    notes.set(mockNotes);
    notes.subscribe(n => {
      note = n.find(note => note.id === noteId) || null;
    });
  });
  
  function editNote() {
    goto(`/notes/${noteId}/edit`);
  }
  
  function deleteNote() {
    if (confirm('Are you sure you want to delete this note?')) {
      notes.update(n => n.filter(note => note.id !== noteId));
      goto('/notes');
    }
  }
  
  function goBack() {
    goto('/notes');
  }
</script>

<svelte:head>
  <title>{note?.title || 'Note'} - PKMS</title>
</svelte:head>

{#if note}
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
        >
          <Trash2 class="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
    
    <!-- Tags -->
    {#if note.tags && note.tags.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each note.tags as tag}
          <span 
            class="px-3 py-1 rounded-full text-sm font-medium"
            style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}"
          >
            {tag.name}
          </span>
        {/each}
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
        
        <!-- Add Comment Form -->
        <div class="border-t border-gray-700 pt-4">
          <textarea
            placeholder="Add a comment..."
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent resize-none"
            rows="3"
          ></textarea>
          <div class="flex justify-end mt-2">
            <button class="btn-primary flex items-center space-x-2">
              <Plus class="w-4 h-4" />
              <span>Add Comment</span>
            </button>
          </div>
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
