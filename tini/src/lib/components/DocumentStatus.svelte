<!-- src/lib/components/DocumentStatus.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-svelte';
//   import { fetchDocumentStatus } from '$lib/api/documents';
  import type { Document } from '$lib/types/document';
    import { fetchDocumentStatus } from '$lib/api/document';

  export let userDocument: Document;
  export let onStatusChange: ((status: string) => void) | undefined = undefined;

  let status = userDocument.processing_status;
  let message = '';
  let isPolling = false;
  let pollInterval: number | undefined;

  const statusConfig = {
    UPLOADED: {
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
      title: 'Uploaded',
      description: 'Document uploaded successfully'
    },
    PROCESSING: {
      icon: Loader2,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      title: 'Processing',
      description: 'Converting document to HTML...'
    },
    COMPLETED: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      title: 'Ready',
      description: 'Document is ready for viewing and highlighting'
    },
    FAILED: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      title: 'Failed',
      description: 'Processing failed - document may still be viewable'
    },
    ERROR: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      title: 'Error',
      description: 'An error occurred during processing'
    }
  };

  $: config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UPLOADED;
  $: shouldPoll = status === 'PROCESSING' || status === 'UPLOADED';

  onMount(() => {
    if (shouldPoll) {
      startPolling();
    }
  });

  onDestroy(() => {
    stopPolling();
  });

  function startPolling() {
    if (isPolling) return;
    
    isPolling = true;
    pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetchDocumentStatus(userDocument.id);
        const newStatus = statusResponse.status;
        
        if (newStatus !== status) {
          status = newStatus;
          message = statusResponse.message || '';
          onStatusChange?.(newStatus);
          
          // Stop polling if processing is complete
          if (newStatus === 'COMPLETED' || newStatus === 'FAILED' || newStatus === 'ERROR') {
            stopPolling();
          }
        }
      } catch (error) {
        console.error('Error polling document status:', error);
        // Continue polling even if there's an error
      }
    }, 3000); // Poll every 3 seconds
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = undefined;
    }
    isPolling = false;
  }

  $: if (shouldPoll && !isPolling) {
    startPolling();
  } else if (!shouldPoll && isPolling) {
    stopPolling();
  }
</script>

<div class="flex items-center space-x-3 p-4 rounded-lg border {config.bgColor} border-gray-600">
  <div class="flex-shrink-0">
    <svelte:component 
      this={config.icon} 
      class="w-5 h-5 {config.color} {status === 'PROCESSING' ? 'animate-spin' : ''}" 
    />
  </div>
  
  <div class="flex-1 min-w-0">
    <div class="flex items-center space-x-2">
      <h3 class="text-sm font-medium text-gray-200">
        {config.title}
      </h3>
      {#if status === 'PROCESSING'}
        <div class="flex space-x-1">
          <div class="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
          <div class="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
          <div class="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
        </div>
      {/if}
    </div>
    
    <p class="text-xs text-gray-400 mt-1">
      {message || config.description}
    </p>
    
    {#if status === 'PROCESSING'}
      <p class="text-xs text-gray-500 mt-1">
        This may take a few minutes depending on document size...
      </p>
    {/if}
  </div>
  
  {#if userDocument.file_type === 'pdf' && status !== 'COMPLETED'}
    <div class="flex-shrink-0">
      <span class="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
        PDF Processing Required
      </span>
    </div>
  {/if}
</div>