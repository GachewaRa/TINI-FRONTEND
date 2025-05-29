<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, Folder, FileText, Calendar, Tag as TagIcon, Filter, RefreshCw, AlertCircle } from 'lucide-svelte';
  // --- START MODIFICATION (Imports) ---
  // Import the specific stores and their methods
  import { projectsStore, projects, projectsLoading, projectsError } from '$lib/stores/projects';
  import { projectFoldersStore, projectFolders, projectFoldersLoading, projectFoldersError } from '$lib/stores/projectFolders';
  import { tagsStore, tags, tagsLoading, tagsError } from '$lib/stores/tags'; // Assuming tags store is already set up to fetch from API
  // --- END MODIFICATION (Imports) ---

  import SearchFilter from '$lib/components/SearchFilter.svelte';
  import type { Project, ProjectFolder, Tag } from '$lib/types/projects'; // Adjust path if needed
  
  let searchTerm = '';
  let selectedTags: Tag[] = [];
  let selectedFolder: ProjectFolder | null = null;
  let filteredProjects: Project[] = [];
  let showFilters = false;
  
  // --- START MODIFICATION (Reactive Store Values) ---
  // Reactive values from stores
  $: allProjects = $projects;
  $: allFolders = $projectFolders;
  $: isLoading = $projectsLoading || $projectFoldersLoading || $tagsLoading; // Include tagsLoading if SearchFilter relies on it
  $: error = $projectsError || $projectFoldersError || $tagsError; // Include tagsError
  $: totalProjects = allProjects.length;
  // --- END MODIFICATION (Reactive Store Values) ---

  // --- START MODIFICATION (onMount and Refresh) ---
  onMount(async () => {
    // Load projects, folders, and tags from the backend
    await Promise.all([
      projectsStore.load(),
      projectFoldersStore.load(),
      tagsStore.load() // Load tags as well, as SearchFilter needs them
    ]).catch(err => {
      // Errors are handled by the stores, but log here for debugging
      console.error('Initial data load failed:', err);
    });
  });
  
  async function handleRefresh() {
    await Promise.all([
      projectsStore.refresh(),
      projectFoldersStore.refresh(),
      tagsStore.refresh() // Refresh tags too
    ]).catch(err => {
      console.error('Refresh failed:', err);
    });
  }
  // --- END MODIFICATION (onMount and Refresh) ---
  
  // Reactive filtering logic remains mostly the same, just using `allProjects`
  $: {
    filteredProjects = allProjects.filter(project => {
      // Text search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesText = 
          project.title.toLowerCase().includes(term) ||
          project.content.toLowerCase().includes(term);
        if (!matchesText) return false;
      }
      
      // Folder filter
      if (selectedFolder && project.folder_id !== selectedFolder.id) {
        return false;
      }
      
      // Tag filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag =>
          project.tags.some(projectTag => projectTag.id === tag.id)
        );
        if (!hasAllTags) return false;
      }
      
      return true;
    });
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-400/10';
      case 'DRAFT':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'COMPLETED':
        return 'text-blue-400 bg-blue-400/10';
      case 'ARCHIVED':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  }
  
  function getProjectFolder(folderId: string | undefined): ProjectFolder | undefined {
    return allFolders.find(f => f.id === folderId);
  }
  
  function clearFilters() {
    selectedTags = [];
    selectedFolder = null;
    searchTerm = '';
  }
</script>

