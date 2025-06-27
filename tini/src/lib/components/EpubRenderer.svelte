<script lang="ts">
  import { onMount, createEventDispatcher, onDestroy } from 'svelte';
  import { ChevronLeft, ChevronRight, Book, List, AlertCircle, Loader2 } from 'lucide-svelte'; // Added AlertCircle, Loader2
  // import { parseEpubContent, type EpubChapter, type EpubMetadata } from '$lib/utils/epubParser';
  import { applyHighlights, getTextSelection, clearSelection, type SelectionInfo } from '$lib/api/utils/textSelection'; // Assuming you have this utility
  import { browser } from '$app/environment'; // Check if in browser environment
    import { parseEpubContent, type EpubChapter, type EpubMetadata } from '$lib/api/utils/epubParser';

  export let epubContent: string = '';
  export let highlights: any[] = []; // Type this more specifically, e.g., DocumentHighlight[]
  export let isHighlightMode: boolean = false;
  export let zoomLevel: number = 100;
  export let fontFamily: string = 'system'; // 'system', 'serif', 'sans-serif', etc.
  export let lineHeight: number = 1.6;

  const dispatch = createEventDispatcher();

  let chapters: EpubChapter[] = [];
  let metadata: EpubMetadata = {};
  let currentChapterIndex = 0;
  let showTableOfContents = false;
  let epubContainer: HTMLElement; // Reference to the main content div
  let contentError: string = '';
  let isLoadingContent: boolean = true;
  let hasTextSelection: boolean = false; // To enable highlight button in parent
  let currentSelection: SelectionInfo | null = null; // To pass selection details

  onMount(() => {
    parseContent();
    if (browser) { // Only add listeners in browser
      document.addEventListener('mouseup', handleTextSelection);
      document.addEventListener('keyup', handleTextSelection);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('keyup', handleTextSelection);
    }
  });

  $: currentChapter = chapters[currentChapterIndex];
  $: {
    // Reactively process content when chapter or highlights change
    if (currentChapter) {
      processedContent = processChapterContent(currentChapter.content, highlights);
    } else {
      processedContent = '';
    }
  }

  // Reactive styles for the content container
  $: contentStyles = `
    font-size: ${zoomLevel / 100 * 16}px; /* Base font size, adjust as needed */
    font-family: ${fontFamily === 'system' ? 'var(--font-sans, sans-serif)' : fontFamily};
    line-height: ${lineHeight};
  `;

  async function parseContent() { // Changed to async if parseEpubContent could be async
    isLoadingContent = true;
    contentError = '';
    try {
      // Assuming parseEpubContent might be asynchronous or large, await it
      const parsed = await parseEpubContent(epubContent);
      chapters = parsed.chapters;
      metadata = parsed.metadata;

      console.log('Parsed EPUB:', { chapters: chapters.length, metadata });

      if (chapters.length === 0) {
        contentError = 'No readable content found in EPUB.';
      }

    } catch (error) {
      console.error('Error parsing EPUB content:', error);
      contentError = error instanceof Error ? error.message : 'Failed to parse EPUB content.';
      // Fallback to raw content if parsing fails completely
      chapters = [{
        id: 'chapter-1',
        title: 'Document Content',
        content: epubContent, // Use raw epubContent here as a last resort
        order: 1
      }];
    } finally {
      isLoadingContent = false;
    }
  }

  // This function now also takes highlights to apply them
  function processChapterContent(content: string, chapterHighlights: any[]): string {
    let finalContent = content;

    // Convert plain text to HTML with proper structure if it's just plain text
    if (!content.includes('<') && !content.includes('>')) { // Simple check for plain text
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
      finalContent = paragraphs.map((p, index) =>
        `<p id="para-${index}" class="mb-4">${p.trim().replace(/\n/g, '<br>')}</p>`
      ).join('');
    }

    // Parse the content (whether original HTML or newly generated paragraphs)
    const parser = new DOMParser();
    const doc = parser.parseFromString(finalContent, 'text/html');

    // Add IDs to elements if they don't have one (crucial for highlighting)
    const elements = doc.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
    elements.forEach((el, index) => {
      if (!el.id) {
        el.id = `epub-content-${currentChapterIndex}-${index}`;
      }
    });

    // Apply highlights to the content
    // Assumes applyHighlights is a utility function similar to what you'd use for PDFs
    finalContent = applyHighlights(doc.body.innerHTML, chapterHighlights.map(h => ({
        id: h.id, // Assuming highlight objects have an 'id'
        color: h.color,
        selected_text: h.selected_text,
        // Potentially filter highlights relevant to this chapter based on offsets/containers
        // For EPUB, you might need to map highlight ranges to specific chapter content.
        // This can be complex and might require storing chapter context in the highlight itself.
        // For simplicity, applying all highlights and letting applyHighlights figure it out.
    })));

    return finalContent;
  }

  function nextChapter() {
    if (currentChapterIndex < chapters.length - 1) {
      currentChapterIndex++;
      clearSelection(); // Clear selection when navigating
      dispatch('chapterChange', { chapterIndex: currentChapterIndex });
    }
  }

  function prevChapter() {
    if (currentChapterIndex > 0) {
      currentChapterIndex--;
      clearSelection(); // Clear selection when navigating
      dispatch('chapterChange', { chapterIndex: currentChapterIndex });
    }
  }

  function selectChapter(index: number) {
    currentChapterIndex = index;
    showTableOfContents = false; // Hide TOC after selection
    clearSelection(); // Clear selection when navigating
    dispatch('chapterChange', { chapterIndex: currentChapterIndex });
  }

  function handleTextSelection() {
    if (!isHighlightMode) {
      hasTextSelection = false;
      return;
    }
    // Only check selection if the highlight mode is active
    if (epubContainer) {
      // Ensure the selection is within the epubContainer
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (epubContainer.contains(range.commonAncestorContainer)) {
          currentSelection = getTextSelection(epubContainer); // Pass container for context
          hasTextSelection = !!currentSelection?.selectedText;
          if (hasTextSelection) {
            dispatch('textSelected', currentSelection);
          }
        } else {
          hasTextSelection = false;
          currentSelection = null;
          dispatch('textSelected', null); // Dispatch null if selection is outside
        }
      } else {
        hasTextSelection = false;
        currentSelection = null;
        dispatch('textSelected', null);
      }
    }
  }

  // Exposed function for parent to clear selection (e.g., after highlight creation)
  export function clearEpubSelection() {
    clearSelection();
    hasTextSelection = false;
    currentSelection = null;
  }

  // --- UI Elements ---
