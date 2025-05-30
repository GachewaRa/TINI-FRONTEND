<!-- src/lib/components/NoteCard.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Calendar, Tag, MessageCircle, FolderOpen, FileText } from 'lucide-svelte';
  import type { Note } from '$lib/types';
  
  export let note: Note;
  export let isSelected = false;
  
  const dispatch = createEventDispatcher();
  
  function handleCardClick(event: Event) {
    // If clicking on the selection checkbox area, handle selection
    if ((event.target as HTMLElement).closest('.selection-area')) {
      event.preventDefault();
      dispatch('toggleSelection');
      return;
    }
    
    // Otherwise, navigate to note detail
    window.location.href = `/notes/${note.id}`;
  }
  
  function handleSelectionClick(event: Event) {
    event.stopPropagation();
    dispatch('toggleSelection');
  }
  
  // Truncate content for preview
  function truncateContent(content: string, maxLength = 200): string {
    const textContent = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...' 
      : textContent;
  }
  
  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }
</script>

<div 
  class="note-card card p-4 cursor-pointer hover:border-yellow-600/50 transition-all duration-200 relative
    {isSelected ? 'ring-2' : ''}
    {isSelected ? 'ring-yellow-600' : ''}
    {isSelected ? 'border-yellow-600/50' : ''}" on:click={handleCardClick}
  on:keydown={(e) => e.key === 'Enter' && handleCardClick(e)}
  role="button"
  tabindex="0"
>
  <!-- Selection Checkbox -->
  <div class="selection-area absolute top-3 right-3">
    <input
      type="checkbox"
      checked={isSelected}
      on:click={handleSelectionClick}
      class="w-4 h-4 text-yellow-600 bg-gray-700 border-gray-600 rounded focus:ring-yellow-600 focus:ring-2"
    />
  </div>
  
  <!-- Note Content -->
  <div class="space-y-3">
    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-200 line-clamp-2 pr-8">
      {note.title}
    </h3>
    
    <!-- Source -->
    <p class="text-sm text-gray-400">
      <span class="font-medium">Source:</span> {note.source}
    </p>
    
    <!-- Content Preview -->
    <div class="text-gray-300 text-sm line-clamp-4">
      {truncateContent(note.content)}
    </div>
    
    <!-- Tags -->
    {#if note.tags && note.tags.length > 0}
      <div class="flex flex-wrap gap-1">
        {#each note.tags.slice(0, 3) as tag}
          <span 
            class="px-2 py-1 rounded-full text-xs font-medium"
            style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}"
          >
            {tag.name}
          </span>
        {/each}
        {#if note.tags.length > 3}
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
            +{note.tags.length - 3} more
          </span>
        {/if}
      </div>
    {/if}
    
    <!-- Associated Projects and Matters -->
    {#if note.projects && note.projects.length > 0}
      <div class="flex items-center space-x-2 text-xs text-blue-400">
        <FolderOpen class="w-3 h-3" />
        <span>Projects: {note.projects.map(p => p.name).join(', ')}</span>
      </div>
    {/if}
    
    {#if note.matters && note.matters.length > 0}
      <div class="flex items-center space-x-2 text-xs text-purple-400">
        <FileText class="w-3 h-3" />
        <span>Matters: {note.matters.map(m => m.name).join(', ')}</span>
      </div>
    {/if}
    
    <!-- Footer -->
    <div class="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
      <div class="flex items-center space-x-1">
        <Calendar class="w-3 h-3" />
        <span>{formatDate(note.created_at)}</span>
      </div>
      
      {#if note.comments && note.comments.length > 0}
        <div class="flex items-center space-x-1">
          <MessageCircle class="w-3 h-3" />
          <span>{note.comments.length}</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>