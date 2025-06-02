<!-- src/routes/highlights/[id]/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { ArrowLeft, BookOpen, Edit, Plus, FileText } from 'lucide-svelte';
  import { highlights, notes } from '$lib/stores';
  import CreateNoteModal from '$lib/components/CreateNoteModal.svelte';
  import NoteCard from '$lib/components/NoteCard.svelte';
  import type { Highlight, Note } from '$lib/types';
  
  let highlight: Highlight | undefined;
  let relatedNotes: Note[] = [];
  let showCreateNoteModal = false;
  let selectedText = '';
  let highlightContentElement: HTMLElement;
  let selectionTimeout: number;
  
  // Get highlight ID from URL
  $: highlightId = $page.params.id;
  
  // Find the highlight
  $: highlight = $highlights.find(h => h.id === highlightId);
  
  // Find notes created from this highlight
  $: relatedNotes = $notes.filter(note => note.highlights_id === highlightId);
  
  onMount(() => {
    console.log('Component mounted, setting up text selection handling');
    // Set up text selection handling with debounce
    document.addEventListener('selectionchange', handleSelectionChangeDebounced);
    
    return () => {
      console.log('Component unmounting, cleaning up event listeners');
      document.removeEventListener('selectionchange', handleSelectionChangeDebounced);
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  });
  
  function handleSelectionChangeDebounced() {
    // Clear previous timeout
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
    }
    
    // Debounce the selection change to avoid excessive calls
    selectionTimeout = setTimeout(() => {
      handleSelectionChange();
    }, 100);
  }
  
  function handleSelectionChange() {
    // Skip if modal is open to prevent interference
    if (showCreateNoteModal) {
      console.log('Modal is open, skipping selection change');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      if (selectedText) {
        console.log('Selection cleared');
        selectedText = '';
      }
      return;
    }
    
    const range = selection.getRangeAt(0);
    const newSelectedText = selection.toString().trim();
    
    // Only process if we have actual text selected
    if (!newSelectedText) {
      if (selectedText) {
        console.log('Empty selection, clearing');
        selectedText = '';
      }
      return;
    }
    
    // Check if selection is within the highlight content
    if (highlightContentElement) {
      let isWithinContent = false;
      
      try {
        // Check if the selection is within our content element
        const commonAncestor = range.commonAncestorContainer;
        isWithinContent = highlightContentElement.contains(commonAncestor) || 
                         highlightContentElement === commonAncestor;
      } catch (error) {
        console.warn('Error checking selection bounds:', error);
        isWithinContent = false;
      }
      
      if (isWithinContent && newSelectedText !== selectedText) {
        selectedText = newSelectedText;
        console.log('Text selected within content:', selectedText);
        console.log('Selected text length:', selectedText.length);
      } else if (!isWithinContent && selectedText) {
        console.log('Selection outside highlight content, clearing selection');
        selectedText = '';
      }
    }
  }
  
  function handleCreateNote() {
    console.log('Create note button clicked');
    console.log('Selected text:', selectedText);
    console.log('Highlight:', highlight);
    
    if (selectedText && highlight) {
      console.log('Opening create note modal');
      showCreateNoteModal = true;
      
      // Temporarily disable selection handling while modal is open
      document.removeEventListener('selectionchange', handleSelectionChangeDebounced);
    } else {
      console.warn('Cannot create note - missing selectedText or highlight');
    }
  }
  
  function handleNoteCreated(event: CustomEvent<Note>) {
    console.log('Note created event received:', event.detail);
    const newNote = event.detail;
    notes.update(current => {
      console.log('Updating notes store, current count:', current.length);
      return [...current, newNote];
    });
    
    // Close modal and cleanup
    closeModal();
  }
  
  function handleModalClose() {
    console.log('Modal close event received');
    closeModal();
  }
  
  function closeModal() {
    showCreateNoteModal = false;
    selectedText = '';
    
    // Clear any existing selection
    try {
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.warn('Error clearing selection:', error);
    }
    
    // Re-enable selection handling after a brief delay
    setTimeout(() => {
      document.addEventListener('selectionchange', handleSelectionChangeDebounced);
      console.log('Selection handling re-enabled');
    }, 100);
    
    console.log('Modal closed and selection cleared');
  }
  
  function goBack() {
    console.log('Going back');
    history.back();
  }
  
  // Handle clicks outside of content to clear selection
  function handleDocumentClick(event: MouseEvent) {
    if (showCreateNoteModal) return;
    
    const target = event.target as HTMLElement;
    if (highlightContentElement && !highlightContentElement.contains(target)) {
      // Clicked outside content area
      if (selectedText) {
        console.log('Clicked outside content, clearing selection');
        selectedText = '';
        try {
          window.getSelection()?.removeAllRanges();
        } catch (error) {
          console.warn('Error clearing selection on outside click:', error);
        }
      }
    }
  }
  
  onMount(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<svelte:head>
  <title>{highlight ? `${highlight.book_title} - Highlights` : 'Highlight'} - PKMS</title>
</svelte:head>

{#if highlight}
  <div class="flex h-full flex-col">
    <!-- Fixed Header -->
    <div class="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            on:click={goBack}
            class="p-2 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div class="flex items-center space-x-3">
            <BookOpen class="w-8 h-8 text-yellow-600" />
            <div>
              <h1 class="text-2xl font-bold text-yellow-600">{highlight.book_title}</h1>
              {#if highlight.author}
                <p class="text-gray-400">by {highlight.author}</p>
              {/if}
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          {#if selectedText}
            <button
              on:click={handleCreateNote}
              class="btn-primary flex items-center space-x-2"
            >
              <Plus class="w-4 h-4" />
              <span>Create Note</span>
            </button>
          {/if}
          <a
            href="/highlights/{highlight.id}/edit"
            class="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
            aria-label="Edit highlight"
          >
            <Edit class="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Main Content -->
      <div class="flex-1 px-6 py-6 overflow-y-auto">
        <div class="space-y-6">
          <!-- Selection Instructions -->
          <div class="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <FileText class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 class="text-sm font-medium text-yellow-600 mb-1">Create Notes from Text</h3>
                <p class="text-sm text-gray-300">
                  Select any portion of the text below and click "Create Note" to turn it into a note with tags and comments.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Highlight Content -->
          <div class="card p-6">
            <div 
              bind:this={highlightContentElement}
              class="prose prose-invert max-w-none text-gray-300 leading-relaxed"
              style="user-select: text; -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text;"
            >
              {@html highlight.content}
            </div>
          </div>
          
          <!-- Metadata -->
          <div class="card p-4">
            <div class="flex items-center justify-between text-sm text-gray-400">
              <div class="flex items-center space-x-4">
                <span>Added: {highlight.created_at.toLocaleDateString()}</span>
                <span>•</span>
                <span>Words: {Math.ceil(highlight.content.replace(/<[^>]*>/g, '').length / 5)}</span>
              </div>
              <div>
                <span>{relatedNotes.length} notes created</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Sidebar - Related Notes -->
      <div class="w-80 border-l border-gray-700 pl-6 py-6 overflow-y-auto">
        <div class="sticky top-0 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-200">Related Notes</h2>
            <span class="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {relatedNotes.length}
            </span>
          </div>
          
          <div class="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {#each relatedNotes as note (note.id)}
              <div class="transform scale-90 origin-top-left">
                <NoteCard {note} compact={true} />
              </div>
            {:else}
              <div class="text-center py-8">
                <FileText class="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p class="text-sm text-gray-400 mb-2">No notes yet</p>
                <p class="text-xs text-gray-500">
                  Select text and create your first note
                </p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Create Note Modal -->
  {#if showCreateNoteModal && selectedText && highlight}
    <CreateNoteModal
      {selectedText}
      source={highlight.book_title}
      highlightId={highlight.id}
      on:noteCreated={handleNoteCreated}
      on:close={handleModalClose}
    />
  {/if}
{:else}
  <div class="flex items-center justify-center h-64">
    <div class="text-center">
      <BookOpen class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-gray-400 mb-2">Highlight not found</h2>
      <p class="text-gray-500 mb-4">The highlight you're looking for doesn't exist.</p>
      <a href="/highlights" class="btn-primary">
        Back to Highlights
      </a>
    </div>
  </div>
{/if}