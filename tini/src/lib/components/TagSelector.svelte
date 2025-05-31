<!-- src/lib/components/TagSelector.svelte -->
<script lang="ts">
  import { Plus, X } from 'lucide-svelte';
  import { tags } from '$lib/stores';
  import type { Tag } from '$lib/types';
  
  export let selectedTags: Tag[] = [];
  export let availableTags: Tag[] = [];
  
  let showTagInput = false;
  let newTagName = '';
  let newTagColor = '#CC7722';
  
  function addTag(tag: Tag) {
    if (!selectedTags.find(t => t.id === tag.id)) {
      selectedTags = [...selectedTags, tag];
    }
  }
  
  function removeTag(tagId: string) {
    selectedTags = selectedTags.filter(t => t.id !== tagId);
  }
  
  function createNewTag() {
    if (!newTagName.trim()) return;
    
    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: newTagColor,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    tags.update(t => [...t, newTag]);
    selectedTags = [...selectedTags, newTag];
    
    newTagName = '';
    showTagInput = false;
  }
  
  function cancelNewTag() {
    newTagName = '';
    showTagInput = false;
  }
</script>

<div class="space-y-3">
  <!-- Selected Tags -->
  {#if selectedTags.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each selectedTags as tag}
        <span 
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
          style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}"
        >
          {tag.name}
          <button
            on:click={() => removeTag(tag.id)}
            class="ml-2 hover:text-red-400 transition-colors"
          >
            <X class="w-3 h-3" />
          </button>
        </span>
      {/each}
    </div>
  {/if}
  
  <!-- Available Tags -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-400">Available Tags</span>
      <button
        on:click={() => showTagInput = true}
        class="text-sm text-yellow-600 hover:text-yellow-500 flex items-center space-x-1"
      >
        <Plus class="w-3 h-3" />
        <span>New Tag</span>
      </button>
    </div>
    
    <!-- New Tag Form -->
    {#if showTagInput}
      <div class="bg-gray-700 p-3 rounded-lg space-y-3">
        <div class="flex space-x-2">
          <input
            type="text"
            bind:value={newTagName}
            placeholder="Tag name..."
            class="flex-1 px-3 py-1 bg-gray-600 border border-gray-500 rounded text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-600"
            on:keydown={(e) => e.key === 'Enter' && createNewTag()}
          />
          <input
            type="color"
            bind:value={newTagColor}
            class="w-10 h-8 rounded border border-gray-500 bg-gray-600"
          />
        </div>
        <div class="flex justify-end space-x-2">
          <button
            on:click={cancelNewTag}
            class="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={createNewTag}
            class="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
            disabled={!newTagName.trim()}
          >
            Create
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Tag List -->
    <div class="max-h-32 overflow-y-auto">
      <div class="flex flex-wrap gap-2">
        {#each availableTags.filter(tag => !selectedTags.find(st => st.id === tag.id)) as tag}
          <button
            on:click={() => addTag(tag)}
            class="px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            style="background-color: {tag.color}15; color: {tag.color}; border: 1px solid {tag.color}30"
          >
            {tag.name}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
