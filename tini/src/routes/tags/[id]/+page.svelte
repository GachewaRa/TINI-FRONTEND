<!-- src/routes/tags/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
    ArrowLeft, 
    Edit3, 
    Save, 
    X, 
    Trash2, 
    Tag as TagIcon, 
    Palette,
    Users,
    Calendar,
    FileText,
    Folder
  } from 'lucide-svelte';
  import { mockTags } from '$lib/stores';
  import type { Tag } from '$lib/types';
  
  let tags: Tag[] = [];
  let tag: Tag | null = null;
  let isEditing = false;
  let showDeleteConfirm = false;
  let showColorPicker = false;
  
  // Edit form state
  let editName = '';
  let editDescription = '';
  let editColor = '';
  let editParentId = '';
  let errors: { [key: string]: string } = {};
  
  // Predefined color palette
  const colorPalette = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
  ];
  
  $: tagId = $page.params.id;
  
  onMount(() => {
    tags = [...mockTags];
    tag = tags.find(t => t.id === tagId) || null;
    
    if (!tag) {
      goto('/tags');
      return;
    }
    
    // Initialize edit form
    editName = tag.name;
    editDescription = tag.description || '';
    editColor = tag.color || '#3b82f6';
    editParentId = tag.parent_id || '';
  });
  
  // Get tag relationships
  $: children = tag ? tags.filter(t => t.parent_id === tag.id) : [];
  $: parent = tag?.parent_id ? tags.find(t => t.id === tag.parent_id) : null;
  $: siblings = tag && parent ? tags.filter(t => t.parent_id === parent.id && t.id !== tag.id) : [];
  $: availableParentTags = tags.filter(t => t.id !== tag?.id && !isDescendant(tag, t));
  
  function isDescendant(ancestor: Tag | null, potential: Tag): boolean {
    if (!ancestor) return false;
    const descendants = getDescendants(ancestor);
    return descendants.some(desc => desc.id === potential.id);
  }
  
  function getDescendants(tag: Tag): Tag[] {
    const children = tags.filter(t => t.parent_id === tag.id);
    const descendants = [...children];
    
    children.forEach(child => {
      descendants.push(...getDescendants(child));
    });
    
    return descendants;
  }
  
  function startEditing() {
    isEditing = true;
    errors = {};
  }
  
  function cancelEditing() {
    if (!tag) return;
    
    isEditing = false;
    editName = tag.name;
    editDescription = tag.description || '';
    editColor = tag.color || '#3b82f6';
    editParentId = tag.parent_id || '';
    errors = {};
    showColorPicker = false;
  }
  
  function validateForm() {
    errors = {};
    
    if (!editName.trim()) {
      errors.name = 'Tag name is required';
    } else if (editName.length > 100) {
      errors.name = 'Tag name must be less than 100 characters';
    } else if (tags.some(t => t.id !== tag?.id && t.name.toLowerCase() === editName.toLowerCase())) {
      errors.name = 'A tag with this name already exists';
    }
    
    if (editDescription && editDescription.length > 255) {
      errors.description = 'Description must be less than 255 characters';
    }
    
    if (editColor && !/^#[0-9A-F]{6}$/i.test(editColor)) {
      errors.color = 'Please enter a valid hex color code';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function saveChanges() {
    if (!tag || !validateForm()) return;
    
    const updatedTag: Tag = {
      ...tag,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      color: editColor,
      parent_id: editParentId || undefined,
      updated_at: new Date()
    };
    
    // Here you would typically make an API call to update the tag
    console.log('Updating tag:', updatedTag);
    
    // Update mock store
    tags = tags.map(t => t.id === tag!.id ? updatedTag : t);
    tag = updatedTag;
    
    isEditing = false;
    showColorPicker = false;
  }
  
  async function deleteTag() {
    if (!tag) return;
    
    // In a real app, you'd check if the tag is being used and handle cascading
    console.log('Deleting tag:', tag);
    
    // Remove from mock store
    tags = tags.filter(t => t.id !== tag!.id);
    
    goto('/tags');
  }
  
  function selectColor(selectedColor: string) {
    editColor = selectedColor;
    showColorPicker = false;
  }
  
  function handleColorInput(event: Event) {
    const target = event.target as HTMLInputElement;
    editColor = target.value;
  }
  
  function getTagPath(tag: Tag): Tag[] {
    const path = [tag];
    let current = tag;
    
    while (current.parent_id) {
      const parent = tags.find(t => t.id === current.parent_id);
      if (!parent) break;
      path.unshift(parent);
      current = parent;
    }
    
    return path;
  }
</script>

<svelte:head>
  <title>{tag?.name || 'Tag'} - PKMS</title>
</svelte:head>

{#if tag}
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <a href="/tags" class="btn-secondary">
          <ArrowLeft class="w-4 h-4" />
        </a>
        
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          {#each getTagPath(tag) as pathTag, index}
            {#if index > 0}
              <span class="breadcrumb-separator">/</span>
            {/if}
            <span 
              class="breadcrumb-item"
              class:current={pathTag.id === tag.id}
              style="--tag-color: {pathTag.color || '#6b7280'}"
            >
              <div class="tag-color" style="background-color: {pathTag.color || '#6b7280'}"></div>
              {pathTag.name}
            </span>
          {/each}
        </div>
      </div>
      
      <div class="flex items-center space-x-3">
        {#if !isEditing}
          <button on:click={startEditing} class="btn-secondary">
            <Edit3 class="w-4 h-4" />
            Edit
          </button>
          
          <button 
            on:click={() => showDeleteConfirm = true} 
            class="btn-danger"
          >
            <Trash2 class="w-4 h-4" />
            Delete
          </button>
        {:else}
          <button on:click={saveChanges} class="btn-primary" disabled={!editName.trim()}>
            <Save class="w-4 h-4" />
            Save
          </button>
          
          <button on:click={cancelEditing} class="btn-secondary">
            <X class="w-4 h-4" />
            Cancel
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Tag Details -->
      <div class="lg:col-span-2 space-y-6">
        {#if isEditing}
          <!-- Edit Form -->
          <div class="form-container">
            <h2 class="section-title">Edit Tag</h2>
            
            <form on:submit|preventDefault={saveChanges} class="space-y-6">
              <!-- Name Field -->
              <div class="form-group">
                <label for="name" class="form-label">
                  <TagIcon class="w-4 h-4" />
                  Tag Name *
                </label>
                <input
                  id="name"
                  type="text"
                  bind:value={editName}
                  placeholder="Enter tag name..."
                  class="form-input"
                  class:error={errors.name}
                  maxlength="100"
                />
                {#if errors.name}
                  <div class="form-error">{errors.name}</div>
                {/if}
                <div class="form-hint">{editName.length}/100 characters</div>
              </div>
              
              <!-- Description Field -->
              <div class="form-group">
                <label for="description" class="form-label">Description</label>
                <textarea
                  id="description"
                  bind:value={editDescription}
                  placeholder="Optional description for this tag..."
                  class="form-textarea"
                  class:error={errors.description}
                  rows="3"
                  maxlength="255"
                ></textarea>
                {#if errors.description}
                  <div class="form-error">{errors.description}</div>
                {/if}
                <div class="form-hint">{editDescription.length}/255 characters</div>
              </div>
              
              <!-- Color Field -->
              <div class="form-group">
                <label for="color" class="form-label">
                  <Palette class="w-4 h-4" />
                  Color
                </label>
                
                <div class="color-picker-container">
                  <div class="color-preview-container">
                    <div 
                      class="color-preview" 
                      style="background-color: {editColor}"
                      role="button"
                      tabindex="0"
                      on:click={() => showColorPicker = !showColorPicker}
                      on:keydown={(e) => e.key === 'Enter' && (showColorPicker = !showColorPicker)}
                    ></div>
                    <input
                      id="color"
                      type="text"
                      bind:value={editColor}
                      on:input={handleColorInput}
                      placeholder="#3b82f6"
                      class="color-input"
                      class:error={errors.color}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  
                  {#if showColorPicker}
                    <div class="color-palette">
                      <div class="palette-grid">
                        {#each colorPalette as paletteColor}
                          <button
                            type="button"
                            class="palette-color"
                            class:selected={editColor === paletteColor}
                            style="background-color: {paletteColor}"
                            on:click={() => selectColor(paletteColor)}
                            title={paletteColor}
                          ></button>
                        {/each}
                      </div>
                      
                      <div class="custom-color-section">
                        <label for="custom-color">Custom Color:</label>
                        <input
                          id="custom-color"
                          type="color"
                          bind:value={editColor}
                          class="custom-color-input"
                        />
                      </div>
                    </div>
                  {/if}
                </div>
                
                {#if errors.color}
                  <div class="form-error">{errors.color}</div>
                {/if}
              </div>
              
              <!-- Parent Tag Field -->
                <div class="form-group">
                <label for="parent" class="form-label">Parent Tag</label>
                <select
                    id="parent"
                    bind:value={editParentId}
                    class="form-select"
                >
                    <option value="">No parent (root level)</option>
                    {#each availableParentTags as parentTag}
                    <option value={parentTag.id}>{parentTag.name}</option>
                    {/each}
                </select>
                </div>
            </form>
          </div>
        {:else}
          <!-- View Mode -->
          <div class="tag-display">
            <div class="tag-header">
              <div class="tag-visual">
                <div class="tag-color" style="background-color: {tag.color || '#6b7280'}"></div>
                <div class="tag-info">
                  <h1 class="tag-name">{tag.name}</h1>
                  {#if tag.description}
                    <p class="tag-description">{tag.description}</p>
                  {/if}
                </div>
              </div>
            </div>
            
            <!-- Metadata -->
            <div class="tag-metadata">
              <div class="metadata-item">
                <Calendar class="w-4 h-4" />
                <div>
                  <div class="metadata-label">Created</div>
                  <div class="metadata-value">{tag.created_at.toLocaleDateString()}</div>
                </div>
              </div>
              
              <div class="metadata-item">
                <Calendar class="w-4 h-4" />
                <div>
                  <div class="metadata-label">Updated</div>
                  <div class="metadata-value">{tag.updated_at.toLocaleDateString()}</div>
                </div>
              </div>
              
              <div class="metadata-item">
                <FileText class="w-4 h-4" />
                <div>
                  <div class="metadata-label">Usage</div>
                  <div class="metadata-value">0 items</div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Hierarchy Info -->
        <div class="info-card">
          <h3 class="card-title">
            <Folder class="w-4 h-4" />
            Hierarchy
          </h3>
          
          <div class="hierarchy-info">
            {#if parent}
              <div class="hierarchy-item">
                <div class="hierarchy-label">Parent</div>
                <a 
                  href="/tags/{parent.id}" 
                  class="hierarchy-tag"
                  style="--tag-color: {parent.color || '#6b7280'}"
                >
                  <div class="tag-color" style="background-color: {parent.color || '#6b7280'}"></div>
                  {parent.name}
                </a>
              </div>
            {/if}
            
            {#if siblings.length > 0}
              <div class="hierarchy-item">
                <div class="hierarchy-label">Siblings ({siblings.length})</div>
                <div class="hierarchy-tags">
                  {#each siblings as sibling}
                    <a 
                      href="/tags/{sibling.id}" 
                      class="hierarchy-tag small"
                      style="--tag-color: {sibling.color || '#6b7280'}"
                    >
                      <div class="tag-color" style="background-color: {sibling.color || '#6b7280'}"></div>
                      {sibling.name}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if children.length > 0}
              <div class="hierarchy-item">
                <div class="hierarchy-label">Children ({children.length})</div>
                <div class="hierarchy-tags">
                  {#each children as child}
                    <a 
                      href="/tags/{child.id}" 
                      class="hierarchy-tag small"
                      style="--tag-color: {child.color || '#6b7280'}"
                    >
                      <div class="tag-color" style="background-color: {child.color || '#6b7280'}"></div>
                      {child.name}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if !parent && siblings.length === 0 && children.length === 0}
              <div class="no-hierarchy">
                <TagIcon class="w-8 h-8 opacity-50" />
                <p>This tag has no parent or children</p>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Usage Stats -->
        <div class="info-card">
          <h3 class="card-title">
            <Users class="w-4 h-4" />
            Usage Statistics
          </h3>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">0</div>
              <div class="stat-label">Notes</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">0</div>
              <div class="stat-label">Projects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="modal-overlay" on:click={() => showDeleteConfirm = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h3>Delete Tag</h3>
          <button on:click={() => showDeleteConfirm = false} class="modal-close">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="modal-content">
          <p>Are you sure you want to delete the tag "<strong>{tag.name}</strong>"?</p>
          {#if children.length > 0}
            <div class="warning">
              <p><strong>Warning:</strong> This tag has {children.length} child tag{children.length !== 1 ? 's' : ''} that will become root-level tags.</p>
            </div>
          {/if}
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        
        <div class="modal-actions">
          <button on:click={deleteTag} class="btn-danger">
            <Trash2 class="w-4 h-4" />
            Delete
          </button>
          <button on:click={() => showDeleteConfirm = false} class="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="text-center py-12">
    <TagIcon class="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-500" />
    <p class="text-xl text-gray-400">Tag not found</p>
  </div>
{/if}

<style>
  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .breadcrumb-separator {
    color: #6b7280;
  }
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: #9ca3af;
    transition: color 0.2s ease;
  }
  
  .breadcrumb-item.current {
    color: #f9fafb;
    font-weight: 500;
  }
  
  .form-container {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    backdrop-filter: blur(10px);
  }
  
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #f9fafb;
    margin-bottom: 1.5rem;
  }
  
  .tag-display {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    backdrop-filter: blur(10px);
  }
  
  .tag-header {
    margin-bottom: 2rem;
  }
  
  .tag-visual {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .tag-name {
    font-size: 2rem;
    font-weight: 700;
    color: #f9fafb;
    margin: 0 0 0.5rem 0;
  }
  
  .tag-description {
    font-size: 1.125rem;
    color: #d1d5db;
    line-height: 1.6;
    margin: 0;
  }
  
  .tag-metadata {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .metadata-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #9ca3af;
  }
  
  .metadata-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
  }
  
  .metadata-value {
    font-size: 0.875rem;
    color: #d1d5db;
    font-weight: 500;
  }
  
  .info-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    backdrop-filter: blur(10px);
  }
  
  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f9fafb;
    margin-bottom: 1rem;
  }
  
  .hierarchy-info {
    space-y: 1rem;
  }
  
  .hierarchy-item {
    space-y: 0.5rem;
  }
  
  .hierarchy-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #9ca3af;
    font-weight: 500;
  }
  
  .hierarchy-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    color: #d1d5db;
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }
  
  .hierarchy-tag:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--tag-color);
    color: #f9fafb;
  }
  
  .hierarchy-tag.small {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .hierarchy-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .no-hierarchy {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .stat-item {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f9fafb;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .tag-color {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
  }
  
  /* Form styles */
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #f9fafb;
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .form-input, .form-textarea {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #f9fafb;
    font-size: 1rem;
    transition: all 0.2s ease;
  }
  
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-select {
    background-color: rgba(255, 255, 255, 0.05);
    color: #f9fafb;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px 12px;
  }

  .form-select option {
    background-color: #1f2937;
    color: #f9fafb;
  }

  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-input.error, .form-textarea.error {
    border-color: #ef4444;
  }
  
  .form-error {
    color: #ef4444;
    font-size: 0.875rem;
  }
  
  .form-hint {
    color: #9ca3af;
    font-size: 0.75rem;
  }
  
  .color-picker-container {
    position: relative;
  }

  /* Color Picker Styles */
    .color-preview-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    }

    .color-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: transform 0.2s ease;
    }

    .color-preview:hover {
    transform: scale(1.05);
    }

    .color-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: #f9fafb;
    font-family: monospace;
    }

    .color-input.error {
    border-color: #ef4444;
    }

    .color-palette {
    position: absolute;
    z-index: 10;
    background: #1f2937;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 0.5rem;
    width: 100%;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    }

    .palette-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
    }

    .palette-color {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 4px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    }

    .palette-color:hover {
    transform: scale(1.1);
    }

    .palette-color.selected {
    border-color: #f9fafb;
    transform: scale(1.1);
    }

    .custom-color-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .custom-color-section label {
    font-size: 0.875rem;
    color: #d1d5db;
    }

    .custom-color-input {
    width: 40px;
    height: 40px;
    border: none;
    background: rgba(0, 0, 0, 0.7);
    cursor: pointer;
    }

    /* Modal Styles */
    .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    backdrop-filter: blur(5px);
    }

    .modal {
    background: #1f2937;
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f9fafb;
    margin: 0;
    }

    .modal-close {
    color: #9ca3af;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.2s ease;
    }

    .modal-close:hover {
    color: #f9fafb;
    }

    .modal-content {
    padding: 1.5rem;
    color: #d1d5db;
    line-height: 1.6;
    }

    .modal-content p {
    margin: 0 0 1rem 0;
    }

    .warning {
    background: rgba(239, 68, 68, 0.1);
    border-left: 4px solid #ef4444;
    padding: 0.75rem 1rem;
    margin: 1rem 0;
    border-radius: 0 4px 4px 0;
    }

    .warning p {
    margin: 0;
    font-size: 0.875rem;
    }

    .warning-text {
    color: #9ca3af;
    font-size: 0.875rem;
    }

    .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Button Styles */
    .btn-primary {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background 0.2s ease;
    }

    .btn-primary:hover {
    background: #2563eb;
    }

    .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    }

    .btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #f9fafb;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    }

    .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    }

    .btn-danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    }

    .btn-danger:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #f9fafb;
    }

</style>