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
    ZoomIn,
    ZoomOut,
    RotateCw,
    Download
  } from 'lucide-svelte';
  import { currentDocument, highlightMode } from '$lib/stores/document';
  import { fetchDocument } from '$lib/api/document';
  import { createDocumentHighlight } from '$lib/api/document';
  import type { Document, TextSelection } from '$lib/types/document';
  
  let pdfDocument: Document | null = null;
  let isLoading = true;
  let error = '';
  let selectedText: TextSelection | null = null;
  let showHighlightPreview = false;
  let highlightNote = '';
  let highlightColorValue = '#ffff00';
  let isFavorite = false;
  let isCreatingHighlight = false;
  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let scale = 1.2;
  let isAddToHighlightsMode = false;
  let selectedTextInfo = null;

  let canvasElement;
  
  const documentId = $page.params.id;
  
  const highlightColors = [
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#90EE90' },
    { name: 'Blue', value: '#87CEEB' },
    { name: 'Pink', value: '#FFB6C1' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Purple', value: '#DDA0DD' }
  ];
  
  onMount(async () => {
    await loadDocument();
    if (browser && pdfDocument?.file_type === 'pdf') {
      await initializePdfViewer();
    }
  });
  

  async function loadDocument() {
    try {
      isLoading = true;
      error = '';
      pdfDocument = await fetchDocument(documentId); // Use pdfDocument instead
      currentDocument.set(pdfDocument);
    } catch (err) {
      console.error('Error loading document:', err);
      error = err instanceof Error ? err.message : 'Failed to load document';
    } finally {
      isLoading = false;
    }
  }
  
  async function initializePdfViewer() {
    try {
      // Ensure we have the DOM document object
      const domDocument = document;
      
      // Load PDF.js if not already loaded
      if (!window.pdfjsLib) {
        await new Promise((resolve) => {
          const script = domDocument.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib = {
              ...window.pdfjsLib,
              GlobalWorkerOptions: {
                workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
              }
            };
            resolve();
          };
          domDocument.head.appendChild(script);
        });
      }
      
      await loadPdf();
    } catch (err) {
      console.error('Error initializing PDF viewer:', err);
      error = 'Failed to initialize PDF viewer';
    }
  }
  
  async function loadPdf() {
    try {
      console.log('Loading PDF:', pdfDocument?.cloudinary_url); // Debug log
      
      if (!window.pdfjsLib || !pdfDocument?.cloudinary_url) {
        throw new Error('PDF library not loaded or document URL missing');
      }

      const loadingTask = window.pdfjsLib.getDocument(pdfDocument.cloudinary_url);
      pdfDoc = await loadingTask.promise;
      
      console.log('PDF loaded successfully, pages:', pdfDoc.numPages); // Debug log
      
      totalPages = pdfDoc.numPages;
      
      // Wait for canvas to be available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await renderPage(1);
      setupTextSelectionListener();
    } catch (err) {
      console.error('Error loading PDF:', err);
      error = 'Failed to load PDF document: ' + err.message;
    }
  }
  
  async function renderPage(pageNum) {
    if (!pdfDoc || !canvasElement) return;
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const context = canvasElement.getContext('2d');
      
      canvasElement.height = viewport.height;
      canvasElement.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      await renderHighlights(page, viewport);
      currentPage = pageNum;
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }
  
  async function renderHighlights(page, viewport) {
    if (!pdfDocument?.document_highlights) return; // Changed from document
    
    const canvas = document.getElementById('pdf-canvas'); // This document is correct (DOM)
    const context = canvas.getContext('2d');
    
    const textContent = await page.getTextContent();
    
    pdfDocument.document_highlights // Changed from document
      .filter(highlight => highlight.page_number === currentPage)
      .forEach(highlight => {
        context.fillStyle = highlight.color + '40';
        context.fillRect(
          highlight.x_coordinate * scale,
          highlight.y_coordinate * scale,
          highlight.width * scale,
          highlight.height * scale
        );
      });
  }
  
  function setupTextSelectionListener() {
    const canvas = document.getElementById('pdf-canvas');
    let isSelecting = false;
    let startX, startY, endX, endY;
    
    canvas.addEventListener('mousedown', (e) => {
      if (!isAddToHighlightsMode) return;
      isSelecting = true;
      const rect = canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (!isSelecting || !isAddToHighlightsMode) return;
      const rect = canvas.getBoundingClientRect();
      endX = e.clientX - rect.left;
      endY = e.clientY - rect.top;
      // Draw selection rectangle
      drawSelectionRectangle(startX, startY, endX, endY);
    });
    
    canvas.addEventListener('mouseup', async (e) => {
      if (!isSelecting || !isAddToHighlightsMode) return;
      isSelecting = false;
      
      const rect = canvas.getBoundingClientRect();
      endX = e.clientX - rect.left;
      endY = e.clientY - rect.top;
      
      // Extract text from selection
      await extractSelectedText(startX, startY, endX, endY);
    });
  }
  
  function drawSelectionRectangle(startX, startY, endX, endY) {
    const canvas = document.getElementById('pdf-canvas');
    const context = canvas.getContext('2d');
    
    // Redraw the page to clear previous selection
    renderPage(currentPage);
    
    // Draw selection rectangle
    context.strokeStyle = '#007ACC';
    context.lineWidth = 2;
    context.setLineDash([5, 5]);
    context.strokeRect(
      Math.min(startX, endX),
      Math.min(startY, endY),
      Math.abs(endX - startX),
      Math.abs(endY - startY)
    );
  }
  
  async function extractSelectedText(startX, startY, endX, endY) {
    if (!pdfDoc) return;
    
    try {
      const page = await pdfDoc.getPage(currentPage);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale });
      
      // Convert canvas coordinates to PDF coordinates
      const pdfStartX = startX / scale;
      const pdfStartY = (viewport.height - startY) / scale;
      const pdfEndX = endX / scale;
      const pdfEndY = (viewport.height - endY) / scale;
      
      // Extract text within the selection bounds
      let selectedText = '';
      const selectedItems = [];
      
      textContent.items.forEach(item => {
        const transform = item.transform;
        const x = transform[4];
        const y = transform[5];
        const width = item.width;
        const height = item.height;
        
        // Check if text item intersects with selection
        if (x >= Math.min(pdfStartX, pdfEndX) && 
            x + width <= Math.max(pdfStartX, pdfEndX) &&
            y >= Math.min(pdfStartY, pdfEndY) && 
            y + height <= Math.max(pdfStartY, pdfEndY)) {
          selectedText += item.str + ' ';
          selectedItems.push(item);
        }
      });
      
      if (selectedText.trim()) {
        selectedTextInfo = {
          text: selectedText.trim(),
          page: currentPage,
          totalPages: totalPages,
          boundingRect: {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY)
          },
          pdfCoordinates: {
            x: Math.min(pdfStartX, pdfEndX),
            y: Math.min(pdfStartY, pdfEndY),
            width: Math.abs(pdfEndX - pdfStartX),
            height: Math.abs(pdfEndY - pdfStartY)
          }
        };
        
        showHighlightPreview = true;
      }
    } catch (err) {
      console.error('Error extracting text:', err);
    }
  }
  
  function toggleAddToHighlightsMode() {
    isAddToHighlightsMode = !isAddToHighlightsMode;
    if (!isAddToHighlightsMode) {
      hideHighlightPreview();
      // Redraw page to clear any selection rectangles
      if (pdfDoc) renderPage(currentPage);
    }
  }
  
  function hideHighlightPreview() {
    showHighlightPreview = false;
    selectedTextInfo = null;
    highlightNote = '';
    isFavorite = false;
  }
  
  async function createHighlight() {
    if (!selectedTextInfo || !pdfDocument) return;
    
    try {
      isCreatingHighlight = true;
      
      const highlightData = {
        document_id: pdfDocument.id,
        selected_text: selectedTextInfo.text,
        page_number: selectedTextInfo.page,
        user_note: highlightNote.trim() || undefined,
        color: highlightColorValue,
        is_favorite: isFavorite,
        x_coordinate: selectedTextInfo.pdfCoordinates.x,
        y_coordinate: selectedTextInfo.pdfCoordinates.y,
        width: selectedTextInfo.pdfCoordinates.width,
        height: selectedTextInfo.pdfCoordinates.height
      };
      
      await createDocumentHighlight(highlightData);
      
      // Reload document to get updated highlights
      await loadDocument();
      
      // Re-render current page with new highlight
      if (pdfDoc) await renderPage(currentPage);
      
      hideHighlightPreview();
      
    } catch (err) {
      console.error('Error creating highlight:', err);
      error = err instanceof Error ? err.message : 'Failed to create highlight';
    } finally {
      isCreatingHighlight = false;
    }
  }
  
  function nextPage() {
    if (currentPage < totalPages) {
      renderPage(currentPage + 1);
    }
  }
  
  function prevPage() {
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    }
  }
  
  function zoomIn() {
    scale = Math.min(scale * 1.2, 3);
    renderPage(currentPage);
  }
  
  function zoomOut() {
    scale = Math.max(scale / 1.2, 0.5);
    renderPage(currentPage);
  }
  
  // function renderDocumentViewer() {
  //   if (!pdfDocument) return;
    // {#if pdfDocument}
    //   {#if pdfDocument.file_type === 'pdf'}
    //     <div class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
    //       <!-- PDF Controls -->
    //       <div class="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
    //         <div class="flex items-center space-x-4">
    //           <div class="flex items-center space-x-2">
    //             <button on:click={prevPage} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
    //               ←
    //             </button>
    //             <span class="text-sm text-gray-300">
    //               Page {currentPage} of {totalPages}
    //             </span>
    //             <button on:click={nextPage} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
    //               →
    //             </button>
    //           </div>
              
    //           <div class="flex items-center space-x-2">
    //             <button on:click={zoomOut} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
    //               <ZoomOut class="w-4 h-4" />
    //             </button>
    //             <span class="text-sm text-gray-300">{Math.round(scale * 100)}%</span>
    //             <button on:click={zoomIn} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
    //               <ZoomIn class="w-4 h-4" />
    //             </button>
    //           </div>
    //         </div>
    //       </div>
          
          
    //       <div class="p-4 bg-gray-900 overflow-auto max-h-[800px]">
    //         <div class="flex justify-center">
    //           <canvas id="pdf-canvas" bind:this={canvasElement} class="border border-gray-600 shadow-lg max-w-full"></canvas>
    //         </div>
    //       </div>
    //     </div>
    //   {:else if pdfDocument.file_type === 'epub'}
    //     <div class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
    //       <BookOpen class="w-16 h-16 text-gray-400 mx-auto mb-4" />
    //       <h3 class="text-lg font-medium text-gray-200 mb-2">EPUB Viewer</h3>
    //       <p class="text-gray-400 mb-4">
    //         EPUB viewing is not yet fully implemented.
    //       </p>
    //       <a href={pdfDocument.cloudinary_url} target="_blank" class="btn-primary inline-flex items-center space-x-2">
    //         <Download class="w-4 h-4" />
    //         <span>Download EPUB</span>
    //       </a>
    //     </div>
    //   {/if}
    // {/if}
  // }
  
  // Make functions available globally for the HTML buttons
  if (browser) {
    window.nextPage = nextPage;
    window.prevPage = prevPage;
    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
  }
