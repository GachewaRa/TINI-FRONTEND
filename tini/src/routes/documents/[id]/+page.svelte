<!-- src/routes/documents/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, setContext } from 'svelte';
  import { browser } from '$app/environment';
  import { 
    ArrowLeft, 
    FileText, 
    Eye, 
    EyeOff, 
    Plus,
    Palette,
    Star,
    StarOff,
    Loader2,
    AlertCircle,
    Highlighter, 
    BookOpen,

    HighlighterIcon

  } from 'lucide-svelte';
  import { currentDocument, highlightMode } from '$lib/stores/document';
  import { fetchDocument } from '$lib/api/document';
  import { createDocumentHighlight } from '$lib/api/document';
//   import { getTextSelection, clearSelection, highlightColor } from '$lib/utils/document';
  import type { Document, TextSelection } from '$lib/types/document';
    import { clearSelection, getTextSelection } from '$lib/api/utils/document';
  
  let document: Document | null = null;
  let isLoading = true;
  let error = '';
  let selectedText: TextSelection | null = null;
  let showHighlightPanel = false;
  let highlightNote = '';
  let highlightColorValue = '#ffff00';
  let isFavorite = false;
  let isCreatingHighlight = false;
  
  const documentId = $page.params.id;
  
  const highlightColors = [
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#00bfff' },
    { name: 'Pink', value: '#ff69b4' },
    { name: 'Orange', value: '#ffa500' },
    { name: 'Purple', value: '#da70d6' }
  ];
  
//   onMount(async () => {
//     await loadDocument();
//     setupTextSelection();
//   });

  onMount(async () => {
    await loadDocument();
    // Only call setupTextSelection if running in the browser
    if (browser) {
      setupTextSelection();
    }
  });
  
  async function loadDocument() {
    try {
      isLoading = true;
      error = '';
      document = await fetchDocument(documentId);
      currentDocument.set(document);
    } catch (err) {
      console.error('Error loading document:', err);
      error = err instanceof Error ? err.message : 'Failed to load document';
    } finally {
      isLoading = false;
    }
  }
  
  function setupTextSelection() {
    // This code will only be executed if 'browser' is true, i.e., in the client-side
    // You also need to define handleTextSelection somewhere in your script
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
  }
  
  function handleTextSelection() {
    if (!$highlightMode) return;
    
    const selection = getTextSelection();
    if (selection && selection.text.length > 0) {
      selectedText = selection;
      showHighlightPanel = true;
    }
  }
  
  function toggleHighlightMode() {
    highlightMode.update(mode => !mode);
    if (!$highlightMode) {
      clearSelection();
      hideHighlightPanel();
    }
  }
  
  function hideHighlightPanel() {
    showHighlightPanel = false;
    selectedText = null;
    highlightNote = '';
    isFavorite = false;
    clearSelection();
  }
  
  async function createHighlight() {
    if (!selectedText || !document) return;
    
    try {
      isCreatingHighlight = true;
      
      const highlightData = {
        document_id: document.id,
        selected_text: selectedText.text,
        context_before: selectedText.contextBefore,
        context_after: selectedText.contextAfter,
        start_offset: selectedText.startOffset,
        end_offset: selectedText.endOffset,
        user_note: highlightNote.trim() || undefined,
        color: highlightColorValue,
        is_favorite: isFavorite
      };
      
      // Add position data if available
      if (selectedText.boundingRect) {
        highlightData.x_coordinate = selectedText.boundingRect.x;
        highlightData.y_coordinate = selectedText.boundingRect.y;
        highlightData.width = selectedText.boundingRect.width;
        highlightData.height = selectedText.boundingRect.height;
      }
      
      await createDocumentHighlight(highlightData);
      
      // Reload document to get updated highlights
      await loadDocument();
      
      hideHighlightPanel();
      
    } catch (err) {
      console.error('Error creating highlight:', err);
      error = err instanceof Error ? err.message : 'Failed to create highlight';
    } finally {
      isCreatingHighlight = false;
    }
  }
  
  function renderDocumentViewer() {
    if (!document) return;
    
    if (document.file_type === 'pdf') {
      return `
        <iframe 
          src="${document.cloudinary_url}" 
          width="100%" 
          height="800px"
          class="border border-gray-700 rounded-lg"
          title="${document.title}"
        ></iframe>
      `;
    } else if (document.file_type === 'epub') {
      return `
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <BookOpen class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-200 mb-2">EPUB Viewer</h3>
          <p class="text-gray-400 mb-4">
            EPUB viewing is not yet fully implemented. You can download the file to read it in your preferred EPUB reader.
          </p>
          <a 
            href="${document.cloudinary_url}" 
            target="_blank"
            class="btn-primary inline-flex items-center space-x-2"
          >
            <span>Download EPUB</span>
          </a>
        </div>
      `;
    }
  }
