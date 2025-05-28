<!-- src/routes/tags/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Tag as TagIcon, Move, AlertCircle, RefreshCw } from 'lucide-svelte';
  import { tagsStore, tagHierarchy, tagsLoading, tagsError, getTagDescendants, getTagDepth } from '$lib/stores/tags';
  import type { Tag, TagNode } from '$lib/types/tags';
  
  let draggedTag: Tag | null = null;
  let dragOverTag: Tag | null = null;
  
  // Reactive values from stores
  $: hierarchy = $tagHierarchy;
  $: isLoading = $tagsLoading;
  $: error = $tagsError;
  $: totalTags = hierarchy.reduce((count, root) => count + 1 + countDescendants(root), 0);
  
  onMount(async () => {
    try {
      await tagsStore.load();
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  });
  
  function countDescendants(tag: TagNode): number {
    return tag.children.reduce((count, child) => count + 1 + countDescendants(child), 0);
  }
  
  function flattenHierarchy(nodes: TagNode[]): Tag[] {
    const result: Tag[] = [];
    
    function traverse(nodeList: TagNode[]) {
      nodeList.forEach(node => {
        result.push(node);
        traverse(node.children);
      });
    }
    
    traverse(nodes);
    return result;
  }
  
  function handleDragStart(event: DragEvent, tag: Tag) {
    draggedTag = tag;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tag.id);
    }
  }
  
  function handleDragOver(event: DragEvent, tag: Tag) {
    event.preventDefault();
    if (draggedTag && draggedTag.id !== tag.id && !isDescendant(draggedTag, tag)) {
      dragOverTag = tag;
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    }
  }
  
  function handleDragLeave() {
    dragOverTag = null;
  }
  
  async function handleDrop(event: DragEvent, targetTag: Tag) {
    event.preventDefault();
    
    if (draggedTag && draggedTag.id !== targetTag.id && !isDescendant(draggedTag, targetTag)) {
      try {
        await tagsStore.moveTag(draggedTag.id, targetTag.id);
        console.log(`Moved tag "${draggedTag.name}" under "${targetTag.name}"`);
      } catch (err) {
        console.error('Failed to move tag:', err);
      }
    }
    
    draggedTag = null;
    dragOverTag = null;
  }
  
  async function handleDropToRoot(event: DragEvent) {
    event.preventDefault();
    
    if (draggedTag) {
      try {
        await tagsStore.moveTag(draggedTag.id, null);
        console.log(`Moved tag "${draggedTag.name}" to root level`);
      } catch (err) {
        console.error('Failed to move tag to root:', err);
      }
    }
    
    draggedTag = null;
    dragOverTag = null;
  }
  
  function isDescendant(ancestor: Tag, tag: Tag): boolean {
    const allTags = flattenHierarchy(hierarchy);
    const descendants = getTagDescendants(allTags, ancestor.id);
    return descendants.some(desc => desc.id === tag.id);
  }
  
  async function handleRefresh() {
    try {
      await tagsStore.refresh();
    } catch (err) {
      console.error('Failed to refresh tags:', err);
    }
  }
  
  function handleClearError() {
    tagsStore.clearError();
  }
</script>

