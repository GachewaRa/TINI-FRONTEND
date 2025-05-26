<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { page } from '$app/stores';
  
  $: currentRoute = $page.route.id;
</script>

<div class="flex h-screen bg-gray-900 text-gray-100">
  <Sidebar {currentRoute} />
  
  <main class="flex-1 overflow-auto">
    <div class="p-6">
      <slot />
    </div>
  </main>
</div>

