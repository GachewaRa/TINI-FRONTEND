<!-- src/routes/tags/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Tag as TagIcon, Move } from 'lucide-svelte';
  import { mockTags } from '$lib/stores';
  import type { Tag } from '$lib/types';
  
  let tags: Tag[] = [];
  let draggedTag: Tag | null = null;
  let dragOverTag: Tag | null = null;
  
  onMount(() => {
    tags = [...mockTags];
  });
  
  // Build hierarchy for visual representation
  $: tagHierarchy = buildHierarchy(tags);
  
  function buildHierarchy(tagList: Tag[]) {
    const tagMap = new Map(tagList.map(tag => [tag.id, { ...tag, children: [] }]));
    const roots: any[] = [];
    
    tagList.forEach(tag => {
      const tagNode = tagMap.get(tag.id);
      if (tag.parent_id && tagMap.has(tag.parent_id)) {
        tagMap.get(tag.parent_id)!.children.push(tagNode);
      } else {
        roots.push(tagNode);
      }
    });
    
    return roots;
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
  
  function handleDrop(event: DragEvent, targetTag: Tag) {
    event.preventDefault();
    
    if (draggedTag && draggedTag.id !== targetTag.id && !isDescendant(draggedTag, targetTag)) {
      // Update the dragged tag's parent
      const updatedTags = tags.map(tag => 
        tag.id === draggedTag!.id 
          ? { ...tag, parent_id: targetTag.id }
          : tag
      );
      tags = updatedTags;
      
      // Here you would typically make an API call to update the backend
      console.log(`Moved tag "${draggedTag.name}" under "${targetTag.name}"`);
    }
    
    draggedTag = null;
    dragOverTag = null;
  }
  
  function handleDropToRoot(event: DragEvent) {
    event.preventDefault();
    
    if (draggedTag) {
      // Update the dragged tag to be a root tag
      const updatedTags = tags.map(tag => 
        tag.id === draggedTag!.id 
          ? { ...tag, parent_id: undefined }
          : tag
      );
      tags = updatedTags;
      
      console.log(`Moved tag "${draggedTag.name}" to root level`);
    }
    
    draggedTag = null;
    dragOverTag = null;
  }
  
  function isDescendant(ancestor: Tag, tag: Tag): boolean {
    const descendants = getDescendants(ancestor);
    return descendants.some(desc => desc.id === tag.id);
  }
  
  function getDescendants(tag: Tag): Tag[] {
    const children = tags.filter(t => t.parent_id === tag.id);
    const descendants = [...children];
    
    children.forEach(child => {
      descendants.push(...getDescendants(child));
    });
    
    return descendants;
  }
  
  function getTagDepth(tag: Tag): number {
    let depth = 0;
    let current = tag;
    
    while (current.parent_id) {
      depth++;
      const parent = tags.find(t => t.id === current.parent_id);
      if (!parent) break;
      current = parent;
    }
    
    return depth;
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
      <p class="text-gray-400 mt-1">{tags.length} tags total</p>
    </div>
    
    <a href="/tags/new" class="btn-primary flex items-center space-x-2">
      <Plus class="w-4 h-4" />
      <span>New Tag</span>
    </a>
  </div>
  
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
      {#each tagHierarchy as rootTag (rootTag.id)}
        <div class="tag-tree">
          {#each [rootTag, ...getDescendants(rootTag)] as tag (tag.id)}
            <div 
              class="tag-item"
              class:dragging={draggedTag?.id === tag.id}
              class:drag-over={dragOverTag?.id === tag.id}
              style="--depth: {getTagDepth(tag)}; --tag-color: {tag.color || '#6b7280'}"
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
    </div>
    
    <!-- Help text -->
    <div class="help-text">
      <p>Drag tags onto each other to create parent-child relationships</p>
      <p>Drop tags in empty space to make them root-level tags</p>
    </div>
  </div>
</div>

<style>
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