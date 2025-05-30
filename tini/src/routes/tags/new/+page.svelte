<!-- src/routes/tags/new/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Save, ArrowLeft, Palette, Tag as TagIcon, AlertCircle } from 'lucide-svelte';
  import { tagsStore, tags } from '$lib/stores/tags';
  import type { Tag } from '$lib/types/tags';
  
  let tagList: Tag[] = [];
  let name = '';
  let description = '';
  let color = '#3b82f6';
  let parentId = '';
  let showColorPicker = false;
  let errors: { [key: string]: string } = {};
  let isSubmitting = false;
  
  // Predefined color palette
  const colorPalette = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#374151'
  ];
  
  onMount(async () => {
    try {
      await tagsStore.load();
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  });
  
  // Reactive statement to get tags from store
  $: tagList = $tags;
  
  // Get available parent tags (excluding children of current tag since we're creating)
  $: availableParentTags = tagList.filter(tag => !tag.parent_id || tag.parent_id !== 'current');
  
  function validateForm() {
    errors = {};
    
    if (!name.trim()) {
      errors.name = 'Tag name is required';
    } else if (name.length > 100) {
      errors.name = 'Tag name must be less than 100 characters';
    } else if (tagList.some(tag => tag.name.toLowerCase() === name.toLowerCase())) {
      errors.name = 'A tag with this name already exists';
    }
    
    if (description && description.length > 255) {
      errors.description = 'Description must be less than 255 characters';
    }
    
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      errors.color = 'Please enter a valid hex color code';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm() || isSubmitting) return;
    
    isSubmitting = true;
    errors = {}; // Clear any previous errors
    
    try {
      const tagData = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: color,
        parent_id: parentId || undefined,
      };
      
      await tagsStore.addTag(tagData);
      
      // Redirect to the tags list on success
      goto('/tags');
    } catch (err) {
      console.error('Failed to create tag:', err);
      errors.submit = err instanceof Error ? err.message : 'Failed to create tag. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  function selectColor(selectedColor: string) {
    color = selectedColor;
    showColorPicker = false;
  }
  
  function handleColorInput(event: Event) {
    const target = event.target as HTMLInputElement;
    color = target.value;
  }
</script>