<svelte:head>
  <title>Tags - PKMS</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Tags</h1>
      <p class="text-gray-400 mt-1">{totalTags} tags total</p>
    </div>
    
    <div class="flex items-center space-x-3">
      <button 
        on:click={handleRefresh}
        class="btn-secondary flex items-center space-x-2"
        disabled={isLoading}
      >
        <RefreshCw class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" />
        <span>Refresh</span>
      </button>
      
      <a href="/tags/new" class="btn-primary flex items-center space-x-2">
        <Plus class="w-4 h-4" />
        <span>New Tag</span>
      </a>
    </div>
  </div>
  
  <!-- Error Alert -->
  {#if error}
    <div class="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start space-x-3">
      <AlertCircle class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-red-400 font-medium">Error loading tags</h3>
        <p class="text-red-300 mt-1">{error}</p>
      </div>
      <button 
        on:click={handleClearError}
        class="text-red-400 hover:text-red-300"
      >
        ×
      </button>
    </div>
  {/if}
  
  <!-- Loading State -->
  {#if isLoading && hierarchy.length === 0}
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3 text-gray-400">
        <RefreshCw class="w-5 h-5 animate-spin" />
        <span>Loading tags...</span>
      </div>
    </div>
  {:else}
    <!-- Drop zone for root level -->
    <div 
      class="tag-workspace"
      on:dragover|preventDefault
      on:drop={handleDropToRoot}
    >
      <div class="workspace-background">
        <div class="workspace-grid"></div>
      </div>
      
      <!-- Tags Display -->
      <div class="tags-container">
        {#if hierarchy.length === 0}
          <div class="text-center py-12">
            <TagIcon class="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-400 mb-2">No tags yet</h3>
            <p class="text-gray-500 mb-4">Create your first tag to get started</p>
            <a href="/tags/new" class="btn-primary inline-flex items-center space-x-2">
              <Plus class="w-4 h-4" />
              <span>Create Tag</span>
            </a>
          </div>
        {:else}
          {#each hierarchy as rootTag (rootTag.id)}
            <div class="tag-tree">
              {#each [rootTag, ...getTagDescendants(flattenHierarchy(hierarchy), rootTag.id)] as tag (tag.id)}
                <div 
                  class="tag-item"
                  class:dragging={draggedTag?.id === tag.id}
                  class:drag-over={dragOverTag?.id === tag.id}
                  style="--depth: {getTagDepth(flattenHierarchy(hierarchy), tag)}; --tag-color: {tag.color || '#6b7280'}"
                  draggable="true"
                  role="button"
                  tabindex="0"
                  on:dragstart={(e) => handleDragStart(e, tag)}
                  on:dragover={(e) => handleDragOver(e, tag)}
                  on:dragleave={handleDragLeave}
                  on:drop={(e) => handleDrop(e, tag)}
                  on:click={() => window.location.href = `/tags/${tag.id}`}
                  on:keydown={(e) => e.key === 'Enter' && (window.location.href = `/tags/${tag.id}`)}
                >
                  <div class="tag-content">
                    <div class="tag-header">
                      <div class="tag-color" style="background-color: {tag.color || '#6b7280'}"></div>
                      <TagIcon class="w-4 h-4 text-gray-400" />
                      <Move class="w-3 h-3 text-gray-500 drag-handle" />
                    </div>
                    
                    <div class="tag-info">
                      <h3 class="tag-name">{tag.name}</h3>
                      {#if tag.description}
                        <p class="tag-description">{tag.description}</p>
                      {/if}
                      
                      <div class="tag-meta">
                        {#if tag.children?.length > 0}
                          <span class="children-count">{tag.children.length} child{tag.children.length !== 1 ? 'ren' : ''}</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Connection line for hierarchy -->
                  {#if tag.parent_id}
                    <div class="hierarchy-line"></div>
                  {/if}
                </div>
              {/each}
            </div>
          {/each}
        {/if}
      </div>
      
      <!-- Help text -->
      {#if hierarchy.length > 0}
        <div class="help-text">
          <p>Drag tags onto each other to create parent-child relationships</p>
          <p>Drop tags in empty space to make them root-level tags</p>
        </div>
      {/if}
    </div>
  {/if}
</div>



  


<style>

  /* .tag-workspace {
    @apply relative min-h-96 bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden;
  }
  
  .workspace-background {
    @apply absolute inset-0 opacity-30;
  }
  
  .workspace-grid {
    @apply w-full h-full;
    background-image: 
      linear-gradient(rgba(107, 114, 128, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(107, 114, 128, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
  
  .tags-container {
    @apply relative z-10 p-6 space-y-4;
  }
  
  .tag-tree {
    @apply space-y-2;
  }
  
  .tag-item {
    @apply relative p-4 bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-800/80 hover:border-gray-600;
    margin-left: calc(var(--depth) * 2rem);
  }
  
  .tag-item.dragging {
    @apply opacity-60 scale-95;
  }
  
  .tag-item.drag-over {
    @apply border-blue-500 bg-blue-900/20;
  }
  
  .tag-content {
    @apply flex items-start space-x-3;
  }
  
  .tag-header {
    @apply flex items-center space-x-2 flex-shrink-0;
  }
  
  .tag-color {
    @apply w-3 h-3 rounded-full;
  }
  
  .drag-handle {
    @apply opacity-0 group-hover:opacity-100 transition-opacity cursor-grab;
  }
  
  .tag-item:hover .drag-handle {
    @apply opacity-100;
  }
  
  .tag-info {
    @apply flex-1 min-w-0;
  }
  
  .tag-name {
    @apply text-gray-200 font-medium;
  }
  
  .tag-description {
    @apply text-gray-400 text-sm mt-1 line-clamp-2;
  }
  
  .tag-meta {
    @apply flex items-center space-x-4 mt-2;
  }
  
  .children-count {
    @apply text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded;
  }
  
  .hierarchy-line {
    @apply absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-gray-600 to-transparent;
    left: calc(var(--depth) * 2rem - 1rem);
  }
  
  .help-text {
    @apply absolute bottom-4 left-4 text-xs text-gray-500 space-y-1;
  }
  
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition-colors;
  }
  
  .btn-secondary:disabled {
    @apply opacity-50 cursor-not-allowed;
  } */


  .tag-workspace {
    position: relative;
    min-height: 600px;
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-radius: 12px;
    padding: 2rem;
    overflow: hidden;
  }
  
  .workspace-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
  }
  
  .workspace-grid {
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0);
    background-size: 20px 20px;
  }
  
  .tags-container {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-start;
  }
  
  .tag-tree {
    position: relative;
  }
  
  .tag-item {
    position: relative;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    margin: 0.5rem 0;
    margin-left: calc(var(--depth) * 2rem);
    width: 280px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    user-select: none;
  }
  
  .tag-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--tag-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
  }
  
  .tag-item.dragging {
    opacity: 0.5;
    transform: rotate(5deg) scale(0.95);
  }
  
  .tag-item.drag-over {
    border-color: var(--tag-color);
    box-shadow: 0 0 20px var(--tag-color);
    background: rgba(255, 255, 255, 0.1);
  }
  
  .tag-content {
    position: relative;
    z-index: 2;
  }
  
  .tag-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .tag-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  
  .drag-handle {
    margin-left: auto;
    opacity: 0.5;
  }
  
  .tag-item:hover .drag-handle {
    opacity: 1;
  }
  
  .tag-info {
    space-y: 0.5rem;
  }
  
  .tag-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0 0 0.25rem 0;
  }
  
  .tag-description {
    font-size: 0.875rem;
    color: #d1d5db;
    line-height: 1.4;
    margin: 0 0 0.5rem 0;
  }
  
  .tag-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }
  
  .children-count {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }
  
  .hierarchy-line {
    position: absolute;
    top: -0.5rem;
    left: -2rem;
    width: 2rem;
    height: 1px;
    background: var(--tag-color);
    opacity: 0.5;
  }
  
  .hierarchy-line::before {
    content: '';
    position: absolute;
    left: 0;
    top: -0.5rem;
    width: 1px;
    height: 1rem;
    background: var(--tag-color);
    opacity: 0.5;
  }
  
  .help-text {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    text-align: right;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
  }
  
  /* Global button styles */
  :global(.btn-primary) {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
  }
  
  :global(.btn-primary:hover) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
</style>