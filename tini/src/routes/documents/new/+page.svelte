<!-- src/routes/documents/new/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-svelte';
  import { uploadDocument } from '$lib/api/document';
    import { isValidDocumentFile, validateFileSize, getFileType, formatFileSize } from '$lib/api/utils/document';

  
  let title = '';
  let selectedFile: File | null = null;
  let isDragOver = false;
  let isUploading = false;
  let error = '';
  let uploadProgress = 0;
  
  let fileInput: HTMLInputElement;
  
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }
  
  function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }
  
  function processFile(file: File) {
    // Reset error
    error = '';
    
    // Validate file type
    if (!isValidDocumentFile(file)) {
      error = 'Please select a valid PDF or EPUB file';
      return;
    }
    
    // Validate file size (5MB limit)
    if (!validateFileSize(file, 5)) {
      error = 'File size must be less than 5MB';
      return;
    }
    
    selectedFile = file;
    
    // Auto-generate title from filename if not set
    if (!title) {
      title = file.name.replace(/\.(pdf|epub)$/i, '');
    }
  }
  
  function removeFile() {
    selectedFile = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }
  
  async function handleSubmit() {
    if (!selectedFile || !title.trim()) {
      error = 'Please provide both a title and select a file';
      return;
    }
    
    try {
      isUploading = true;
      error = '';
      uploadProgress = 0;
      
      // Simulate upload progress (since we can't track real progress easily)
      const progressInterval = setInterval(() => {
        uploadProgress = Math.min(uploadProgress + 10, 90);
      }, 200);
      
      const document = await uploadDocument({
        title: title.trim(),
        file: selectedFile
      });
      
      clearInterval(progressInterval);
      uploadProgress = 100;
      
      // Navigate to the uploaded document
      setTimeout(() => {
        goto(`/documents/${document.id}`);
      }, 500);
      
    } catch (err) {
      console.error('Upload error:', err);
      error = err instanceof Error ? err.message : 'Failed to upload document';
      uploadProgress = 0;
    } finally {
      isUploading = false;
    }
  }
</script>

<svelte:head>
  <title>Upload Document - PKMS</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-200 mb-2">Upload Document</h1>
    <p class="text-gray-400">
      Upload PDF or EPUB files to your personal knowledge management system
    </p>
  </div>
  
  <!-- Upload Form -->
  <div class="card p-8">
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Title Input -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-200 mb-2">
          Document Title
        </label>
        <input
          id="title"
          type="text"
          bind:value={title}
          placeholder="Enter document title..."
          required
          class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
        />
      </div>
      
      <!-- File Upload Area -->
      <div>
        <label class="block text-sm font-medium text-gray-200 mb-2">
          Document File
        </label>
        
        {#if selectedFile}
          <!-- Selected File Display -->
          <div class="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <FileText class="w-8 h-8 text-yellow-600" />
                <div>
                  <p class="text-gray-200 font-medium">{selectedFile.name}</p>
                  <p class="text-gray-400 text-sm">
                    {formatFileSize(selectedFile.size)} • {getFileType(selectedFile.name).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                on:click={removeFile}
                class="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
        {:else}
          <!-- File Drop Zone -->
          <div
            class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center transition-colors {isDragOver ? 'border-yellow-600 ' : 'hover:border-gray-500'}"
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleFileDrop}
          >
            <Upload class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-200 mb-2">
              Drag and drop your document here, or
              <button
                type="button"
                on:click={() => fileInput.click()}
                class="text-yellow-600 hover:text-yellow-500 underline"
              >
                browse to select
              </button>
            </p>
            <p class="text-gray-400 text-sm">
              Supports PDF and EPUB files up to 5MB
            </p>
            
            <input
              bind:this={fileInput}
              type="file"
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              on:change={handleFileSelect}
              class="hidden"
            />
          </div>
        {/if}
      </div>
      
      <!-- Error Display -->
      {#if error}
        <div class="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle class="w-5 h-5 text-red-400 flex-shrink-0" />
          <p class="text-red-200">{error}</p>
        </div>
      {/if}
      
      <!-- Upload Progress -->
      {#if isUploading}
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-200">Uploading...</span>
            <span class="text-gray-400">{uploadProgress}%</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div 
              class=" h-2 rounded-full transition-all duration-300"
              style="width: {uploadProgress}%"
            ></div>
          </div>
        </div>
      {/if}
      
      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-4">
        <a 
          href="/documents"
          class="btn-secondary"
        >
          Cancel
        </a>
        
        <button
          type="submit"
          disabled={!selectedFile || !title.trim() || isUploading}
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {#if isUploading}
            <Upload class="w-4 h-4 animate-pulse" />
            <span>Uploading...</span>
          {:else}
            <CheckCircle class="w-4 h-4" />
            <span>Upload Document</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
  
  <!-- Help Text -->
  <div class="card p-6 bg-gray-800/50">
    <h3 class="text-lg font-medium text-gray-200 mb-3">Upload Guidelines</h3>
    <ul class="space-y-2 text-gray-400">
      <li class="flex items-start space-x-2">
        <span class="text-yellow-600 mt-1">•</span>
        <span>Supported formats: PDF and EPUB files only</span>
      </li>
      <li class="flex items-start space-x-2">
        <span class="text-yellow-600 mt-1">•</span>
        <span>Maximum file size: 5MB per document</span>
      </li>
      <li class="flex items-start space-x-2">
        <span class="text-yellow-600 mt-1">•</span>
        <span>Documents will be stored securely and can be highlighted and annotated</span>
      </li>
      <li class="flex items-start space-x-2">
        <span class="text-yellow-600 mt-1">•</span>
        <span>You can edit the document title after upload if needed</span>
      </li>
    </ul>
  </div>
</div>

<style>
  /* .btn-primary {
    @apply   text-white font-medium px-6 py-3 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium px-6 py-3 rounded-lg transition-colors;
  }
  
  .card {
    @apply bg-gray-800 border border-gray-700 rounded-lg;
  } */
</style>