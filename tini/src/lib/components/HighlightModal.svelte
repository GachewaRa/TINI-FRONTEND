<!-- src/lib/components/HighlightModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Palette, MessageSquare } from 'lucide-svelte';
  import type { TextSelection } from '$lib/types/document';

  export let isOpen = false;
  export let selection: TextSelection | null = null;
  export let isLoading = false;

  const dispatch = createEventDispatcher<{
    create: { color: string; userNote?: string };
    close: void;
  }>();

  let selectedColor = '#ffff00';
  let userNote = '';
  let chapterTitle = '';

  const highlightColors = [
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#90ee90' },
    { name: 'Blue', value: '#87ceeb' },
    { name: 'Pink', value: '#ffb6c1' },
    { name: 'Orange', value: '#ffa500' },
    { name: 'Purple', value: '#dda0dd' }
  ];

  function handleSubmit() {
    if (selection) {
      dispatch('create', {
        color: selectedColor,
        userNote: userNote.trim() || undefined
      });
    }
  }

  function handleClose() {
    dispatch('close');
    resetForm();
  }

  function resetForm() {
    selectedColor = '#ffff00';
    userNote = '';
    chapterTitle = '';
  }

  $: if (selection) {
    chapterTitle = selection.chapter_title || '';
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-40" 
    on:click={handleClose}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
  ></div>

  <!-- Modal -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-gray-200 flex items-center space-x-2">
          <Palette class="w-5 h-5 text-yellow-600" />
          <span>Add Highlight</span>
        </h2>
        <button
          on:click={handleClose}
          class="text-gray-400 hover:text-gray-200 transition-colors"
          disabled={isLoading}
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      {#if selection}
        <div class="p-6 space-y-6">
          <!-- Selected Text -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Selected Text
            </label>
            <div class="bg-gray-900 border border-gray-600 rounded-lg p-4 max-h-32 overflow-y-auto">
              <p class="text-gray-200 leading-relaxed">"{selection.selected_text}"</p>
            </div>
          </div>

          <!-- Page and Chapter Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Page Number
              </label>
              <input
                type="number"
                value={selection.page_number}
                readonly
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-600"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Chapter (optional)
              </label>
              <input
                type="text"
                bind:value={chapterTitle}
                placeholder="Enter chapter title..."
                disabled={isLoading}
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Color Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-3">
              Highlight Color
            </label>
            <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
              {#each highlightColors as color}
                <button
                  type="button"
                  on:click={() => selectedColor = color.value}
                  disabled={isLoading}
                  class="relative p-3 rounded-lg border-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  class:border-white={selectedColor === color.value}
                  class:border-gray-600={selectedColor !== color.value}
                  style="background-color: {color.value};"
                  title={color.name}
                >
                  {#if selectedColor === color.value}
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="w-3 h-3 bg-gray-900 rounded-full"></div>
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          </div>

          <!-- User Note -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
              <MessageSquare class="w-4 h-4" />
              <span>Note (optional)</span>
            </label>
            <textarea
              bind:value={userNote}
              placeholder="Add a personal note about this highlight..."
              rows="3"
              disabled={isLoading}
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 resize-none disabled:opacity-50"
              maxlength="1000"
            ></textarea>
            <p class="text-xs text-gray-400 mt-1">
              {userNote.length}/1000 characters
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              on:click={handleClose}
              disabled={isLoading}
              class="px-4 py-2 text-gray-300 hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              on:click={handleSubmit}
              disabled={isLoading || !selection.selected_text.trim()}
              class="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isLoading}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding...</span>
              {:else}
                <Palette class="w-4 h-4" />
                <span>Add Highlight</span>
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}