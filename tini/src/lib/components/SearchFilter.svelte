<!-- src/lib/components/SearchFilter.svelte -->
<script lang="ts">
  import { Search, X } from 'lucide-svelte';
  import { searchFilters, tags} from '$lib/stores';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // tags.set(mockTags);
  });
  
  function clearFilters() {
    searchFilters.update(filters => ({
      keyword: '',
      tags: [],
      tagOperation: 'and'
    }));
  }
  
  function toggleTag(tagId: string) {
    searchFilters.update(filters => {
      const newTags = filters.tags.includes(tagId)
        ? filters.tags.filter(id => id !== tagId)
        : [...filters.tags, tagId];
      return { ...filters, tags: newTags };
    });
  }
</script>

<div class="card p-4 space-y-4">
  <!-- Search Input -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search notes..."
      bind:value={$searchFilters.keyword}
      class="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
    />
  </div>
  
  <!-- Tag Filters -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-300">Filter by Tags</h3>
      <div class="flex items-center space-x-2">
        <label class="flex items-center space-x-1 text-xs text-gray-400">
          <input
            type="radio"
            bind:group={$searchFilters.tagOperation}
            value="and"
            class="text-yellow-600"
          />
          <span>AND</span>
        </label>
        <label class="flex items-center space-x-1 text-xs text-gray-400">
          <input
            type="radio"
            bind:group={$searchFilters.tagOperation}
            value="or"
            class="text-yellow-600"
          />
          <span>OR</span>
        </label>
      </div>
    </div>
    
    <div class="flex flex-wrap gap-2">
      {#each $tags as tag}
        <button
          on:click={() => toggleTag(tag.id)}
          class="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
            {$searchFilters.tags.includes(tag.id)
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
            }"
          style="background-color: {$searchFilters.tags.includes(tag.id) 
            ? tag.color 
            : tag.color + '20'
          }; border: 1px solid {tag.color}"
        >
          {tag.name}
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Clear Filters -->
  <div class="flex justify-end">
    <button
      on:click={clearFilters}
      class="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
    >
      <X class="w-3 h-3" />
      <span>Clear Filters</span>
    </button>
  </div>
</div>

