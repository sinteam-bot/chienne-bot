<template>
  <div id="app-container" class="discord-app">
    <!-- Barre latérale gauche des Salons Discord & Virtuels -->
    <ChannelsSidebar />

    <!-- Zone principale de contenu -->
    <main class="chat-main">
      <ChatHeader />

      <!-- Vue dynamique active -->
      <MessagesView
        v-if="activeVirtualView === 'messages'"
        :channel="activeChannel"
        @inspect-user="handleInspectUser"
      />

      <LogsView v-else-if="activeVirtualView === 'logs'" />

      <ConfigView v-else-if="activeVirtualView === 'config'" />

      <UsersView
        v-else-if="activeVirtualView === 'users'"
        @inspect-user="handleInspectUser"
      />

      <DailyMessagesView v-else-if="activeVirtualView === 'daily-messages'" />

      <CaptchaLogsView v-else-if="activeVirtualView === 'captcha-logs'" />
    </main>

    <!-- Modale d'inspection d'utilisateur -->
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
import { useAppState } from '~/composables/useAppState';
import { useAuth } from '~/composables/useAuth';
import ChannelsSidebar from '~/components/layout/ChannelsSidebar.vue';
import ChatHeader from '~/components/layout/ChatHeader.vue';
import MessagesView from '~/components/views/MessagesView.vue';
import LogsView from '~/components/views/LogsView.vue';
import ConfigView from '~/components/views/ConfigView.vue';
import UsersView from '~/components/views/UsersView.vue';
import DailyMessagesView from '~/components/views/DailyMessagesView.vue';
import CaptchaLogsView from '~/components/views/CaptchaLogsView.vue';
import UserModal from '~/components/common/UserModal.vue';
import AuthModal from '~/components/common/AuthModal.vue';
import ToastContainer from '~/components/common/ToastContainer.vue';

const { activeChannel, activeVirtualView, fetchGuild, fetchChannels, users } = useAppState();
const { checkAuthStatus } = useAuth();

const inspectedUser = ref<any>(null);

onMounted(async () => {
  await checkAuthStatus();
  await Promise.all([
    fetchGuild(),
    fetchChannels()
  ]);
});

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
</script>
