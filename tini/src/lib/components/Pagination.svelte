<!-- src/lib/components/Pagination.svelte -->
<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let currentPage: number = 1;
  export let totalPages: number = 1;
  export let hasNext: boolean = false;
  export let hasPrev: boolean = false;
  export let total: number = 0;
  export let itemsPerPage: number = 20;

  const dispatch = createEventDispatcher<{
    pageChange: { page: number };
  }>();

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      dispatch('pageChange', { page });
    }
  }

  function getVisiblePages() {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  $: visiblePages = getVisiblePages();
  $: startItem = (currentPage - 1) * itemsPerPage + 1;
  $: endItem = Math.min(currentPage * itemsPerPage, total);
</script>

<div class="bg-gray-800 border-t border-gray-600 px-6 py-4 sticky bottom-0">
  <div class="flex items-center justify-between">
    <!-- Results info -->
    <div class="text-sm text-gray-400">
      Showing {startItem} to {endItem} of {total} notes
    </div>
    
    <!-- Pagination controls -->
    <div class="flex items-center space-x-2">
      <!-- Previous button -->
      <button
        on:click={() => goToPage(currentPage - 1)}
        disabled={!hasPrev}
        class="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
      >
        <ChevronLeft class="w-4 h-4 mr-1" />
        Previous
      </button>
      
      <!-- Page numbers -->
      <div class="flex items-center space-x-1">
        {#each visiblePages as page}
          {#if page === -1 || page === -2}
            <span class="px-3 py-2 text-gray-500">...</span>
          {:else}
            <button
              on:click={() => goToPage(page)}
              class="px-3 py-2 text-sm font-medium border rounded-md transition-colors {
                page === currentPage
                  ? 'bg-yellow-600 text-white border-yellow-600'
                  : 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600'
              }"
            >
              {page}
            </button>
          {/if}
        {/each}
      </div>
      
      <!-- Next button -->
      <button
        on:click={() => goToPage(currentPage + 1)}
        disabled={!hasNext}
        class="flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
      >
        Next
        <ChevronRight class="w-4 h-4 ml-1" />
      </button>
    </div>
  </div>
</div>