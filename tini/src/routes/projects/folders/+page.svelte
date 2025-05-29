<!-- src/routes/projects/folders/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    Folder, 
    Plus, 
    Edit3, 
    Trash2, 
    FolderOpen, 
    ArrowLeft, 
    Search,
    AlertCircle,
    RefreshCw,
    FileText,
    Calendar,
    MoreVertical
  } from 'lucide-svelte';
  import { projectFoldersStore, projectFolders, projectFoldersLoading, projectFoldersError } from '$lib/stores/projectFolders';
  import { ProjectFoldersAPI } from '$lib/api/projectFolders';
  import { ProjectsAPI } from '$lib/api/projects';
  import type { ProjectFolder, ProjectFolderCreate, ProjectFolderUpdate, Project } from '$lib/types/projects';
  
  let searchTerm = '';
  let showCreateForm = false;
  let editingFolder: ProjectFolder | null = null;
  let deletingFolder: ProjectFolder | null = null;
  let expandedFolder: ProjectFolder | null = null;
  let folderProjects: Project[] = [];
  let loadingProjects = false;
  
  // Form data
  let newFolderName = '';
  let newFolderDescription = '';
  let editFolderName = '';
  let editFolderDescription = '';
  
  // Reactive values
  $: allFolders = $projectFolders;
  $: isLoading = $projectFoldersLoading;
  $: error = $projectFoldersError;
  
  $: filteredFolders = allFolders.filter(folder => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return folder.name.toLowerCase().includes(term) || 
           (folder.description && folder.description.toLowerCase().includes(term));
  });
  
  onMount(async () => {
    await projectFoldersStore.load();
  });
  
  async function handleRefresh() {
    await projectFoldersStore.refresh();
    if (expandedFolder) {
      await loadFolderProjects(expandedFolder);
    }
  }
  
  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    
    try {
      const folderData: ProjectFolderCreate = {
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined
      };
      
      await ProjectFoldersAPI.createProjectFolder(folderData);
      await projectFoldersStore.refresh();
      
      // Reset form
      newFolderName = '';
      newFolderDescription = '';
      showCreateForm = false;
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  }
  
  async function handleEditFolder() {
    if (!editingFolder || !editFolderName.trim()) return;
    
    try {
      const folderData: ProjectFolderUpdate = {
        name: editFolderName.trim(),
        description: editFolderDescription.trim() || undefined
      };
      
      await ProjectFoldersAPI.updateProjectFolder(editingFolder.id, folderData);
      await projectFoldersStore.refresh();
      
      editingFolder = null;
      editFolderName = '';
      editFolderDescription = '';
    } catch (err) {
      console.error('Failed to update folder:', err);
    }
  }
  
  async function handleDeleteFolder() {
    if (!deletingFolder) return;
    
    try {
      await ProjectFoldersAPI.deleteProjectFolder(deletingFolder.id);
      await projectFoldersStore.refresh();
      
      // Close expanded view if we deleted the expanded folder
      if (expandedFolder?.id === deletingFolder.id) {
        expandedFolder = null;
        folderProjects = [];
      }
      
      deletingFolder = null;
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  }
  
  async function loadFolderProjects(folder: ProjectFolder) {
    if (expandedFolder?.id === folder.id) {
      // Collapse if already expanded
      expandedFolder = null;
      folderProjects = [];
      return;
    }
    
    loadingProjects = true;
    try {
      folderProjects = await ProjectsAPI.getProjectsInFolder(folder.id);
      expandedFolder = folder;
    } catch (err) {
      console.error('Failed to load folder projects:', err);
      folderProjects = [];
    } finally {
      loadingProjects = false;
    }
  }
  
  function startEdit(folder: ProjectFolder) {
    editingFolder = folder;
    editFolderName = folder.name;
    editFolderDescription = folder.description || '';
  }
  
  function cancelEdit() {
    editingFolder = null;
    editFolderName = '';
    editFolderDescription = '';
  }
  
  function startDelete(folder: ProjectFolder) {
    deletingFolder = folder;
  }
  
  function cancelDelete() {
    deletingFolder = null;
  }
</script>

<svelte:head>
  <title>Manage Folders - PKMS</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <button
        on:click={() => goto('/projects')}
        class="btn-secondary flex items-center space-x-2"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Back to Projects</span>
      </button>
      <div>
        <h1 class="text-3xl font-bold text-gray-200">Manage Folders</h1>
        <p class="text-gray-400 mt-1">{filteredFolders.length} folders found</p>
      </div>
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
      <button
        on:click={() => showCreateForm = !showCreateForm}
        class="btn-primary flex items-center space-x-2"
      >
        <Plus class="w-4 h-4" />
        <span>New Folder</span>
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start space-x-3">
      <AlertCircle class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-red-400 font-medium">Error loading folders</h3>
        <p class="text-red-300 mt-1">{error}</p>
      </div>
      <button 
        on:click={() => projectFoldersStore.clearError()}
        class="text-red-400 hover:text-red-300"
      >
        ×
      </button>
    </div>
  {/if}
  
  <!-- Search Bar -->
  <div class="relative">
    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search folders by name or description..."
      bind:value={searchTerm}
      class="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
    />
  </div>
  
  <!-- Create Folder Form -->
  {#if showCreateForm}
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-200 mb-4">Create New Folder</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Folder Name *</label>
          <input
            type="text"
            bind:value={newFolderName}
            placeholder="Enter folder name..."
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
          <textarea
            bind:value={newFolderDescription}
            placeholder="Enter folder description..."
            rows="3"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 resize-none"
          ></textarea>
        </div>
        <div class="flex items-center space-x-3">
          <button
            on:click={handleCreateFolder}
            disabled={!newFolderName.trim()}
            class="btn-primary"
          >
            Create Folder
          </button>
          <button
            on:click={() => { showCreateForm = false; newFolderName = ''; newFolderDescription = ''; }}
            class="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Folders List -->
  {#if isLoading && allFolders.length === 0}
    <div class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3 text-gray-400">
        <RefreshCw class="w-5 h-5 animate-spin" />
        <span>Loading folders...</span>
      </div>
    </div>
  {:else if filteredFolders.length === 0}
    <div class="text-center py-12">
      <Folder class="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-400 mb-2">
        {allFolders.length === 0 ? 'No folders yet' : 'No folders match your search'}
      </h3>
      <p class="text-gray-500 mb-6">
        {allFolders.length === 0 
          ? 'Create your first folder to organize your projects'
          : 'Try adjusting your search terms'
        }
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each filteredFolders as folder (folder.id)}
        <div class="card p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              {#if editingFolder?.id === folder.id}
                <!-- Edit Form -->
                <div class="space-y-4">
                  <div>
                    <input
                      type="text"
                      bind:value={editFolderName}
                      class="text-lg font-semibold bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200 w-full focus:outline-none focus:ring-2 focus:ring-yellow-600"
                    />
                  </div>
                  <div>
                    <textarea
                      bind:value={editFolderDescription}
                      placeholder="Enter description..."
                      rows="2"
                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-600 resize-none"
                    ></textarea>
                  </div>
                  <div class="flex items-center space-x-3">
                    <button
                      on:click={handleEditFolder}
                      disabled={!editFolderName.trim()}
                      class="btn-primary text-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      on:click={cancelEdit}
                      class="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Display Mode -->
                <div>
                  <h3 class="text-lg font-semibold text-gray-200 mb-2">{folder.name}</h3>
                  {#if folder.description}
                    <p class="text-gray-400 text-sm mb-3">{folder.description}</p>
                  {/if}
                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <div class="flex items-center space-x-1">
                      <Calendar class="w-3 h-3" />
                      <span>Created {folder.created_at.toLocaleDateString()}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                      <FileText class="w-3 h-3" />
                      <span>{folder.projects?.length || 0} projects</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            
            {#if editingFolder?.id !== folder.id}
              <div class="flex items-center space-x-2">
                <button
                  on:click={() => loadFolderProjects(folder)}
                  class="p-2 text-gray-400 hover:text-yellow-600 hover:bg-gray-700 rounded transition-colors"
                  title="View projects in folder"
                >
                  <FolderOpen class="w-4 h-4" />
                </button>
                <button
                  on:click={() => startEdit(folder)}
                  class="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                  title="Edit folder"
                >
                  <Edit3 class="w-4 h-4" />
                </button>
                <button
                  on:click={() => startDelete(folder)}
                  class="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                  title="Delete folder"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/if}
          </div>
          
          <!-- Expanded Projects View -->
          {#if expandedFolder?.id === folder.id}
            <div class="mt-6 pt-6 border-t border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-md font-medium text-gray-300">Projects in this folder</h4>
                {#if loadingProjects}
                  <RefreshCw class="w-4 h-4 animate-spin text-gray-400" />
                {/if}
              </div>
              
              {#if loadingProjects}
                <div class="text-center py-4">
                  <span class="text-gray-400">Loading projects...</span>
                </div>
              {:else if folderProjects.length === 0}
                <div class="text-center py-4">
                  <p class="text-gray-500">No projects in this folder yet</p>
                  <a href="/projects/new" class="text-yellow-600 hover:text-yellow-500 text-sm mt-2 inline-block">
                    Create a new project →
                  </a>
                </div>
              {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {#each folderProjects as project}
                    <div class="bg-gray-700/50 rounded-lg p-4">
                      <h5 class="font-medium text-gray-200 mb-2">{project.title}</h5>
                      <p class="text-gray-400 text-sm mb-3 line-clamp-2">
                        {project.content.replace(/<[^>]*>/g, '').substring(0, 100)}
                        {#if project.content.replace(/<[^>]*>/g, '').length > 100}...{/if}
                      </p>
                      <div class="flex items-center justify-between">
                        <span class="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">
                          {project.status}
                        </span>
                        <a
                          href="/projects/{project.id}"
                          class="text-sm text-yellow-600 hover:text-yellow-500 transition-colors"
                        >
                          Open →
                        </a>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if deletingFolder}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex items-start space-x-3">
        <AlertCircle class="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-200 mb-2">Delete Folder</h3>
          <p class="text-gray-400 mb-4">
            Are you sure you want to delete the folder "<span class="font-medium">{deletingFolder.name}</span>"? 
            This action cannot be undone. Projects in this folder will not be deleted, but they will be moved to the "Uncategorized" section.
          </p>
          <div class="flex items-center space-x-3">
            <button
              on:click={handleDeleteFolder}
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete Folder
            </button>
            <button
              on:click={cancelDelete}
              class="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}