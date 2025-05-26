<!-- src/routes/notes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, Filter } from 'lucide-svelte';
  import NoteCard from '$lib/components/NoteCard.svelte';
  import SearchFilter from '$lib/components/SearchFilter.svelte';
  import { notes, searchFilters, mockNotes } from '$lib/stores';
  import type { Note } from '$lib/types';
  
  let filteredNotes: Note[] = [];
  let showFilters = false;
  
  onMount(() => {
    notes.set(mockNotes);
  });
  
  // Reactive filtering
  $: {
    filteredNotes = $notes.filter(note => {
      // Keyword search
      if ($searchFilters.keyword) {
        const keyword = $searchFilters.keyword.toLowerCase();
        const matchesKeyword = 
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword) ||
          note.source.toLowerCase().includes(keyword);
        if (!matchesKeyword) return false;
      }
      
      // Tag filtering
      if ($searchFilters.tags.length > 0) {
        const noteTags = note.tags.map(tag => tag.id);
        if ($searchFilters.tagOperation === 'and') {
          return $searchFilters.tags.every(tagId => noteTags.includes(tagId));
        } else {
          return $searchFilters.tags.some(tagId => noteTags.includes(tagId));
        }
      }
      
      return true;
    });
  }
</script>

<svelte:head>
  <title>Notes - PKMS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Notes</h1>
      <p class="text-gray-400 mt-1">{filteredNotes.length} notes found</p>
    </div>
    
    <div class="flex items-center space-x-3">
      <button
        on:click={() => showFilters = !showFilters}
        class="btn-secondary flex items-center space-x-2"
      >
        <Filter class="w-4 h-4" />
        <span>Filters</span>
      </button>
      
      <a href="/notes/new" class="btn-primary flex items-center space-x-2">
        <Plus class="w-4 h-4" />
        <span>New Note</span>
      </a>
    </div>
  </div>
  
  <!-- Search and Filters -->
  {#if showFilters}
    <SearchFilter />
  {/if}
  
  <!-- Notes Grid -->
  <div class="notes-masonry">
    {#each filteredNotes as note (note.id)}
      <NoteCard {note} />
    {/each}
  </div>
  
  {#if filteredNotes.length === 0}
    <div class="text-center py-12">
      <div class="text-gray-500 mb-4">
        <Search class="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p class="text-xl">No notes found</p>
        <p class="text-sm">Try adjusting your search or create a new note</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .notes-masonry {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
    align-items: start;
  }
  
  .notes-masonry > :global(.note-card) {
    break-inside: avoid;
  }
</style>

