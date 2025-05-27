<!-- src/routes/projects/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Plus, Folder, FileText, Calendar, Tag as TagIcon, Filter } from 'lucide-svelte';
  import { projects, projectFolders, tags } from '$lib/stores';
  import SearchFilter from '$lib/components/SearchFilter.svelte';
  import type { Project, ProjectFolder, Tag } from '$lib/types';
  
  let searchTerm = '';
  let selectedTags: Tag[] = [];
  let selectedFolder: ProjectFolder | null = null;
  let filteredProjects: Project[] = [];
  let showFilters = false;
  
  // Mock data for projects and folders
  const mockFolders: ProjectFolder[] = [
    {
      id: '1',
      name: 'Research Papers',
      description: 'Academic research and analysis projects',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      projects: []
    },
    {
      id: '2',
      name: 'Personal Essays',
      description: 'Personal writing and reflection pieces',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15'),
      projects: []
    }
  ];
  
  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'The Nature of Consciousness',
      content: '<p>Exploring the hard problem of consciousness and various theoretical frameworks...</p>',
      status: 'ACTIVE',
      folder_id: '1',
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-15'),
      tags: [],
      notes: []
    },
    {
      id: '2',
      title: 'Machine Learning Ethics',
      content: '<p>Investigating ethical implications of AI systems in society...</p>',
      status: 'ACTIVE',
      folder_id: '1',
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-02-10'),
      tags: [],
      notes: []
    },
    {
      id: '3',
      title: 'Personal Growth Journal',
      content: '<p>Reflections on learning, growth, and self-improvement...</p>',
      status: 'COMPLETED',
      folder_id: '2',
      created_at: new Date('2024-02-05'),
      updated_at: new Date('2024-02-12'),
      tags: [],
      notes: []
    }
  ];
  
  onMount(() => {
    projectFolders.set(mockFolders);
    projects.set(mockProjects);
  });
  
  // Reactive filtering
  $: {
    filteredProjects = $projects.filter(project => {
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
    return $projectFolders.find(f => f.id === folderId);
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
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-200">Projects</h1>
      <p class="text-gray-400 mt-1">{filteredProjects.length} projects found</p>
    </div>
    
    <div class="flex items-center space-x-3">
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
  
  <!-- Search and Filters -->
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
          <!-- Folder Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Filter by Folder</label>
            <select
              bind:value={selectedFolder}
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-600"
            >
              <option value={null}>All folders</option>
              {#each $projectFolders as folder}
                <option value={folder}>{folder.name}</option>
              {/each}
            </select>
          </div>
          
          <!-- Tag Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Filter by Tags</label>
            <SearchFilter
              bind:selectedTags
              placeholder="Select tags to filter..."
              compact={true}
            />
          </div>
        </div>
        
        <div class="flex items-center justify-between pt-2 border-t border-gray-700">
          <div class="text-sm text-gray-400">
            {filteredProjects.length} of {$projects.length} projects shown
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
  
  <!-- Projects Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredProjects as project (project.id)}
      <div class="card p-6 hover:shadow-xl transition-all duration-200 group">
        <!-- Header -->
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
        
        <!-- Content Preview -->
        <div class="text-gray-400 text-sm leading-relaxed mb-4">
          <p class="line-clamp-3">
            {project.content.replace(/<[^>]*>/g, '').substring(0, 120)}
            {#if project.content.replace(/<[^>]*>/g, '').length > 120}...{/if}
          </p>
        </div>
        
        <!-- Tags -->
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
        
        <!-- Footer -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-700">
          <div class="flex items-center space-x-4 text-xs text-gray-500">
            <div class="flex items-center space-x-1">
              <Calendar class="w-3 h-3" />
              <span>{project.updated_at.toLocaleDateString()}</span>
            </div>
            <div class="flex items-center space-x-1">
              <FileText class="w-3 h-3" />
              <span>{project.notes.length} notes</span>
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
  
  <!-- Empty State -->
  {#if filteredProjects.length === 0}
    <div class="text-center py-12">
      <FileText class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-400 mb-2">
        {$projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
      </h3>
      <p class="text-gray-500 mb-6">
        {$projects.length === 0 
          ? 'Create your first project to start writing and organizing your ideas'
          : 'Try adjusting your search terms or filters'
        }
      </p>
      <div class="flex items-center justify-center space-x-3">
        {#if $projects.length > 0}
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