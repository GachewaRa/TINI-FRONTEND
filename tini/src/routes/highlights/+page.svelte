<!-- src/routes/highlights/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, BookOpen, Calendar, AlertCircle, Loader2 } from 'lucide-svelte';
  import { highlights } from '$lib/stores';
  import { fetchHighlights } from '$lib/api/highlights';
  import type { Highlight } from '$lib/types';
  
  let searchTerm = '';
  let filteredHighlights: Highlight[] = [];
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    await loadHighlights();
  });
  
  async function loadHighlights() {
    try {
      isLoading = true;
      error = '';
      const data = await fetchHighlights();
       console.log("ALL HIGHLIGHTS", data)
      highlights.set(data);
      
    } catch (err) {
      console.error('Error loading highlights:', err);
      error = err instanceof Error ? err.message : 'Failed to load highlights';
    } finally {
      isLoading = false;
    }
  }
  
  async function handleRetry() {
    await loadHighlights();
  }
  
  // Function to strip HTML tags and get clean text
  function stripHtml(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  }
  
  // Reactive filtering
  $: {
    filteredHighlights = $highlights.filter(highlight => {
      if (!searchTerm) return true;
     
      const term = searchTerm.toLowerCase();
      return (
        highlight.book_title.toLowerCase().includes(term) ||
        highlight.author?.toLowerCase().includes(term) ||
        highlight.content.toLowerCase().includes(term)
      );
    });
  }
</script>

<svelte:head>
  <title>Highlights - PKMS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Highlights</h1>
      <p class="text-gray-400 mt-1">
        {#if isLoading}
          Loading highlights...
        {:else if error}
          Error loading highlights
        {:else}
          {filteredHighlights.length} highlights found
        {/if}
      </p>
    </div>
    
    <a href="/highlights/new" class="btn-primary flex items-center space-x-2">
      <Plus class="w-4 h-4" />
      <span>New Highlight</span>
    </a>
  </div>
  
  <!-- Search -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search highlights by title, author, or content..."
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
        <span>Loading highlights...</span>
      </div>
    </div>
  
  <!-- Error State -->
  {:else if error}
    <div class="card p-6 text-center">
      <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-200 mb-2">Failed to load highlights</h3>
      <p class="text-gray-400 mb-4">{error}</p>
      <button
        on:click={handleRetry}
        class="btn-primary"
      >
        Try Again
      </button>
    </div>
  
  <!-- Highlights Grid -->
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each filteredHighlights as highlight (highlight.id)}
        <div class="card p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-yellow-600 flex flex-col h-full">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <BookOpen class="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div class="min-w-0 flex-1">
                <h3 class="text-lg font-semibold text-yellow-600 truncate">{highlight.book_title}</h3>
                {#if highlight.author}
                  <p class="text-sm text-gray-400 truncate">
                    by {highlight.author}
                  </p>
                {/if}
              </div>
            </div>
            
            <a 
              href="/highlights/{highlight.id}"
              class="text-sm text-yellow-600 hover:text-yellow-500 transition-colors font-medium flex-shrink-0 ml-2"
            >
              Open →
            </a>
          </div>
          
          <!-- Content Preview -->
          <div class="text-gray-300 leading-relaxed flex-1 mb-4">
          {#each [highlight] as _}
            {@const cleanContent = stripHtml(_.content)}
            <p class="line-clamp-6">
              {cleanContent.substring(0, 300)}
            </p>
          {/each}
        </div>
          
          <!-- Footer -->
          <div class="space-y-3 mt-auto">
            <!-- Metadata -->
            <div class="flex items-center justify-between text-xs text-gray-500">
              <div class="flex items-center space-x-1">
                <Calendar class="w-3 h-3" />
                <span>{highlight.created_at.toLocaleDateString()}</span>
              </div>
              <div>
                {Math.ceil(stripHtml(highlight.content).length / 5)} words
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-700">
              <div class="text-xs text-gray-500">
                {highlight.notes_from_highlight?.length || 0} notes created
              </div>
              <button 
                class="text-xs text-gray-400 hover:text-yellow-600 transition-colors"
                on:click={() => navigator.clipboard.writeText(stripHtml(highlight.content))}
              >
                Copy Content
              </button>
            </div>
          </div>
        </div>
      {/each}
      
      {#if filteredHighlights.length === 0}
        <div class="col-span-full text-center py-12">
          <BookOpen class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-400 mb-2">No highlights found</h3>
          <p class="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first highlight'}
          </p>
          <a href="/highlights/new" class="btn-primary inline-flex items-center space-x-2">
            <Plus class="w-4 h-4" />
            <span>Add Highlight</span>
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>