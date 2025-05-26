<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
  import { 
    Home, 
    FileText, 
    Tag, 
    Highlighter, 
    FolderOpen, 
    MessageSquare, 
    Layers 
  } from 'lucide-svelte';
  
  export let currentRoute: string | null;
  
  const menuItems = [
    { 
      name: 'Dashboard', 
      route: '/', 
      icon: Home,
      active: true 
    },
    { 
      name: 'Notes', 
      route: '/notes', 
      icon: FileText,
      active: true 
    },
    { 
      name: 'Tags', 
      route: '/tags', 
      icon: Tag,
      active: true 
    },
    { 
      name: 'Highlights', 
      route: '/highlights', 
      icon: Highlighter,
      active: true 
    },
    { 
      name: 'Projects', 
      route: '/projects', 
      icon: FolderOpen,
      active: true 
    },
    { 
      name: 'Matters', 
      route: '/matters', 
      icon: MessageSquare,
      active: false 
    },
    { 
      name: 'Threads', 
      route: '/threads', 
      icon: Layers,
      active: false 
    }
  ];
</script>

<aside class="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
  <!-- Logo -->
<div class="p-6 border-b border-gray-700">
  <img src="AKTABALOGO.png" alt="AKTABA Logo" class="h-auto w-full max-w-[150px] mx-auto block">
</div>
  
  <!-- Navigation -->
  <nav class="flex-1 p-4">
    <ul class="space-y-2">
      {#each menuItems as item}
        <li>
          <a 
            href={item.active ? item.route : '#'}
            class="flex items-center px-4 py-3 rounded-lg transition-colors
              {currentRoute === item.route 
                ? 'bg-yellow-600 text-white' 
                : item.active 
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-500 cursor-not-allowed'
              }"
            class:opacity-50={!item.active}
          >
            <svelte:component this={item.icon} class="w-5 h-5 mr-3" />
            {item.name}
            {#if !item.active}
              <span class="ml-auto text-xs text-gray-500">Soon</span>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</aside>
