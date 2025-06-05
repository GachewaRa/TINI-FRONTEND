<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { 
    ArrowLeft, 
    Search, 
    Star, 
    Calendar, 
    Edit3, 
    Trash2, 
    Copy,
    BookOpen,
    Palette,
    Loader2,
    AlertCircle
  } from 'lucide-svelte';
  import { fetchDocument, deleteDocumentHighlight, updateDocumentHighlight } from '$lib/api/document';
//   import { truncateText } from '$lib/utils/document';
  import type { Document, DocumentHighlight } from '$lib/types/document';
    import { truncateText } from '$lib/api/utils/document';
  
  let document: Document | null = null;
  let highlights: DocumentHighlight[] = [];
  let filteredHighlights: DocumentHighlight[] = [];
  let searchTerm = '';
  let isLoading = true;
  let error = '';
  let deleteConfirm = '';
  let editingHighlight: DocumentHighlight | null = null;
  let editNote = '';
  let editColor = '#ffff00';
  let editIsFavorite = false;
  
  const documentId = $page.params.id;
  
  const highlightColors = [
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#00bfff' },
    { name: 'Pink', value: '#ff69b4' },
    { name: 'Orange', value: '#ffa500' },
    { name: 'Purple', value: '#da70d6' }
  ];
  
  onMount(async () => {
    await loadDocument();
  });
  
  async function loadDocument() {
    try {
      isLoading = true;
      error = '';
      const fetchedDocument = await fetchDocument(documentId);
      document = fetchedDocument;
      // Ensure highlight_date is a Date object for toLocaleDateString()
      highlights = (document?.document_highlights || []).map(h => ({
        ...h,
        highlight_date: new Date(h.highlight_date)
    }));
    } catch (err) {
      console.error('Error loading document:', err);
      error = err instanceof Error ? err.message : 'Failed to load document';
    } finally {
      isLoading = false;
    }
  }
  
  async function handleDelete(highlight: DocumentHighlight) {
    if (deleteConfirm !== highlight.id) {
      deleteConfirm = highlight.id;
      return;
    }
    
    try {
      await deleteDocumentHighlight(highlight.id);
      await loadDocument(); // Reload to reflect changes
      deleteConfirm = '';
    } catch (err) {
      console.error('Error deleting highlight:', err);
      error = err instanceof Error ? err.message : 'Failed to delete highlight';
    }
  }
  
  function startEditing(highlight: DocumentHighlight) {
    editingHighlight = highlight;
    editNote = highlight.user_note || '';
    editColor = highlight.color;
    editIsFavorite = highlight.is_favorite;
  }
  
  function cancelEditing() {
    editingHighlight = null;
    editNote = '';
    editColor = '#ffff00'; // Reset to default
    editIsFavorite = false;
  }
  
  async function saveEdit() {
    if (!editingHighlight) return;
    
    try {
      const updates = {
        user_note: editNote.trim() || undefined,
        color: editColor,
        is_favorite: editIsFavorite
      };
      
      await updateDocumentHighlight(editingHighlight.id, updates);
      await loadDocument(); // Reload to reflect changes
      cancelEditing();
    } catch (err) {
      console.error('Error updating highlight:', err);
      error = err instanceof Error ? err.message : 'Failed to update highlight';
    }
  }
  
  async function copyHighlight(highlight: DocumentHighlight) {
    try {
      await navigator.clipboard.writeText(highlight.selected_text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }
  
  async function toggleFavorite(highlight: DocumentHighlight) {
    try {
      await updateDocumentHighlight(highlight.id, {
        is_favorite: !highlight.is_favorite
      });
      await loadDocument(); // Reload to reflect changes
    } catch (err) {
      console.error('Error updating favorite:', err);
      error = err instanceof Error ? err.message : 'Failed to update favorite';
    }
  }
  
  // Reactive filtering
  $: {
    filteredHighlights = highlights.filter(highlight => {
      if (!searchTerm) return true;
      
      const term = searchTerm.toLowerCase();
      return (
        highlight.selected_text.toLowerCase().includes(term) ||
        highlight.user_note?.toLowerCase().includes(term) ||
        highlight.chapter_title?.toLowerCase().includes(term)
      );
    });
  }
</script>

<svelte:head>
  <title>{document?.title || 'Document'} Highlights - PKMS</title>
</svelte:head>

<div class="space-y-6">
    <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <a href="/documents/{documentId}" class="text-gray-400 hover:text-gray-200 transition-colors">
        <ArrowLeft class="w-6 h-6" />
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-200">
          {document?.title || 'Loading...'} - Highlights
        </h1>
        <p class="text-gray-400 text-sm">
          {#if isLoading}
            Loading highlights...
          {:else if error}
            Error loading highlights
          {:else}
            {filteredHighlights.length} highlights found
          {/if}
        </p>
      </div>
    </div>
    
    <a href="/documents/{documentId}" class="btn-secondary flex items-center space-x-2">
      <BookOpen class="w-4 h-4" />
      <span>Back to Document</span>
    </a>
  </div>
  
    <div class="relative">
    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search highlights by content, notes, or chapter..."
      bind:value={searchTerm}
      disabled={isLoading}
      class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
  
    {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3 text-gray-400">
        <Loader2 class="w-6 h-6 animate-spin" />
        <span>Loading highlights...</span>
      </div>
    </div>
  
    {:else if error}
    <div class="card p-6 text-center">
      <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-200 mb-2">Failed to load highlights</h3>
      <p class="text-gray-400 mb-4">{error}</p>
      <button
        on:click={loadDocument}
        class="btn-primary"
      >
        Try Again
      </button>
    </div>
  
    {:else}
    <div class="space-y-4">
      {#each filteredHighlights as highlight (highlight.id)}
        <div class="card p-6 border-l-4" style="border-left-color: {highlight.color}">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div 
                class="w-4 h-4 rounded-full"
                style="background-color: {highlight.color}"
              ></div>
              
              {#if highlight.is_favorite}
                <Star class="w-4 h-4 text-yellow-400 fill-current" />
              {/if}
              
              {#if highlight.page_number}
                <span class="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                  Page {highlight.page_number}
                </span>
              {/if}
              
              {#if highlight.chapter_title}
                <span class="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                  {truncateText(highlight.chapter_title, 30)}
                </span>
              {/if}
            </div>
            
            <div class="flex items-center space-x-2">
              <button
                on:click={() => toggleFavorite(highlight)}
                class="text-gray-400 hover:text-yellow-400 transition-colors p-1"
                title={highlight.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star class="w-4 h-4 {highlight.is_favorite ? 'fill-current text-yellow-400' : ''}" />
              </button>
              
              <button
                on:click={() => copyHighlight(highlight)}
                class="text-gray-400 hover:text-green-400 transition-colors p-1"
                title="Copy text"
              >
                <Copy class="w-4 h-4" />
              </button>
              
              <button
                on:click={() => startEditing(highlight)}
                class="text-gray-400 hover:text-blue-400 transition-colors p-1"
                title="Edit highlight"
              >
                <Edit3 class="w-4 h-4" />
              </button>
              
              <button
                on:click={() => handleDelete(highlight)}
                class="text-gray-400 hover:text-red-400 transition-colors p-1"
                title={deleteConfirm === highlight.id ? 'Click again to confirm' : 'Delete highlight'}
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          
                    <div class="text-gray-200 leading-relaxed mb-3 p-3 bg-gray-700/50 rounded-lg">
            <p>"{highlight.selected_text}"</p>
          </div>
          
                    {#if highlight.user_note}
            <div class="text-gray-300 text-sm mb-3 p-3 bg-gray-800/50 rounded-lg border-l-2 border-yellow-600">
              <p>{highlight.user_note}</p>
            </div>
          {/if}
          
                    <div class="flex items-center justify-between text-xs text-gray-500">
            <div class="flex items-center space-x-1">
              <Calendar class="w-3 h-3" />
              <span>{highlight.highlight_date.toLocaleDateString()}</span>
            </div>
            <div>
              {highlight.selected_text.length} characters
            </div>
          </div>
        </div>
      {/each}
      
      {#if filteredHighlights.length === 0}
        <div class="text-center py-12">
          <BookOpen class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-400 mb-2">No highlights found</h3>
          <p class="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Start highlighting text in the document to create your first highlight'}
          </p>
          <a href="/documents/{documentId}" class="btn-primary inline-flex items-center space-x-2">
                <BookOpen class="w-4 h-4" />
                <span>Go to Document</span>
            </a>
        </div>
      {/if}
    </div>
  {/if}
</div>

---

## Edit Highlight Modal

{#if editingHighlight}
    <div
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
        on:click|self={cancelEditing}
        on:keydown={(e) => { if (e.key === 'Escape') cancelEditing(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-highlight-title"
    >
        <div class="bg-gray-900 rounded-lg shadow-xl p-8 w-full max-w-md space-y-6" on:click|stopPropagation>
            <h2 id="edit-highlight-title" class="text-2xl font-bold text-gray-100 mb-4 flex items-center space-x-2">
                <Edit3 class="w-6 h-6 text-blue-400" />
                <span>Edit Highlight</span>
            </h2>

            <div class="form-group">
                <label for="highlight-text" class="block text-gray-300 text-sm font-medium mb-2">Original Highlight</label>
                <div id="highlight-text" class="p-3 bg-gray-800 rounded-lg text-gray-200 text-sm italic border border-gray-700">
                    "{editingHighlight.selected_text}"
                </div>
            </div>

            <div class="form-group">
                <label for="edit-note" class="block text-gray-300 text-sm font-medium mb-2">Your Note (Optional)</label>
                <textarea
                    id="edit-note"
                    bind:value={editNote}
                    rows="4"
                    placeholder="Add a personal note to this highlight..."
                    class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                ></textarea>
            </div>

            <div class="form-group">
                <label class="block text-gray-300 text-sm font-medium mb-2">Highlight Color</label>
                <div class="flex flex-wrap gap-3">
                    {#each highlightColors as colorOption}
                        <label class="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="highlight-color"
                                value={colorOption.value}
                                bind:group={editColor}
                                class="hidden"
                            />
                            <div
                                class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                       {editColor === colorOption.value ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-yellow-600' : 'border-gray-700'}"
                                style="background-color: {colorOption.value};"
                            >
                                {#if editColor === colorOption.value}
                                    <span class="text-gray-900 text-xl leading-none">✔</span>
                                {/if}
                            </div>
                            <span class="sr-only">{colorOption.name}</span>
                        </label>
                    {/each}
                </div>
            </div>

            <div class="form-group flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="edit-favorite"
                    bind:checked={editIsFavorite}
                    class="form-checkbox h-5 w-5 text-yellow-500 rounded border-gray-700 bg-gray-800 focus:ring-yellow-600"
                />
                <label for="edit-favorite" class="text-gray-300 text-sm font-medium">Mark as Favorite</label>
                <Star class="w-4 h-4 text-yellow-400 {editIsFavorite ? 'fill-current' : ''}" />
            </div>

            <div class="flex justify-end space-x-3 mt-6">
                <button
                    on:click={cancelEditing}
                    class="btn-secondary"
                >
                    Cancel
                </button>
                <button
                    on:click={saveEdit}
                    class="btn-primary"
                >
                    Save Changes
                </button>
            </div>
        </div>
    </div>
{/if}