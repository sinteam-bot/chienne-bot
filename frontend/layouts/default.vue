<template>
  <div id="app-container" class="discord-app">
    <!-- Barre latérale principale (Chienne Bot, Modules, Games) -->
    <ChannelsSidebar />

    <!-- Zone principale de contenu injectée par la page Nuxt -->
    <main class="chat-main">
      <ChatHeader />
      <slot />
    </main>

    <!-- Modale Quick Switcher & Command Palette (Ctrl+K / Cmd+K) -->
    <QuickSwitcherModal />

    <!-- Modale d'inspection d'utilisateur globale -->
    <UserModal
      v-if="inspectedUser"
      :user="inspectedUser"
      @close="inspectedUser = null"
    />

    <!-- Modale d'authentification API -->
    <AuthModal />

    <!-- Toasts de notification -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { useRoute } from 'vue-router';
import { useAppState } from '~/composables/useAppState.ts';
import { useAuth } from '~/composables/useAuth.ts';

import ChannelsSidebar from '~/components/layout/ChannelsSidebar.vue';
import ChatHeader from '~/components/layout/ChatHeader.vue';
import QuickSwitcherModal from '~/components/common/QuickSwitcherModal.vue';
import UserModal from '~/components/common/UserModal.vue';
import AuthModal from '~/components/common/AuthModal.vue';
import ToastContainer from '~/components/common/ToastContainer.vue';

const route = useRoute();
useHead(() => {
  const meta = route.meta || {};
  const pageTitle = (meta.title as string) || 'Dashboard';
  const pageDesc = (meta.description as string) || (meta.topic as string) || 'Tableau de bord Discord';
  return {
    title: `${pageTitle} • Chienne Bot`,
    meta: [
      { name: 'description', content: pageDesc },
      { property: 'og:title', content: `${pageTitle} • Chienne Bot` },
      { property: 'og:description', content: pageDesc }
    ]
  };
});

const { fetchGuild, fetchChannels, fetchStats, fetchUsersAndRoles, users } = useAppState();
const { checkAuthStatus } = useAuth();

const inspectedUser = ref<any>(null);

function handleInspectUser(userOrId: any) {
  if (typeof userOrId === 'string') {
    const found = users.value.find(u => u.id === userOrId);
    if (found) {
      inspectedUser.value = found;
    } else {
      inspectedUser.value = {
        id: userOrId,
        username: 'Utilisateur #' + userOrId.slice(-4),
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png'
      };
    }
  } else {
    inspectedUser.value = userOrId;
  }
}

provide('inspectUser', handleInspectUser);

onMounted(async () => {
  await checkAuthStatus();
  await Promise.all([
    fetchGuild(),
    fetchChannels(),
    fetchStats(),
    fetchUsersAndRoles()
  ]);
});
</script>
