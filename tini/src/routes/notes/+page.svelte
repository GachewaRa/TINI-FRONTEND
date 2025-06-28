<!-- src/routes/notes/+page.svelte - Updated sections -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, Filter, FolderPlus, FileText, X } from 'lucide-svelte';
  import NoteCard from '$lib/components/NoteCard.svelte';
  import SearchFilter from '$lib/components/SearchFilter.svelte';
  import Pagination from '$lib/components/Pagination.svelte'; // New import
  import { notes, searchFilters } from '$lib/stores';
  import { NotesAPI } from '$lib/api/notes';
  import type { Note, Project} from '$lib/types';
  
  let filteredNotes: Note[] = [];
  let showFilters = false;
  let selectedNotes: Set<string> = new Set();
  let isLoading = false;
  let error = '';
  
  // Pagination state
  let currentPage = 1;
  let totalPages = 1;
  let totalNotes = 0;
  let hasNext = false;
  let hasPrev = false;
  let sortBy = 'newest';
  
  // Project/Matter linking
  let availableProjects: Project[] = [];
  let showProjectDropdown = false;
  let showMatterDropdown = false;
  let isLinkingToProject = false;
  let isLinkingToMatter = false;
  
  onMount(async () => {
    await loadNotes();
  });
  
  async function loadNotes(page: number = 1) {
    try {
      isLoading = true;
      error = '';
      
      const result = await NotesAPI.getNotes(page, 20, sortBy);
      console.log("NORES RESPONSE OBJ:", result)
      notes.set(result.notes);
      currentPage = result.page;
      totalPages = result.totalPages;
      totalNotes = result.total;
      hasNext = result.hasNext;
      hasPrev = result.hasPrev;
      
      // Clear selection when changing pages
      selectedNotes.clear();
      selectedNotes = selectedNotes;
      
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load notes';
      console.error('Error loading notes:', err);
    } finally {
      isLoading = false;
    }
  }
  
  // Handle page changes
  function handlePageChange(event: CustomEvent<{ page: number }>) {
    loadNotes(event.detail.page);
  }
  
  // Handle sort changes
  async function handleSortChange(newSortBy: string) {
    sortBy = newSortBy;
    currentPage = 1; // Reset to first page when sorting
    await loadNotes(1);
  }
  
  function toggleNoteSelection(noteId: string) {
    if (selectedNotes.has(noteId)) {
      selectedNotes.delete(noteId);
    } else {
      selectedNotes.add(noteId);
    }
    selectedNotes = selectedNotes; // Trigger reactivity
  }
  
  function clearSelection() {
    selectedNotes.clear();
    selectedNotes = selectedNotes;
    showProjectDropdown = false;
    showMatterDropdown = false;
  }
  
  async function addNotesToProject(projectId: string) {
    try {
      isLinkingToProject = true;
      const promises = Array.from(selectedNotes).map(noteId => 
        NotesAPI.addNoteToProject(projectId, noteId)
      );
      await Promise.all(promises);
      
      // Refresh current page to show updated relationships
      await loadNotes(currentPage);
      clearSelection();
      
      // Show success message
      alert(`Successfully added ${promises.length} note(s) to project`);
    } catch (err) {
      console.error('Error adding notes to project:', err);
      alert('Failed to add notes to project');
    } finally {
      isLinkingToProject = false;
      showProjectDropdown = false;
    }
  }
  
  async function addNotesToMatter(matterId: string) {
    try {
      isLinkingToMatter = true;
      const promises = Array.from(selectedNotes).map(noteId => 
        NotesAPI.addNoteToMatter(matterId, noteId)
      );
      await Promise.all(promises);
      
      // Refresh current page to show updated relationships
      await loadNotes(currentPage);
      clearSelection();
      
      // Show success message
      alert(`Successfully added ${promises.length} note(s) to matter`);
    } catch (err) {
      console.error('Error adding notes to matter:', err);
      alert('Failed to add notes to matter');
    } finally {
      isLinkingToMatter = false;
      showMatterDropdown = false;
    }
  }
  
  // Update reactive filtering to work with paginated data
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
        const noteTags = note.tags?.map(tag => tag.id) || [];
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

