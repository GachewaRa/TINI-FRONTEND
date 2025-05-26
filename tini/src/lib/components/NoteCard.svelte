<!-- src/lib/components/NoteCard.svelte -->
<script lang="ts">
  import { MessageCircle, Tag as TagIcon, Calendar, ExternalLink } from 'lucide-svelte';
  import type { Note } from '$lib/types';
  
  export let note: Note;
  
  function getRandomOffset() {
    return Math.random() * 10 - 5; // Random offset between -5px and 5px
  }
  
  function truncateContent(content: string, maxLength = 150) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
</script>

<div 
  class="note-card card p-4 hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer"
  style="transform: rotate({getRandomOffset() * 0.5}deg)"
  on:click={() => window.location.href = `/notes/${note.id}`}
  role="button"
  tabindex="0"
  on:keydown={(e) => e.key === 'Enter' && (window.location.href = `/notes/${note.id}`)}
>
  <!-- Title -->
  <h3 class="font-semibold text-yellow-600 mb-2 text-sm leading-tight">
    {note.title}
  </h3>
  
  <!-- Content Preview -->
  <p class="text-gray-300 text-xs leading-relaxed mb-3">
    {truncateContent(note.content)}
  </p>
  
  <!-- Source -->
  <div class="flex items-center text-xs text-gray-500 mb-3">
    <ExternalLink class="w-3 h-3 mr-1" />
    <span class="truncate">{note.source}</span>
  </div>
  
  <!-- Tags -->
  {#if note.tags && note.tags.length > 0}
    <div class="flex flex-wrap gap-1 mb-3">
      {#each note.tags as tag}
        <span 
          class="px-2 py-1 rounded-full text-xs font-medium"
          style="background-color: {tag.color}20; color: {tag.color}"
        >
          {tag.name}
        </span>
      {/each}
    </div>
  {/if}
  
  <!-- Footer -->
  <div class="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
    <div class="flex items-center space-x-3">
      <span class="flex items-center">
        <MessageCircle class="w-3 h-3 mr-1" />
        {note.comments?.length || 0}
      </span>
      <span class="flex items-center">
        <TagIcon class="w-3 h-3 mr-1" />
        {note.tags?.length || 0}
      </span>
    </div>
    
    <div class="flex items-center">
      <Calendar class="w-3 h-3 mr-1" />
      <span>{new Date(note.updated_at).toLocaleDateString()}</span>
    </div>
  </div>
</div>

