<!-- src/lib/components/ProjectNoteCard.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Calendar, Tag, MessageCircle, FolderOpen, FileText, Eye, EyeOff, X } from 'lucide-svelte';
  import type { Note } from '$lib/types';
  import { tags } from '$lib/stores/tags';

  export let note: Note;
  export let isHidden = false;
  export let isLoading = false;
  export let compact = false;

  const dispatch = createEventDispatcher<{
    hide: { noteId: string };
    unhide: { noteId: string };
    remove: { noteId: string };
  }>();

  // Resolve tag names to full tag objects
  $: resolvedTags = note?.tags ? note.tags.map(tagName => {
    const normalizedTagName = tagName.trim().toLowerCase();
    const fullTag = $tags.find(tag => tag.name.trim().toLowerCase() === normalizedTagName);
    return fullTag || { name: tagName, color: '#6B7280' }; // fallback color
  }) : [];

  function handleCardClick(event: Event) {
    // Don't navigate if clicking on action buttons
    if ((event.target as HTMLElement).closest('.action-buttons')) {
      return;
    }
    
    // Navigate to note detail
    window.location.href = `/notes/${note.id}`;
  }

  function handleHide() {
    dispatch('hide', { noteId: note.id });
  }

  function handleUnhide() {
    dispatch('unhide', { noteId: note.id });
  }

  function handleRemove() {
    dispatch('remove', { noteId: note.id });
  }

  // Truncate content for preview
  function truncateContent(content: string, maxLength = 150): string {
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
  class="note-card card cursor-pointer hover:border-yellow-600/50 transition-all duration-200 relative group
    {compact ? 'p-3' : 'p-4'}
    {isHidden ? 'opacity-60' : ''}
    {isLoading ? 'pointer-events-none' : ''}"
  class:opacity-50={isLoading}
  on:click={handleCardClick}
  on:keydown={(e) => e.key === 'Enter' && handleCardClick(e)}
  role="button"
  tabindex="0"
>
  <!-- Action Buttons - Only show on hover -->
  <div class="action-buttons absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <div class="flex items-center space-x-1 bg-gray-800/90 backdrop-blur-sm rounded px-2 py-1 shadow-lg">
      {#if isHidden}
        <button
          type="button"
          on:click|stopPropagation={handleUnhide}
          disabled={isLoading}
          class="p-1 text-gray-400 hover:text-green-400 transition-colors"
          title="Show note"
        >
          <Eye class="w-3 h-3" />
        </button>
      {:else}
        <button
          type="button"
          on:click|stopPropagation={handleHide}
          disabled={isLoading}
          class="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
          title="Hide note"
        >
          <EyeOff class="w-3 h-3" />
        </button>
      {/if}
      
      <button
        type="button"
        on:click|stopPropagation={handleRemove}
        disabled={isLoading}
        class="p-1 text-gray-400 hover:text-red-400 transition-colors"
        title="Remove from project"
      >
        <X class="w-3 h-3" />
      </button>
    </div>
  </div>

  <!-- Loading Overlay -->
  {#if isLoading}
    <div class="absolute inset-0 bg-gray-900/50 rounded flex items-center justify-center">
      <div class="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {/if}

  <!-- Note Content -->
  <div class="space-y-2" class:space-y-3={!compact}>
    <!-- Title -->
    <h3 class="font-semibold text-gray-200 line-clamp-2 pr-8" 
        class:text-base={compact}
        class:text-lg={!compact}>
      {note.title}
    </h3>

    <!-- Source -->
    <p class="text-gray-400" class:text-xs={compact} class:text-sm={!compact}>
      <span class="font-medium">Source:</span> {note.source}
    </p>

    <!-- Content Preview -->
    <div class="text-gray-300 line-clamp-3" 
         class:text-xs={compact}
         class:text-sm={!compact}>
      {truncateContent(note.content, compact ? 120 : 150)}
    </div>

    <!-- Tags -->
    {#if resolvedTags.length > 0}
      <div class="flex flex-wrap gap-1">
        {#each resolvedTags.slice(0, compact ? 2 : 3) as tag}
          <span 
            class="px-2 py-1 rounded-full font-medium"
            class:text-xs={true}
            style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}"
          >
            {tag.name}
          </span>
        {/each}
        {#if resolvedTags.length > (compact ? 2 : 3)}
          <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
            +{resolvedTags.length - (compact ? 2 : 3)} more
          </span>
        {/if}
      </div>
    {/if}

    <!-- Associated Projects and Matters (only show if not compact) -->
    {#if !compact}
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
    {/if}

    <!-- Footer -->
    <div class="flex items-center justify-between text-gray-500 pt-2 border-t border-gray-700"
         class:text-xs={true}>
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

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>