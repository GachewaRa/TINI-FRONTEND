<!-- src/routes/highlights/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, BookOpen, Calendar } from 'lucide-svelte';
  import { highlights } from '$lib/stores';
  import type { Highlight } from '$lib/types';
  
  let searchTerm = '';
  let filteredHighlights: Highlight[] = [];
  
  // Mock data for highlights
  const mockHighlights: Highlight[] = [
    {
      id: '1',
      content: 'Consciousness is perhaps the greatest mystery in science. Despite centuries of inquiry, we still struggle to understand how subjective experience arises from objective neural processes. The question of how matter gives rise to mind remains one of the most profound challenges in neuroscience and philosophy. Various theories have been proposed, from materialist reductions to dualist explanations, yet none have fully solved the puzzle.',
      book_title: 'Consciousness Explained',
      author: 'Daniel Dennett',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
      notes_from_highlight: []
    },
    {
      id: '2',
      content: 'The hard problem of consciousness is not about the functional aspects of consciousness—the ways in which information is integrated, discriminated, and accessed. It is about experience itself. When we see red, feel pain, or taste coffee, there is something it is like to have these experiences. This qualitative, subjective aspect of mental states is what philosophers call qualia, and it poses a unique challenge to our understanding of mind.',
      book_title: 'The Conscious Mind',
      author: 'David Chalmers',
      created_at: new Date('2024-02-10'),
      updated_at: new Date('2024-02-10'),
      notes_from_highlight: []
    },
    {
      id: '3',
      content: 'Machine learning has revolutionized our approach to artificial intelligence. Instead of programming explicit rules, we now create systems that learn patterns from data. Deep neural networks, inspired by the structure of the human brain, have achieved remarkable success in tasks ranging from image recognition to natural language processing.',
      book_title: 'Deep Learning',
      author: 'Ian Goodfellow',
      created_at: new Date('2024-03-05'),
      updated_at: new Date('2024-03-05'),
      notes_from_highlight: []
    }
  ];
  
  onMount(() => {
    highlights.set(mockHighlights);
  });
  
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
      <p class="text-gray-400 mt-1">{filteredHighlights.length} highlights found</p>
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
      class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
    />
  </div>
  
  <!-- Highlights List -->
  <div class="space-y-4">
    {#each filteredHighlights as highlight (highlight.id)}
      <div class="card p-6 hover:shadow-xl transition-all duration-200 border-l-4 border-yellow-600">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <BookOpen class="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 class="text-lg font-semibold text-yellow-600">{highlight.book_title}</h3>
              {#if highlight.author}
                <p class="text-sm text-gray-400 flex items-center space-x-1">
                  <span>by {highlight.author}</span>
                </p>
              {/if}
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-xs text-gray-500 flex items-center space-x-1">
                <Calendar class="w-3 h-3" />
                <span>{highlight.created_at.toLocaleDateString()}</span>
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {highlight.notes_from_highlight.length} notes created
              </p>
            </div>
            <a 
              href="/highlights/{highlight.id}"
              class="text-sm text-yellow-600 hover:text-yellow-500 transition-colors font-medium"
            >
              Open →
            </a>
          </div>
        </div>
        
        <!-- Content Preview -->
        <div class="text-gray-300 leading-relaxed">
          <p class="line-clamp-4">
            {highlight.content.substring(0, 400)}
            {#if highlight.content.length > 400}...{/if}
          </p>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <div class="text-xs text-gray-500">
            {Math.ceil(highlight.content.length / 5)} words
          </div>
          <div class="flex items-center space-x-2">
            <button 
              class="text-xs text-gray-400 hover:text-yellow-600 transition-colors"
              on:click={() => navigator.clipboard.writeText(highlight.content)}
            >
              Copy Content
            </button>
          </div>
        </div>
      </div>
    {/each}
    
    {#if filteredHighlights.length === 0}
      <div class="text-center py-12">
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
</div>