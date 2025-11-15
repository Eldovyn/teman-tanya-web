<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const hasSidebar = computed(() => route.meta.sidebar === true)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <template v-if="hasSidebar">
      <SidebarProvider>
        <AppSidebar />
        <main class="flex-1">
          <SidebarTrigger />
          <component :is="Component" />
        </main>
      </SidebarProvider>
    </template>

    <template v-else>
      <main>
        <component :is="Component" />
      </main>
    </template>
  </RouterView>
</template>