<svelte:head>
  <title>Projects - PKMS</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Projects</h1>
      <p class="text-gray-400 mt-1">{filteredProjects.length} projects found</p>
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
      <a href="/projects/folders" class="btn-secondary flex items-center space-x-2">
        <Folder class="w-4 h-4" />
        <span>Manage Folders</span>
      </a>
      <a href="/projects/new" class="btn-primary flex items-center space-x-2">
        <Plus class="w-4 h-4" />
        <span>New Project</span>
      </a>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start space-x-3">
      <AlertCircle class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-red-400 font-medium">Error loading projects or folders</h3>
        <p class="text-red-300 mt-1">{error}</p>
      </div>
      <button 
        on:click={() => { projectsStore.clearError(); projectFoldersStore.clearError(); tagsStore.clearError(); }}
        class="text-red-400 hover:text-red-300"
      >
        ×
      </button>
    </div>
  {/if}
  <div class="space-y-4">
    <div class="flex items-center space-x-4">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search projects by title or content..."
          bind:value={searchTerm}
          class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
        />
      </div>
      <button
        on:click={() => showFilters = !showFilters}
        class="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-700 transition-colors flex items-center space-x-2"
        class:bg-yellow-600={showFilters}
        class:border-yellow-600={showFilters}
        class:text-black={showFilters}
      >
        <Filter class="w-4 h-4" />
        <span>Filters</span>
      </button>
    </div>
    
    {#if showFilters}
      <div class="card p-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Filter by Folder</label>
            <select
              bind:value={selectedFolder}
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-600"
            >
              <option value={null}>All folders</option>
              {#each allFolders as folder}
                <option value={folder}>{folder.name}</option>
              {/each}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Filter by Tags</label>
            <SearchFilter
              bind:selectedTags
              placeholder="Select tags to filter..."
              
              allTags={$tags} 
              
              compact={true}
            />
          </div>
        </div>
        
        <div class="flex items-center justify-between pt-2 border-t border-gray-700">
          <div class="text-sm text-gray-400">
            {filteredProjects.length} of {allProjects.length} projects shown
          </div>
          <button
            on:click={clearFilters}
            class="text-sm text-yellow-600 hover:text-yellow-500 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </div>
    {/if}
  </div>
  
  {#if isLoading && allProjects.length === 0 && !error}
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3 text-gray-400">
        <RefreshCw class="w-5 h-5 animate-spin" />
        <span>Loading projects...</span>
      </div>
    </div>
  {:else}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredProjects as project (project.id)}
        <div class="card p-6 hover:shadow-xl transition-all duration-200 group">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-200 group-hover:text-yellow-600 transition-colors line-clamp-2">
                {project.title}
              </h3>
              {#if project.folder_id}
                {@const folder = getProjectFolder(project.folder_id)}
                {#if folder}
                  <div class="flex items-center space-x-1 mt-2">
                    <Folder class="w-3 h-3 text-gray-500" />
                    <span class="text-xs text-gray-500">{folder.name}</span>
                  </div>
                {/if}
              {/if}
            </div>
            <span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          
          <div class="text-gray-400 text-sm leading-relaxed mb-4">
            <p class="line-clamp-3">
              {project.content.replace(/<[^>]*>/g, '').substring(0, 120)}
              {#if project.content.replace(/<[^>]*>/g, '').length > 120}...{/if}
            </p>
          </div>
          
          {#if project.tags.length > 0}
            <div class="flex flex-wrap gap-1 mb-4">
              {#each project.tags.slice(0, 3) as tag}
                <span class="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                  {tag.name}
                </span>
              {/each}
              {#if project.tags.length > 3}
                <span class="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                  +{project.tags.length - 3}
                </span>
              {/if}
            </div>
          {/if}
          
          <div class="flex items-center justify-between pt-4 border-t border-gray-700">
            <div class="flex items-center space-x-4 text-xs text-gray-500">
              <div class="flex items-center space-x-1">
                <Calendar class="w-3 h-3" />
                <span>{project.updated_at.toLocaleDateString()}</span>
              </div>
              <div class="flex items-center space-x-1">
                <FileText class="w-3 h-3" />
                <span>{(project.notes ?? []).length} notes</span>
              </div>
            </div>
            <a
              href="/projects/{project.id}"
              class="text-sm text-yellow-600 hover:text-yellow-500 transition-colors font-medium"
            >
              Open →
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  {#if !isLoading && filteredProjects.length === 0 && !error}
  <div class="text-center py-12">
      <FileText class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 class="lg:text-lg font-medium text-gray-400 mb-2">
        {allProjects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
      </h3>
      <p class="text-gray-500 mb-6">
        {allProjects.length === 0 
          ? 'Create your first project to start writing and organizing your ideas'
          : 'Try adjusting your search terms or filters'
        }
      </p>
      <div class="flex items-center justify-center space-x-3">
        {#if allProjects.length > 0}
          <button
            on:click={clearFilters}
            class="btn-secondary"
          >
            Clear Filters
          </button>
        {/if}
        <a href="/projects/new" class="btn-primary inline-flex items-center space-x-2">
          <Plus class="w-4 h-4" />
          <span>New Project</span>
        </a>
      </div>
    </div>
  {/if}
</div>