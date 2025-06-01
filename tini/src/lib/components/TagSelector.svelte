<!-- src/lib/components/TagSelector.svelte -->
<script lang="ts">
import { Plus, X } from 'lucide-svelte';
import { tags } from '$lib/stores';
import { tagsStore } from '$lib/stores/tags';
import type { Tag } from '$lib/types';

export let selectedTags: Tag[] = [];
export let availableTags: Tag[] = [];

let showTagInput = false;
let newTagName = '';
let newTagColor = '#CC7722';
let isCreatingTag = false;

// Reactive statement to filter available tags (exclude already selected ones)
$: filteredAvailableTags = availableTags.filter(tag => 
    !selectedTags.find(st => st.id === tag.id)
);

// Log changes for tracking with more detailed info
$: {
    console.log('🏷️ TagSelector - Current selectedTags:', selectedTags.map(t => ({ 
        id: t?.id, 
        name: t?.name, 
        color: t?.color,
        isValid: !!(t?.id && t?.name && t?.color),
        fullObject: t
    })));
    console.log('🏷️ TagSelector - Available tags count:', availableTags.length);
    console.log('🏷️ TagSelector - Filtered available tags count:', filteredAvailableTags.length);
    
    // Check for invalid tags
    const invalidTags = selectedTags.filter(t => !t?.id || !t?.name);
    if (invalidTags.length > 0) {
        console.warn('⚠️ TagSelector - Found invalid tags in selectedTags:', invalidTags);
    }
}

function addTag(tag: Tag) {
    if (!selectedTags.find(t => t.id === tag.id)) {
        console.log('➕ TagSelector - Adding tag:', { id: tag.id, name: tag.name, color: tag.color });
        selectedTags = [...selectedTags, tag];
        console.log('➕ TagSelector - Selected tags after addition:', selectedTags.map(t => ({ id: t.id, name: t.name })));
    } else {
        console.log('⚠️ TagSelector - Tag already selected:', { id: tag.id, name: tag.name });
    }
}

function removeTag(tagId: string) {
    const tagToRemove = selectedTags.find(t => t.id === tagId);
    console.log('➖ TagSelector - Removing tag:', tagToRemove ? { id: tagToRemove.id, name: tagToRemove.name } : 'Tag not found');
    selectedTags = selectedTags.filter(t => t.id !== tagId);
    console.log('➖ TagSelector - Selected tags after removal:', selectedTags.map(t => ({ id: t.id, name: t.name })));
}

async function createNewTag() {
    if (!newTagName.trim() || isCreatingTag) return;
    
    isCreatingTag = true;
    console.log('🆕 TagSelector - Creating new tag:', { name: newTagName.trim(), color: newTagColor });
    
    try {
        const tagData = {
            name: newTagName.trim(),
            color: newTagColor,
            description: undefined, // TagSelector doesn't have description field
            parent_id: undefined // TagSelector doesn't handle parent tags
        };
        
        console.log('🆕 TagSelector - Sending tag data to API:', tagData);
        
        // Use the tagsStore.addTag method which returns the newly created tag
        const newTag = await tagsStore.addTag(tagData);
        
        console.log('✅ TagSelector - Tag created successfully:', { id: newTag.id, name: newTag.name, color: newTag.color });
        console.log('✅ TagSelector - Full created tag object:', newTag);
        
        // Add the newly created tag to selectedTags
        selectedTags = [...selectedTags, newTag];
        console.log('✅ TagSelector - Selected tags after adding new tag:', selectedTags.map(t => ({ id: t.id, name: t.name })));
        
        // Reset form
        newTagName = '';
        newTagColor = '#CC7722';
        showTagInput = false;
        
    } catch (error) {
        console.error('❌ TagSelector - Error creating tag:', error);
        // You might want to show an error message to the user here
    } finally {
        isCreatingTag = false;
    }
}

function cancelNewTag() {
    newTagName = '';
    newTagColor = '#CC7722';
    showTagInput = false;
}
</script>

