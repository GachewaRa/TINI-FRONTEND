<!-- src/routes/documents/[id]/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    ArrowLeft, 
    Highlighter, 
    Eye, 
    Download, 
    Loader2, 
    AlertCircle,
    FileText,
    BookOpen,
    Play,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Settings,
    Trash2
  } from 'lucide-svelte';
  
  import { 
    fetchDocument, 
    fetchDocumentContent, 
    fetchDocumentHighlights,
    createHighlightFromSelection,
    deleteDocument
  } from '$lib/api/document';
  
  import HighlightModal from '$lib/components/HighlightModal.svelte';
  import DocumentStatus from '$lib/components/DocumentStatus.svelte';
  import type { Document, DocumentHighlight, TextSelection } from '$lib/types/document';
  import { applyHighlights, clearSelection, getTextSelection, type SelectionInfo } from '$lib/api/utils/textSelection';
  import { browser } from '$app/environment';
    import EpubRenderer from '$lib/components/EpubRenderer.svelte';

  // Component state
  let userDocument: Document | null = null;
  let documentContent = '';
  let rawContent = '';
  let highlights: DocumentHighlight[] = [];
  let isLoading = true;
  let isLoadingContent = false;
  let isCreatingHighlight = false;
  let isDeleting = false;
  let error = '';
  let contentError = '';

  // Highlighting state
  let isHighlightMode = false;
  let showHighlightModal = false;
  let currentSelection: SelectionInfo | null = null;
  let hasTextSelection = false;

  // Display controls
  let zoomLevel = 100;
  let showDisplayControls = false;
  let fontFamily = 'system';
  let lineHeight = 1.6;
  let maxWidth = 'max-w-4xl';

  // Document viewer container
  let viewerContainer: HTMLElement;
  let contentContainer: HTMLElement;

  // Get document ID from URL
  $: documentId = $page.params.id;

  onMount(async () => {
    await loadDocument();
    setupSelectionListener();
  });

  onDestroy(() => {
    cleanupSelectionListener();
  });

  async function loadDocument() {
    if (!documentId) return;
    
    try {
      isLoading = true;
      error = '';
      
      // Load document metadata
      userDocument = await fetchDocument(documentId);
      console.log("FETCHED DOCUMENT: ", userDocument);
      
      // Load highlights
      highlights = await fetchDocumentHighlights(documentId);
      
      await loadDocumentContent();
    } catch (err) {
      console.error('Error loading document:', err);
      error = err instanceof Error ? err.message : 'Failed to load document';
    } finally {
      isLoading = false;
    }
  }

  async function loadDocumentContent() {
    if (!userDocument) return;
    
    try {
      isLoadingContent = true;
      contentError = '';
      
      const content = await fetchDocumentContent(userDocument.id);
      rawContent = content;
      
      // Process content based on file type
      if (userDocument.file_type === 'html') {
        documentContent = processHtmlContent(content);
      } else if (userDocument.file_type === 'epub') {
        documentContent = await processEpubContent(content);
      }
      
      // Apply existing highlights to content
      documentContent = applyHighlights(documentContent, highlights.map(h => ({
        id: h.id,
        color: h.color,
        selected_text: h.selected_text
      })));
      
    } catch (err) {
      console.error('Error loading document content:', err);
      contentError = err instanceof Error ? err.message : 'Failed to load document content';
    } finally {
      isLoadingContent = false;
    }
  }

  function processHtmlContent(content: string): string {
    // Clean up HTML content, ensure proper structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    // Add unique IDs to elements for text selection
    const elements = doc.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
    elements.forEach((el, index) => {
      if (!el.id) {
        el.id = `content-${index}`;
      }
    });
    
    return doc.body.innerHTML;
  }

  async function processEpubContent(content: string): Promise<string> {
    // For EPUB, we'll need to extract and process the content
    // This is a simplified approach - you might want to use a proper EPUB parser
    try {
      // If content is already HTML (extracted from EPUB), process it
      if (content.includes('<html') || content.includes('<body')) {
        return processHtmlContent(content);
      }
      
      // If it's raw EPUB data, you'd need to parse it properly
      // For now, treat it as text and wrap in basic HTML
      return `<div class="epub-content">${content.replace(/\n/g, '<br>')}</div>`;
    } catch (err) {
      console.error('Error processing EPUB content:', err);
      return `<div class="epub-content">${content}</div>`;
    }
  }

  function setupSelectionListener() {
    if (browser) {
      document.addEventListener('mouseup', handleTextSelection);
      document.addEventListener('keyup', handleTextSelection);
    }
  }

  function cleanupSelectionListener() {
    if (browser) {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('keyup', handleTextSelection);
    }
  }

  function handleTextSelection() {
    if (!isHighlightMode) {
      hasTextSelection = false;
      return;
    }

    const selection = getTextSelection();
    hasTextSelection = !!selection?.selectedText;
    
    if (selection) {
      currentSelection = selection;
    }
  }

  function toggleHighlightMode() {
    isHighlightMode = !isHighlightMode;
    if (!isHighlightMode) {
      clearSelection();
      hasTextSelection = false;
      currentSelection = null;
    }
  }

  function openHighlightModal() {
    if (currentSelection) {
      showHighlightModal = true;
    }
  }

  function closeHighlightModal() {
    showHighlightModal = false;
    clearSelection();
    hasTextSelection = false;
    currentSelection = null;
  }

  async function handleCreateHighlight(event: CustomEvent<{ color: string; userNote?: string }>) {
    if (!currentSelection || !userDocument) return;
    
    try {
      isCreatingHighlight = true;
      
      const textSelection: TextSelection = {
        selected_text: currentSelection.selectedText,
        start_container_id: currentSelection.startContainerId,
        end_container_id: currentSelection.endContainerId,
        start_offset: currentSelection.startOffset,
        end_offset: currentSelection.endOffset,
        page_number: currentSelection.pageNumber,
        bounding_rect: currentSelection.boundingRect ? {
          x: currentSelection.boundingRect.x,
          y: currentSelection.boundingRect.y,
          width: currentSelection.boundingRect.width,
          height: currentSelection.boundingRect.height
        } : undefined,
        context_before: currentSelection.contextBefore,
        context_after: currentSelection.contextAfter
      };

      const newHighlight = await createHighlightFromSelection(
        userDocument.id,
        textSelection,
        event.detail.color,
        event.detail.userNote
      );

      // Add to highlights list
      highlights = [...highlights, newHighlight];
      
      // Refresh content with new highlight
      await loadDocumentContent();
      
      closeHighlightModal();
      
    } catch (err) {
      console.error('Error creating highlight:', err);
      // You might want to show a toast notification here
    } finally {
      isCreatingHighlight = false;
    }
  }

  async function handleDeleteDocument() {
    if (!userDocument || !confirm('Are you sure you want to delete this document?')) return;
    
    try {
      isDeleting = true;
      await deleteDocument(userDocument.id);
      goto('/documents');
    } catch (err) {
      console.error('Error deleting document:', err);
      // Show error toast
    } finally {
      isDeleting = false;
    }
  }

  function adjustZoom(delta: number) {
    zoomLevel = Math.max(50, Math.min(200, zoomLevel + delta));
  }

  function resetZoom() {
    zoomLevel = 100;
  }

  function toggleDisplayControls() {
    showDisplayControls = !showDisplayControls;
  }

  function goToHighlights() {
    goto(`/documents/${documentId}/highlights`);
  }

  function goBack() {
    goto('/documents');
  }

  // Computed properties
  $: canHighlight = userDocument && documentContent;
  $: showContent = canHighlight && documentContent && !isLoadingContent;
  $: zoomStyle = `transform: scale(${zoomLevel / 100}); transform-origin: top left;`;
  $: contentStyle = `
    ${zoomStyle}
    font-family: ${fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'Monaco, monospace' : 'system-ui, sans-serif'};
    line-height: ${lineHeight};
  `;