</script>

<svelte:head>
  <title>{pdfDocument?.title || 'Document'} - PKMS</title>
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
          {pdfDocument?.title || 'Loading...'}
        </h1>
        {#if pdfDocument}
          <p class="text-gray-400 text-sm">
            {pdfDocument.original_filename} • {pdfDocument.file_type.toUpperCase()}
            {#if pdfDocument.document_highlights?.length}
              • {pdfDocument.document_highlights.length} highlights
            {/if}
          </p>
        {/if}
      </div>
    </div>
    
    <div class="flex items-center space-x-3">
      {#if pdfDocument?.file_type === 'pdf'}
        <button
          on:click={toggleAddToHighlightsMode}
          class="btn-secondary flex items-center space-x-2 {isAddToHighlightsMode ? 'bg-yellow-600 text-white' : ''}"
        >
          {#if isAddToHighlightsMode}
            <EyeOff class="w-4 h-4" />
            <span>Exit Add to Highlights</span>
          {:else}
            <Plus class="w-4 h-4" />
            <span>Add to Highlights</span>
          {/if}
        </button>
      {/if}
      
      <a href="/documents/{documentId}/highlights" class="btn-secondary flex items-center space-x-2">
        <Eye class="w-4 h-4" />
        <span>View All Highlights</span>
      </a>
    </div>
  </div>
  
  <!-- Add to Highlights Mode Notice -->
  {#if isAddToHighlightsMode}
    <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
      <div class="flex items-center space-x-3">
        <Plus class="w-5 h-5 text-yellow-400" />
        <div>
          <p class="text-yellow-200 font-medium">Add to Highlights Mode Active</p>
          <p class="text-yellow-300 text-sm">Click and drag to select text in the document, then add it to your highlights</p>
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
  {:else if pdfDocument}
    <!-- Document Viewer -->
    <div class="relative">
      {#if pdfDocument}
      {#if pdfDocument.file_type === 'pdf'}
        <div class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <!-- PDF Controls -->
          <div class="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <button on:click={prevPage} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
                  ←
                </button>
                <span class="text-sm text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button on:click={nextPage} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
                  →
                </button>
              </div>
              
              <div class="flex items-center space-x-2">
                <button on:click={zoomOut} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
                  <ZoomOut class="w-4 h-4" />
                </button>
                <span class="text-sm text-gray-300">{Math.round(scale * 100)}%</span>
                <button on:click={zoomIn} class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded">
                  <ZoomIn class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          
          <div class="p-4 bg-gray-900 overflow-auto max-h-[800px]">
            <div class="flex justify-center">
              <canvas id="pdf-canvas" bind:this={canvasElement} class="border border-gray-600 shadow-lg max-w-full"></canvas>
            </div>
          </div>
        </div>
      {:else if pdfDocument.file_type === 'epub'}
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <BookOpen class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-200 mb-2">EPUB Viewer</h3>
          <p class="text-gray-400 mb-4">
            EPUB viewing is not yet fully implemented.
          </p>
          <a href={pdfDocument.cloudinary_url} target="_blank" class="btn-primary inline-flex items-center space-x-2">
            <Download class="w-4 h-4" />
            <span>Download EPUB</span>
          </a>
        </div>
      {/if}
    {/if}
    </div>
  {/if}
</div>

<!-- Highlight Preview Panel -->
{#if showHighlightPreview && selectedTextInfo}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={hideHighlightPreview}>
    <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-lg w-full mx-4" on:click|stopPropagation>
      <h3 class="text-lg font-medium text-gray-200 mb-4">Add to Highlights</h3>
      
      <!-- Selected Text Preview -->
      <div class="bg-gray-700 rounded-lg p-4 mb-4">
        <div class="text-xs text-gray-400 mb-2">
          Page {selectedTextInfo.page} of {selectedTextInfo.totalPages}
        </div>
        <p class="text-gray-300 text-sm leading-relaxed">
          "{selectedTextInfo.text}"
        </p>
      </div>
      
      <!-- Color Selection -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-200 mb-2">Highlight Color</label>
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
          on:click={hideHighlightPreview}
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
            <span>Adding...</span>
          {:else}
            <Plus class="w-4 h-4" />
            <span>Add to Highlights</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}