<div class="space-y-4">
    <!-- Linked Tags Section -->
    {#if selectedTags.length > 0}
    <div class="space-y-2">
        <h3 class="text-sm font-medium text-gray-300">Linked Tags</h3>
        <div class="flex flex-wrap gap-2">
            {#each selectedTags as tag}
                {#if tag && tag.id && tag.name && tag.color}
                <span 
                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200"
                    style="background-color: {tag.color}20; color: {tag.color}; border: 1px solid {tag.color}"
                >
                    {tag.name}
                    <button
                        on:click={() => removeTag(tag.id)}
                        class="ml-2 hover:text-red-400 transition-colors"
                        aria-label="Remove {tag.name} tag"
                    >
                        <X class="w-3 h-3" />
                    </button>
                </span>
                {:else}
                <!-- Fallback for invalid tags -->
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900/20 text-red-400 border border-red-700">
                    Invalid Tag (ID: {tag?.id || 'unknown'})
                    <button
                        on:click={() => removeTag(tag?.id || '')}
                        class="ml-2 hover:text-red-300 transition-colors"
                    >
                        <X class="w-3 h-3" />
                    </button>
                </span>
                {/if}
            {/each}
        </div>
    </div>
    {/if}

    <!-- Available Tags Section -->
    <div class="space-y-2">
        <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-300">Available Tags</h3>
            <button
                on:click={() => showTagInput = true}
                class="text-sm text-yellow-600 hover:text-yellow-500 flex items-center space-x-1 transition-colors"
            >
                <Plus class="w-3 h-3" />
                <span>New Tag</span>
            </button>
        </div>

        <!-- New Tag Form -->
        {#if showTagInput}
        <div class="bg-gray-700 p-3 rounded-lg space-y-3 border border-gray-600">
            {#if isCreatingTag}
                <div class="text-center py-2">
                    <div class="flex items-center justify-center space-x-2 text-yellow-400">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="text-sm">Creating tag "{newTagName}"...</span>
                    </div>
                </div>
            {:else}
                <div class="flex space-x-2">
                    <input
                        type="text"
                        bind:value={newTagName}
                        placeholder="Tag name..."
                        class="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-600 focus:border-yellow-600"
                        on:keydown={(e) => e.key === 'Enter' && createNewTag()}
                        autofocus
                    />
                    <input
                        type="color"
                        bind:value={newTagColor}
                        class="w-12 h-9 rounded border border-gray-500 bg-gray-600 cursor-pointer"
                        title="Choose tag color"
                    />
                </div>
                <div class="flex justify-end space-x-2">
                    <button
                        on:click={cancelNewTag}
                        class="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors rounded"
                    >
                        Cancel
                    </button>
                    <button
                        on:click={createNewTag}
                        class="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!newTagName.trim() || isCreatingTag}
                    >
                        {#if isCreatingTag}
                            <span class="flex items-center space-x-1">
                                <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Creating...</span>
                            </span>
                        {:else}
                            Create
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
        {/if}

        <!-- Available Tags List -->
        {#if filteredAvailableTags.length > 0}
        <div class="max-h-32 overflow-y-auto border border-gray-600 rounded-lg p-2">
            <div class="flex flex-wrap gap-2">
                {#each filteredAvailableTags as tag}
                <button
                    on:click={() => addTag(tag)}
                    class="px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm"
                    style="background-color: {tag.color}15; color: {tag.color}; border: 1px solid {tag.color}30"
                >
                    {tag.name}
                </button>
                {/each}
            </div>
        </div>
        {:else}
        <div class="text-sm text-gray-500 text-center py-4 border border-gray-600 rounded-lg bg-gray-800/50">
            {#if availableTags.length === 0}
                No tags available. Create your first tag above.
            {:else}
                All available tags are already linked to this project.
            {/if}
        </div>
        {/if}
    </div>
</div>