</script>

<svelte:head>
  <title>{userDocument?.title || 'Document'} - PKMS</title>
</svelte:head>

<div class="min-h-screen bg-gray-900">
  <!-- Header -->
  <div class="sticky top-0 z-30 bg-gray-900 border-b border-gray-700 px-6 py-4">
    <div class="flex items-center justify-between max-w-7xl mx-auto">
      <!-- Left: Back button and title -->
      <div class="flex items-center space-x-4 min-w-0 flex-1">
        <button
          on:click={goBack}
          class="flex items-center space-x-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
          <span class="hidden sm:inline">Back</span>
        </button>
        
        {#if userDocument}
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-semibold text-gray-200 truncate">
              {userDocument.title}
            </h1>
            <div class="flex items-center space-x-3 text-sm text-gray-400 mt-1">
              <span class="flex items-center space-x-1">
                {#if userDocument.file_type === 'html'}
                  <FileText class="w-4 h-4" />
                {:else}
                  <BookOpen class="w-4 h-4" />
                {/if}
                <span class="uppercase">{userDocument.file_type}</span>
              </span>
              {#if userDocument.total_pages}
                <span>•</span>
                <span>{userDocument.total_pages} pages</span>
              {/if}
              <span>•</span>
              <span>{highlights.length} highlights</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Right: Action buttons -->
      <div class="flex items-center space-x-3">
        {#if canHighlight}
          <!-- Display Controls -->
          <div class="relative">
            <button
              on:click={toggleDisplayControls}
              class="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Settings class="w-4 h-4" />
              <span class="hidden sm:inline">Display</span>
            </button>
            
            {#if showDisplayControls}
              <div class="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-40">
                <!-- Zoom Controls -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-300 mb-2">Zoom: {zoomLevel}%</label>
                  <div class="flex items-center space-x-2">
                    <button
                      on:click={() => adjustZoom(-10)}
                      class="p-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    >
                      <ZoomOut class="w-4 h-4" />
                    </button>
                    <button
                      on:click={resetZoom}
                      class="p-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    >
                      <RotateCcw class="w-4 h-4" />
                    </button>
                    <button
                      on:click={() => adjustZoom(10)}
                      class="p-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    >
                      <ZoomIn class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Font Family -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-300 mb-2">Font</label>
                  <select
                    bind:value={fontFamily}
                    class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600"
                  >
                    <option value="system">System</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Monospace</option>
                  </select>
                </div>

                <!-- Line Height -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-300 mb-2">Line Height</label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    bind:value={lineHeight}
                    class="w-full"
                  />
                  <div class="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Tight</span>
                    <span>Normal</span>
                    <span>Loose</span>
                  </div>
                </div>

                <!-- Max Width -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Width</label>
                  <select
                    bind:value={maxWidth}
                    class="w-full px-3 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600"
                  >
                    <option value="max-w-2xl">Narrow</option>
                    <option value="max-w-4xl">Medium</option>
                    <option value="max-w-6xl">Wide</option>
                    <option value="max-w-full">Full</option>
                  </select>
                </div>
              </div>
            {/if}
          </div>

          <!-- Highlight Mode Toggle -->
          <button
            on:click={toggleHighlightMode}
            class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
            class:bg-yellow-600={isHighlightMode}
            class:text-white={isHighlightMode}
            class:bg-gray-700={!isHighlightMode}
            class:text-gray-300={!isHighlightMode}
            class:hover:bg-yellow-700={isHighlightMode}
            class:hover:bg-gray-600={!isHighlightMode}
          >
            <Highlighter class="w-4 h-4" />
            <span class="hidden sm:inline">
              {isHighlightMode ? 'Exit Highlight' : 'Highlight Mode'}
            </span>
          </button>

          <!-- Add Highlight Button -->
          {#if isHighlightMode && hasTextSelection}
            <button
              on:click={openHighlightModal}
              class="btn-primary flex items-center space-x-2 animate-pulse"
            >
              <Highlighter class="w-4 h-4" />
              <span class="hidden sm:inline">Add Highlight</span>
            </button>
          {/if}

          <!-- View Highlights Button -->
          <button
            on:click={goToHighlights}
            class="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Eye class="w-4 h-4" />
            <span class="hidden sm:inline">View Highlights</span>
            {#if highlights.length > 0}
              <span class="bg-yellow-600 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                {highlights.length}
              </span>
            {/if}
          </button>
        {/if}

        <!-- Download Button -->
        {#if userDocument}
          <a
            href={userDocument.cloudinary_url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            title="Download original file"
          >
            <Download class="w-4 h-4" />
            <span class="hidden sm:inline">Download</span>
          </a>
        {/if}

        <!-- Delete Button -->
        {#if userDocument}
          <button
            on:click={handleDeleteDocument}
            disabled={isDeleting}
            class="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            title="Delete document"
          >
            {#if isDeleting}
              <Loader2 class="w-4 h-4 animate-spin" />
            {:else}
              <Trash2 class="w-4 h-4" />
            {/if}
            <span class="hidden sm:inline">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </span>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-6 py-8" bind:this={viewerContainer}>
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-12">
        <div class="flex items-center space-x-3 text-gray-400">
          <Loader2 class="w-6 h-6 animate-spin" />
          <span>Loading document...</span>
        </div>
      </div>

    {:else if error}
      <!-- Error State -->
      <div class="text-center py-12">
        <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-200 mb-2">Error Loading Document</h3>
        <p class="text-gray-400 mb-6">{error}</p>
        <button
          on:click={loadDocument}
          class="btn-primary"
        >
          Try Again
        </button>
      </div>

    {:else if userDocument}
      <div class="space-y-6">
        <!-- Document Content -->
        {#if isLoadingContent}
          <div class="flex items-center justify-center py-12">
            <div class="flex items-center space-x-3 text-gray-400">
              <Loader2 class="w-6 h-6 animate-spin" />
              <span>Loading document content...</span>
            </div>
          </div>

        {:else if contentError}
          <div class="card p-6 text-center">
            <AlertCircle class="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-200 mb-2">Content Error</h3>
            <p class="text-gray-400 mb-4">{contentError}</p>
            <button
              on:click={loadDocumentContent}
              class="btn-primary"
            >
              Retry Loading Content
            </button>
          </div>

        {:else if showContent}
          <!-- Document Content Display -->
          {#if userDocument.file_type === 'epub'}
            <!-- EPUB Renderer -->
            <EpubRenderer
              epubContent={rawContent}
              {highlights}
              {isHighlightMode}
              {zoomLevel}
              {fontFamily}
              {lineHeight}
              on:textSelection={handleTextSelection}
            />
          {:else}
            <!-- HTML Renderer -->
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
              <div 
                class="prose prose-lg {maxWidth} mx-auto p-8 document-content"
                class:highlight-mode={isHighlightMode}
                style={contentStyle}
                bind:this={contentContainer}
                
              ></div>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Highlight Modal -->
<HighlightModal
  bind:isOpen={showHighlightModal}
  selection={currentSelection ? {
    selected_text: currentSelection.selectedText,
    start_container_id: currentSelection.startContainerId,
    end_container_id: currentSelection.endContainerId,
    start_offset: currentSelection.startOffset,
    end_offset: currentSelection.endOffset,
    page_number: currentSelection.pageNumber,
    bounding_rect: currentSelection.boundingRect,
    context_before: currentSelection.contextBefore,
    context_after: currentSelection.contextAfter,
    chapter_title: currentSelection.chapterTitle
  } : null}
  isLoading={isCreatingHighlight}
  on:create={handleCreateHighlight}
  on:close={closeHighlightModal}
/>

<style>
  .document-content {
    user-select: text;
    transition: all 0.2s ease;
  }

  .document-content.highlight-mode {
    cursor: text;
  }

  .document-content :global(.highlight) {
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
  }

  .document-content :global(.highlight:hover) {
    filter: brightness(1.1);
  }

  /* EPUB specific styles */
  .document-content :global(.epub-content) {
    max-width: none;
  }

  /* Smooth zoom transition */
  .document-content {
    transition: transform 0.2s ease;
  }

  /* Hide display controls when clicking outside */
  :global(body) {
    overflow-x: auto;
  }
</style>