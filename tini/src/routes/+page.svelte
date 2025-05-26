<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, FileText, Tag, Highlighter, FolderOpen, TrendingUp } from 'lucide-svelte';
  import { notes, tags, highlights, projects, mockNotes, mockTags } from '$lib/stores';
  
  let stats = {
    totalNotes: 0,
    totalTags: 0,
    totalHighlights: 0,
    totalProjects: 0
  };
  
  onMount(() => {
    // Initialize with mock data
    notes.set(mockNotes);
    tags.set(mockTags);
    
    // Update stats
    notes.subscribe(n => stats.totalNotes = n.length);
    tags.subscribe(t => stats.totalTags = t.length);
    highlights.subscribe(h => stats.totalHighlights = h.length);
    projects.subscribe(p => stats.totalProjects = p.length);
  });
  
  const quickActions = [
    {
      title: 'New Note',
      description: 'Create a new note',
      icon: FileText,
      route: '/notes/new',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      title: 'New Project',
      description: 'Start a new project',
      icon: FolderOpen,
      route: '/projects/new',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'New Highlight',
      description: 'Add book highlights',
      icon: Highlighter,
      route: '/highlights/new',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Manage Tags',
      description: 'Organize your tags',
      icon: Tag,
      route: '/tags',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];
</script>

<svelte:head>
  <title>Dashboard - PKMS</title>
</svelte:head>

<div class="space-y-8">
  <!-- Welcome Section -->
  <div class="text-center">
    <h1 class="text-4xl font-bold text-yellow-600 mb-2">Welcome to Your PKMS</h1>
    <p class="text-xl text-gray-400">Personal Knowledge Management System</p>
  </div>
  
  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-300">Notes</h3>
          <p class="text-3xl font-bold text-yellow-600">{stats.totalNotes}</p>
        </div>
        <FileText class="w-8 h-8 text-yellow-600" />
      </div>
    </div>
    
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-300">Tags</h3>
          <p class="text-3xl font-bold text-purple-600">{stats.totalTags}</p>
        </div>
        <Tag class="w-8 h-8 text-purple-600" />
      </div>
    </div>
    
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-300">Highlights</h3>
          <p class="text-3xl font-bold text-green-600">{stats.totalHighlights}</p>
        </div>
        <Highlighter class="w-8 h-8 text-green-600" />
      </div>
    </div>
    
    <div class="card p-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-300">Projects</h3>
          <p class="text-3xl font-bold text-blue-600">{stats.totalProjects}</p>
        </div>
        <FolderOpen class="w-8 h-8 text-blue-600" />
      </div>
    </div>
  </div>
  
  <!-- Quick Actions -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-200">Quick Actions</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each quickActions as action}
        <a 
          href={action.route}
          class="card p-6 transition-all duration-200 hover:scale-105 hover:shadow-xl {action.color} text-white"
        >
          <div class="flex items-center space-x-4">
            <svelte:component this={action.icon} class="w-6 h-6" />
            <div>
              <h3 class="font-semibold">{action.title}</h3>
              <p class="text-sm opacity-90">{action.description}</p>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
  
  <!-- Recent Activity -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-200">Recent Activity</h2>
    <div class="card p-6">
      <div class="flex items-center space-x-2 text-gray-400 mb-4">
        <TrendingUp class="w-5 h-5" />
        <span>Latest updates to your knowledge base</span>
      </div>
      
      <div class="space-y-3">
        <div class="flex items-center justify-between py-2 border-b border-gray-700">
          <div class="flex items-center space-x-3">
            <FileText class="w-4 h-4 text-yellow-600" />
            <span class="text-gray-300">Created note: "Consciousness and AI"</span>
          </div>
          <span class="text-sm text-gray-500">2 hours ago</span>
        </div>
        
        <div class="flex items-center justify-between py-2 border-b border-gray-700">
          <div class="flex items-center space-x-3">
            <Tag class="w-4 h-4 text-purple-600" />
            <span class="text-gray-300">Added tag: "Neuroscience"</span>
          </div>
          <span class="text-sm text-gray-500">1 day ago</span>
        </div>
        
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center space-x-3">
            <FolderOpen class="w-4 h-4 text-blue-600" />
            <span class="text-gray-300">Updated project: "AI Research"</span>
          </div>
          <span class="text-sm text-gray-500">3 days ago</span>
        </div>
      </div>
    </div>
  </div>
</div>