</script>

<svelte:head>
  <title>{document?.title || 'Document'} - PKMS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <a href="/documents" class="text-gray-400 hover:text-gray-200 transition-colors">
        <ArrowLeft class="w-6 h-6" />
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-200">
          {document?.title || 'Loading...'}
        </h1>
        {#if document}
          <p class="text-gray-400 text-sm">
            {document.original_filename} • {document.file_type.toUpperCase()}
            {#if document.document_highlights?.length}
              • {document.document_highlights.length} highlights
            {/if}
          </p>
        {/if}
      </div>
    </div>
    
    <div class="flex items-center space-x-3">
      <button
        on:click={toggleHighlightMode}
        class="btn-secondary flex items-center space-x-2 {$highlightMode ? ' text-white' : ''}"
      >
        {#if $highlightMode}
          <EyeOff class="w-4 h-4" />
          <span>Exit Highlight Mode</span>
        {:else}
          <HighlighterIcon class="w-4 h-4" />
          <span>Highlight Mode</span>
        {/if}
      </button>
      
      <a href="/documents/{documentId}/highlights" class="btn-secondary flex items-center space-x-2">
        <Eye class="w-4 h-4" />
        <span>View Highlights</span>
      </a>
    </div>
  </div>
  
  <!-- Highlight Mode Notice -->
  {#if $highlightMode}
    <div class=" border border-yellow-700 rounded-lg p-4">
      <div class="flex items-center space-x-3">
        <HighlighterIcon class="w-5 h-5 text-yellow-400" />
        <div>
          <p class="text-yellow-200 font-medium">Highlight Mode Active</p>
          <p class="text-yellow-300 text-sm">Select text in the document to create highlights</p>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Error State -->
  {#if error}
    <div class="card p-6 text-center">
      <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-200 mb-2">Error Loading Document</h3>
      <p class="text-gray-400 mb-4">{error}</p>
      <button
        on:click={loadDocument}
        class="btn-primary"
      >
        Try Again
      </button>
    </div>
  {:else if isLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3 text-gray-400">
        <Loader2 class="w-6 h-6 animate-spin" />
        <span>Loading document...</span>
      </div>
    </div>
  {:else if document}
    <!-- Document Viewer -->
    <div class="relative">
      {@html renderDocumentViewer()}
    </div>
  {/if}
</div>

<!-- Highlight Creation Panel -->
{#if showHighlightPanel && selectedText}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={hideHighlightPanel}>
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4" on:click|stopPropagation>
      <h3 class="text-lg font-medium text-gray-200 mb-4">Create Highlight</h3>
      
      <!-- Selected Text Preview -->
      <div class="bg-gray-700 rounded-lg p-4 mb-4">
        <p class="text-gray-300 text-sm leading-relaxed">
          "{selectedText.text}"
        </p>
      </div>
      
      <!-- Color Selection -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-200 mb-2">Color</label>
        <div class="flex space-x-2">
          {#each highlightColors as color}
            <button
              type="button"
              on:click={() => highlightColorValue = color.value}
              class="w-8 h-8 rounded-full border-2 transition-all {highlightColorValue === color.value ? 'border-white scale-110' : 'border-gray-600'}"
              style="background-color: {color.value}"
              title={color.name}
            ></button>
          {/each}
        </div>
      </div>
      
      <!-- Note Input -->
      <div class="mb-4">
        <label for="highlight-note" class="block text-sm font-medium text-gray-200 mb-2">
          Note (optional)
        </label>
        <textarea
          id="highlight-note"
          bind:value={highlightNote}
          placeholder="Add a note about this highlight..."
          rows="3"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent resize-none"
        ></textarea>
      </div>
      
      <!-- Favorite Toggle -->
      <div class="mb-6">
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={isFavorite}
            class="sr-only"
          />
          <div class="flex items-center space-x-2 text-gray-200">
            {#if isFavorite}
              <Star class="w-5 h-5 text-yellow-400 fill-current" />
            {:else}
              <StarOff class="w-5 h-5 text-gray-400" />
            {/if}
            <span class="text-sm">Mark as favorite</span>
          </div>
        </label>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center justify-end space-x-3">
        <button
          on:click={hideHighlightPanel}
          class="btn-secondary"
        >
          Cancel
        </button>
        
        <button
          on:click={createHighlight}
          disabled={isCreatingHighlight}
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isCreatingHighlight}
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>Creating...</span>
          {:else}
            <Plus class="w-4 h-4" />
            <span>Create Highlight</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* .btn-primary {
    @apply bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-4 py-2 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium px-4 py-2 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-gray-800 border border-gray-700 rounded-lg;
  } */
</style>