</script>

<div class="epub-renderer-container flex flex-col h-full bg-gray-900 text-gray-200">
  <div class="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
    <button
      on:click={prevChapter}
      disabled={currentChapterIndex === 0}
      class="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronLeft class="w-5 h-5" />
    </button>

    <div class="flex-1 text-center truncate px-4">
      {#if currentChapter}
        <h2 class="text-lg font-semibold truncate">{currentChapter.title || 'Untitled Chapter'}</h2>
        <p class="text-sm text-gray-400">Chapter {currentChapterIndex + 1} of {chapters.length}</p>
      {:else}
        <h2 class="text-lg font-semibold">No Chapter Loaded</h2>
      {/if}
    </div>

    <div class="flex items-center space-x-2">
      <button
        on:click={() => showTableOfContents = !showTableOfContents}
        class="p-2 rounded-full hover:bg-gray-700 transition-colors"
        aria-label="Toggle Table of Contents"
      >
        <List class="w-5 h-5" />
      </button>
      <button
        on:click={nextChapter}
        disabled={currentChapterIndex === chapters.length - 1}
        class="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>
  </div>

  <div class="relative flex-1 overflow-hidden">
    {#if isLoadingContent}
      <div class="flex items-center justify-center h-full text-gray-400">
        <Loader2 class="w-8 h-8 animate-spin mr-3" />
        <span>Loading EPUB content...</span>
      </div>
    {:else if contentError}
      <div class="flex flex-col items-center justify-center h-full text-red-400 text-center p-4">
        <AlertCircle class="w-12 h-12 mb-4" />
        <h3 class="text-xl font-semibold mb-2">Error Loading Content</h3>
        <p class="text-lg">{contentError}</p>
        {#if chapters.length > 0 && !currentChapter}
          <p class="mt-2 text-sm text-gray-500">Perhaps try navigating to another chapter?</p>
        {/if}
      </div>
    {:else if !currentChapter}
       <div class="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4">
        <Book class="w-12 h-12 mb-4" />
        <h3 class="text-xl font-semibold mb-2">No Chapter Selected</h3>
        <p class="text-lg">Use the table of contents to select a chapter.</p>
      </div>
    {:else}
      <div class="p-6 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
           bind:this={epubContainer}
           style={contentStyles}
           class:highlight-mode={isHighlightMode}
      >
        {@html processedContent}
      </div>
    {/if}

    {#if showTableOfContents}
      <div class="absolute inset-y-0 right-0 w-80 bg-gray-800 border-l border-gray-700 shadow-lg p-4 overflow-y-auto z-20">
        <h3 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Table of Contents</h3>
        <nav>
          <ul>
            {#each chapters as chapter, i}
              <li>
                <button
                  on:click={() => selectChapter(i)}
                  class="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-700 transition-colors truncate
                         {i === currentChapterIndex ? 'bg-gray-700 text-yellow-400 font-medium' : ''}"
                >
                  {chapter.title || `Chapter ${i + 1}`}
                </button>
              </li>
            {/each}
          </ul>
        </nav>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Basic styling for content within the epubContainer */
  .epub-renderer-container {
    /* Set a default font size to scale from */
    font-size: 1rem;
  }

  .epub-renderer-container :global(p),
  .epub-renderer-container :global(div),
  .epub-renderer-container :global(span),
  .epub-renderer-container :global(h1),
  .epub-renderer-container :global(h2),
  .epub-renderer-container :global(h3),
  .epub-renderer-container :global(h4),
  .epub-renderer-container :global(h5),
  .epub-renderer-container :global(h6) {
    /* Apply base text styles, allow override by inline styles */
    color: inherit; /* Inherit text color from parent */
    margin-bottom: 1em; /* Add some spacing */
    max-width: 65ch; /* Optimal line length for readability */
    margin-left: auto;
    margin-right: auto;
  }

  /* Specific styles for highlighting */
  .epub-renderer-container.highlight-mode :global(*::selection) {
    background-color: rgba(255, 255, 0, 0.4); /* Yellow tint for selection in highlight mode */
    color: inherit; /* Maintain original text color */
  }

  /* Styling for applied highlights (assuming applyHighlights wraps text in <mark> or <span> with a class) */
  .epub-renderer-container :global(.highlighted-text) {
    background-color: rgba(255, 255, 0, 0.3); /* Default highlight color */
    border-radius: 2px;
    padding: 0 2px;
  }
  /* Example for specific highlight colors if you pass them via classes */
  .epub-renderer-container :global(.highlight-yellow) { background-color: rgba(255, 255, 0, 0.3); }
  .epub-renderer-container :global(.highlight-green) { background-color: rgba(0, 255, 0, 0.3); }
  /* ... more colors */

  /* Customize scrollbar */
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: var(--tw-scrollbar-thumb, #4b5563); /* gray-700 */
    border-radius: 4px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background-color: var(--tw-scrollbar-track, #111827); /* gray-900 */
  }

  /* Firefox */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: var(--tw-scrollbar-thumb, #4b5563) var(--tw-scrollbar-track, #111827);
  }
</style>