<div class="space-y-6 pb-20"> <!-- Added bottom padding for pagination -->
  <!-- Selection Actions Bar -->
  {#if selectedNotes.size > 0}
    <div class="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <span class="text-yellow-300 font-medium">
            {selectedNotes.size} note(s) selected
          </span>
          
          <div class="flex items-center space-x-2 relative">
            <button
              on:click={() => showProjectDropdown = !showProjectDropdown}
              class="btn-secondary flex items-center space-x-2"
              disabled={isLinkingToProject}
              class:opacity-50={isLinkingToProject}
            >
              <FolderPlus class="w-4 h-4" />
              <span>{isLinkingToProject ? 'Adding...' : 'Add to Project'}</span>
            </button>
            
            {#if showProjectDropdown}
              <div class="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                <div class="p-2 max-h-60 overflow-y-auto">
                  {#each availableProjects as project}
                    <button
                      on:click={() => addNotesToProject(project.id)}
                      class="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded flex items-center space-x-2"
                    >
                      <FolderPlus class="w-4 h-4" />
                      <span>{project.name}</span>
                    </button>
                  {/each}
                  {#if availableProjects.length === 0}
                    <p class="px-3 py-2 text-gray-500 text-sm">No projects available</p>
                  {/if}
                </div>
              </div>
            {/if}
            
            <button
              on:click={() => showMatterDropdown = !showMatterDropdown}
              class="btn-secondary flex items-center space-x-2"
              disabled={isLinkingToMatter}
              class:opacity-50={isLinkingToMatter}
            >
              <FileText class="w-4 h-4" />
              <span>{isLinkingToMatter ? 'Adding...' : 'Add to Matter'}</span>
            </button>
            
            {#if showMatterDropdown}
              <div class="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                <div class="p-2 max-h-60 overflow-y-auto">
                  {#each availableMatters as matter}
                    <button
                      on:click={() => addNotesToMatter(matter.id)}
                      class="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded flex items-center space-x-2"
                    >
                      <FileText class="w-4 h-4" />
                      <span>{matter.name}</span>
                    </button>
                  {/each}
                  {#if availableMatters.length === 0}
                    <p class="px-3 py-2 text-gray-500 text-sm">No matters available</p>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
        
        <button
          on:click={clearSelection}
          class="text-gray-400 hover:text-white transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>
  {/if}

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Notes</h1>
      <p class="text-gray-400 mt-1">
        {isLoading ? 'Loading...' : `${totalNotes} notes total, showing page ${currentPage} of ${totalPages}`}
      </p>
    </div>
    
    <div class="flex items-center space-x-3">
      <!-- Sort dropdown -->
      <select
        bind:value={sortBy}
        on:change={() => handleSortChange(sortBy)}
        class="bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded-md text-sm"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
      
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
  
  <!-- Error Message -->
  {#if error}
    <div class="bg-red-600/20 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
      <p>{error}</p>
      <button 
        on:click={() => loadNotes(currentPage)} 
        class="text-red-200 underline hover:text-red-100 text-sm mt-1"
      >
        Try again
      </button>
    </div>
  {/if}
  
  <!-- Search and Filters -->
  {#if showFilters}
    <SearchFilter />
  {/if}
  
  <!-- Loading State -->
  {#if isLoading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
      <p class="text-gray-400 mt-4">Loading notes...</p>
    </div>
  {:else}
    <!-- Notes Grid -->
    <div class="notes-masonry">
      {#each filteredNotes as note (note.id)}
        <NoteCard 
          {note} 
          isSelected={selectedNotes.has(note.id)}
          on:toggleSelection={() => toggleNoteSelection(note.id)}
        />
      {/each}
    </div>
    
    {#if filteredNotes.length === 0 && !isLoading}
      <div class="text-center py-12">
        <div class="text-gray-500 mb-4">
          <Search class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p class="text-xl">No notes found</p>
          <p class="text-sm">Try adjusting your search or create a new note</p>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Pagination Component - Fixed at bottom -->
{#if !isLoading && totalPages > 1}
  <Pagination
    {currentPage}
    {totalPages}
    {hasNext}
    {hasPrev}
    total={totalNotes}
    itemsPerPage={20}
    on:pageChange={handlePageChange}
  />
{/if}

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