<!-- src/routes/documents/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, FileText, Calendar, Download, Trash2, Eye, Loader2, AlertCircle } from 'lucide-svelte';
  import { fetchDocuments, deleteDocument } from '$lib/api/document';
  import type { Document } from '$lib/types/document';
  import { formatFileSize } from '$lib/api/utils/document';
  import { documents } from '$lib/stores/document';
  
  let searchTerm = '';
  let filteredDocuments: Document[] = [];
  let isLoading = true;
  let error = '';
  let deleteConfirm = '';
  
  onMount(async () => {
    await loadDocuments();
  });
  
  async function loadDocuments() {
    try {
      isLoading = true;
      error = '';
      const data = await fetchDocuments();
      documents.set(data);
    } catch (err) {
      console.error('Error loading documents:', err);
      error = err instanceof Error ? err.message : 'Failed to load documents';
    } finally {
      isLoading = false;
    }
  }
  
  async function handleDelete(doc: Document) {
    if (deleteConfirm !== doc.id) {
      deleteConfirm = doc.id;
      return;
    }
    
    try {
      await deleteDocument(doc.id);
      await loadDocuments();
      deleteConfirm = '';
    } catch (err) {
      console.error('Error deleting document:', err);
      error = err instanceof Error ? err.message : 'Failed to delete document';
    }
  }
  
  async function handleRetry() {
    await loadDocuments();
  }
  
  // Reactive filtering
  $: {
    filteredDocuments = $documents.filter(doc => {
      if (!searchTerm) return true;
      
      const term = searchTerm.toLowerCase();
      return (
        doc.title.toLowerCase().includes(term) ||
        doc.original_filename.toLowerCase().includes(term) ||
        doc.file_type.toLowerCase().includes(term)
      );
    });
  }
</script>

<svelte:head>
  <title>Documents - PKMS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Documents</h1>
      <p class="text-gray-400 mt-1">
        {#if isLoading}
          Loading documents...
        {:else if error}
          Error loading documents
        {:else}
          {filteredDocuments.length} documents found
        {/if}
      </p>
    </div>
    
    <a href="/documents/new" class="btn-primary flex items-center space-x-2">
      <Plus class="w-4 h-4" />
      <span>Upload Document</span>
    </a>
  </div>
  
  <!-- Search -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search documents by title, filename, or type..."
      bind:value={searchTerm}
      disabled={isLoading}
      class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
  
  <!-- Loading State -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3 text-gray-400">
        <Loader2 class="w-6 h-6 animate-spin" />
        <span>Loading documents...</span>
      </div>
    </div>
  
  <!-- Error State -->
  {:else if error}
    <div class="card p-6 text-center">
      <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-200 mb-2">Failed to load documents</h3>
      <p class="text-gray-400 mb-4">{error}</p>
      <button
        on:click={handleRetry}
        class="btn-primary"
      >
        Try Again
      </button>
    </div>
  
  <!-- Documents Grid -->
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each filteredDocuments as doc (doc.id)}
        <div class="card p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-yellow-600 flex flex-col h-full">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <FileText class="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-semibold text-yellow-600 truncate" title={doc.title}>
                  {doc.title}
                </h3>
                <p class="text-sm text-gray-400 truncate" title={doc.original_filename}>
                  {doc.original_filename}
                </p>
              </div>
            </div>
            
            <div class="flex items-center space-x-2 flex-shrink-0">
              <span class="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full uppercase">
                {doc.file_type}
              </span>
            </div>
          </div>
          
          <!-- Metadata -->
          <div class="space-y-2 mb-4 flex-1">
            <div class="flex items-center justify-between text-sm text-gray-400">
              <span>Size:</span>
              <span>{formatFileSize(doc.file_size)}</span>
            </div>
            
            {#if doc.total_pages}
              <div class="flex items-center justify-between text-sm text-gray-400">
                <span>Pages:</span>
                <span>{doc.total_pages}</span>
              </div>
            {/if}
            
            <div class="flex items-center justify-between text-sm text-gray-400">
              <span>Highlights:</span>
              <span>{doc.document_highlights?.length || 0}</span>
            </div>
            
            <div class="flex items-center justify-between text-sm text-gray-400">
              <div class="flex items-center space-x-1">
                <Calendar class="w-3 h-3" />
                <span>Uploaded:</span>
              </div>
              <span>{doc.upload_date.toLocaleDateString()}</span>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center space-x-2 pt-4 border-t border-gray-700">
            <a 
              href="/documents/{doc.id}"
              class="flex-1 btn-secondary flex items-center justify-center space-x-2 text-sm"
            >
              <Eye class="w-4 h-4" />
              <span>View</span>
            </a>
            
            <a 
              href={doc.cloudinary_url}
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary flex items-center justify-center p-2"
              title="Download"
            >
              <Download class="w-4 h-4" />
            </a>
            
            <button
              on:click={() => handleDelete(doc)}
              class="btn-danger flex items-center justify-center p-2"
              title={deleteConfirm === doc.id ? 'Click again to confirm' : 'Delete'}
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      {/each}
      
      {#if filteredDocuments.length === 0}
        <div class="col-span-full text-center py-12">
          <FileText class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-400 mb-2">No documents found</h3>
          <p class="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by uploading your first document'}
          </p>
          <a href="/documents/new" class="btn-primary inline-flex items-center space-x-2">
            <Plus class="w-4 h-4" />
            <span>Upload Document</span>
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>

