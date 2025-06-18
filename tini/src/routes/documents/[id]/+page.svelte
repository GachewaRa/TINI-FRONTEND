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
    BookOpen 
  } from 'lucide-svelte';
  
  import { 
    fetchDocument, 
    fetchDocumentContent, 
    fetchDocumentHighlights,
    createHighlightFromSelection
  } from '$lib/api/document';
  
  import HighlightModal from '$lib/components/HighlightModal.svelte';
  import DocumentStatus from '$lib/components/DocumentStatus.svelte';
  
  // import { getTextSelection, applyHighlights, clearSelection, type SelectionInfo } from '$api/utils/textSelection';
  
  import type { Document, DocumentHighlight, TextSelection } from '$lib/types/document';
    import { applyHighlights, clearSelection, getTextSelection, type SelectionInfo } from '$lib/api/utils/textSelection';
    import { browser } from '$app/environment';

  // Component state
  let userDocument: Document | null = null;
  let documentContent = '';
  let highlights: DocumentHighlight[] = [];
  let isLoading = true;
  let isLoadingContent = false;
  let isCreatingHighlight = false;
  let error = '';
  let contentError = '';

  // Highlighting state
  let isHighlightMode = false;
  let showHighlightModal = false;
  let currentSelection: SelectionInfo | null = null;
  let hasTextSelection = false;

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
      console.log("FETCHED DOCUMENT: ", userDocument)
      // Load highlights
      highlights = await fetchDocumentHighlights(documentId);
      
      // Load content if document is ready
      if (userDocument.file_type === 'epub' || 
          (userDocument.file_type === 'pdf' && userDocument.is_html_ready)) {
        await loadDocumentContent();
      }
      
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
      
      // Apply existing highlights to content
      documentContent = applyHighlights(content, highlights.map(h => ({
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

  function setupSelectionListener() {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('keyup', handleTextSelection);
  }

  function cleanupSelectionListener() {
    if (browser) {
      document.addEventListener('mouseup', handleTextSelection);
      document.addEventListener('keyup', handleTextSelection);
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

  function handleStatusChange(newStatus: string) {
    if (userDocument) {
      userDocument.processing_status = newStatus;
      userDocument.is_html_ready = newStatus === 'COMPLETED';
      
      // Load content if processing completed
      if (newStatus === 'COMPLETED') {
        loadDocumentContent();
      }
    }
  }

  function goToHighlights() {
    goto(`/documents/${documentId}/highlights`);
  }

  function goBack() {
    goto('/documents');
  }

  // Computed properties
  $: canHighlight = userDocument && (
    userDocument.file_type === 'epub' || 
    (userDocument.file_type === 'pdf' && userDocument.is_html_ready)
  );

  $: showContent = canHighlight && documentContent && !isLoadingContent;
  $: showProcessingStatus = userDocument?.file_type === 'pdf' && !userDocument.is_html_ready;
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
                {#if userDocument.file_type === 'pdf'}
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
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-6 py-8">
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
        <!-- Processing Status (for PDFs) -->
        {#if showProcessingStatus}
          <DocumentStatus 
            {userDocument} 
            onStatusChange={handleStatusChange}
          />
        {/if}

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
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div 
              class="prose prose-lg max-w-none p-8 document-content"
              class:highlight-mode={isHighlightMode}
              bind:innerHTML={documentContent}
              contenteditable="true"
            ></div>
          </div>

        {:else if !canHighlight}
          <!-- File Type Not Supported for Highlighting -->
          <div class="card p-8 text-center">
            <FileText class="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-200 mb-2">Preview Not Available</h3>
            <p class="text-gray-400 mb-6">
              This document type doesn't support in-browser highlighting yet.
              You can still download the original file.
            </p>
            <a
              href={userDocument.cloudinary_url}
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary inline-flex items-center space-x-2"
            >
              <Download class="w-4 h-4" />
              <span>Download Original File</span>
            </a>
          </div>
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
  :global(.document-content) {
    line-height: 1.7;
    color: #1f2937;
  }

  :global(.document-content.highlight-mode) {
    cursor: text;
    user-select: text;
  }

  :global(.document-content .highlight) {
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  :global(.document-content .highlight:hover) {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transform: translateY(-1px);
  }

  :global(.document-content h1, .document-content h2, .document-content h3) {
    color: #111827;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  :global(.document-content p) {
    margin-bottom: 1rem;
  }

  :global(.document-content img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* Selection styling in highlight mode */
  :global(.highlight-mode ::selection) {
    background-color: rgba(255, 255, 0, 0.3);
  }

  :global(.highlight-mode ::-moz-selection) {
    background-color: rgba(255, 255, 0, 0.3);
  }
</style>