<svelte:head>
  <title>New Tag - PKMS</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex items-center space-x-4">
    <a href="/tags" class="btn-secondary">
      <ArrowLeft class="w-4 h-4" />
    </a>
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Create New Tag</h1>
      <p class="text-gray-400 mt-1">Add a new tag to organize your content</p>
    </div>
  </div>
  
  <!-- Form -->
  <div class="form-container">
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Error Alert -->
      {#if errors.submit}
        <div class="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div class="flex-1">
            <h3 class="text-red-400 font-medium">Failed to create tag</h3>
            <p class="text-red-300 mt-1">{errors.submit}</p>
          </div>
        </div>
      {/if}
      
      <!-- Name Field -->
      <div class="form-group">
        <label for="name" class="form-label">
          <TagIcon class="w-4 h-4" />
          Tag Name *
        </label>
        <input
          id="name"
          type="text"
          bind:value={name}
          placeholder="Enter tag name..."
          class="form-input"
          class:error={errors.name}
          maxlength="100"
        />
        {#if errors.name}
          <div class="form-error">{errors.name}</div>
        {/if}
        <div class="form-hint">{name.length}/100 characters</div>
      </div>
      
      <!-- Description Field -->
      <div class="form-group">
        <label for="description" class="form-label">Description</label>
        <textarea
          id="description"
          bind:value={description}
          placeholder="Optional description for this tag..."
          class="form-textarea"
          class:error={errors.description}
          rows="3"
          maxlength="255"
        ></textarea>
        {#if errors.description}
          <div class="form-error">{errors.description}</div>
        {/if}
        <div class="form-hint">{description.length}/255 characters</div>
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
                style="background-color: {color}"
                role="button"
                tabindex="0"
                on:click={() => showColorPicker = !showColorPicker}
                on:keydown={(e) => e.key === 'Enter' && (showColorPicker = !showColorPicker)}
                ></div>
                <input
                id="color"
                type="text"
                bind:value={color}
                on:input={handleColorInput}
                placeholder="#3b82f6"
                class="color-input"
                class:error={errors.color}
                />
            </div>

            
          
          <!-- Color Palette -->
          {#if showColorPicker}
            <div class="color-palette">
              <div class="palette-grid">
                {#each colorPalette as paletteColor}
                  <button
                    type="button"
                    class="palette-color"
                    class:selected={color === paletteColor}
                    style="background-color: {paletteColor}"
                    on:click={() => selectColor(paletteColor)}
                    title={paletteColor}
                  ></button>
                {/each}
              </div>
              
              <!-- Custom Color Input -->
              <div class="custom-color-section">
                <label for="custom-color">Custom Color:</label>
                <input
                  id="custom-color"
                  type="color"
                  bind:value={color}
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
          bind:value={parentId}
          class="form-select"
        >
          <option value="">No parent (root level)</option>
          {#each availableParentTags as tag}
            <option value={tag.id}>{tag.name}</option>
          {/each}
        </select>
        <div class="form-hint">
          Choose a parent tag to create a hierarchy, or leave empty for a root-level tag
        </div>
      </div>
      
      <!-- Preview -->
      {#if name}
        <div class="tag-preview">
          <h3 class="preview-title">Preview</h3>
          <div class="preview-tag" style="--tag-color: {color}">
            <div class="tag-header">
              <div class="tag-color" style="background-color: {color}"></div>
              <TagIcon class="w-4 h-4 text-gray-400" />
            </div>
            <div class="tag-info">
              <h4 class="tag-name">{name}</h4>
              {#if description}
                <p class="tag-description">{description}</p>
              {/if}
              {#if parentId}
                {@const parentTag = tagList.find(t => t.id === parentId)}
                {#if parentTag}
                  <div class="tag-parent">Child of: {parentTag.name}</div>
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Submit Button -->
      <div class="form-actions">
        <button type="submit" class="btn-primary" disabled={!name.trim() || isSubmitting}>
          <Save class="w-4 h-4" />
          {isSubmitting ? 'Creating...' : 'Create Tag'}
        </button>
        <a href="/tags" class="btn-secondary">Cancel</a>
      </div>
    </form>
  </div>
</div>







<style>
  .form-container {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    backdrop-filter: blur(10px);
  }
  
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
  
  .form-input:focus, .form-textarea:focus {
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
  
  .color-preview-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .color-preview {
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .color-preview:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  /* .color-input {
    flex: 1;
    font-family: 'Monaco', 'Menlo', monospace;
  } */
  
  .color-palette {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 0.5rem;
    backdrop-filter: blur(10px);
    z-index: 10;
  }

  .color-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: #f9fafb;
    font-family: monospace;
    width: 120px;
  }

  .color-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .color-input.error {
    border-color: #ef4444;
  }

  .color-input::placeholder {
    color: #6b7280;
    opacity: 1;
  }

  
  .palette-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .palette-color {
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .palette-color:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  .palette-color.selected {
    border-color: #f9fafb;
    box-shadow: 0 0 0 2px rgba(249, 250, 251, 0.5);
  }
  
  .custom-color-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #d1d5db;
    font-size: 0.875rem;
  }
  
  .custom-color-input {
    width: 3rem;
    height: 2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .tag-preview {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
  }
  
  .preview-title {
    color: #d1d5db;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }
  
  .preview-tag {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    width: fit-content;
    min-width: 200px;
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
  
  .tag-parent {
    font-size: 0.75rem;
    color: #9ca3af;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    width: fit-content;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  :global(.btn-primary:hover) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  :global(.btn-primary:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  :global(.btn-secondary) {
    background: rgba(255, 255, 255, 0.1);
    color: #d1d5db;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  :global(.btn-secondary:hover) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
</style>