<template>
  <div id="app-container" class="discord-app">
    <!-- Barre latérale gauche (Chienne Bot, Modules, Games) -->
    <ChannelsSidebar />

    <!-- Zone principale de contenu -->
    <main class="chat-main">
      <ChatHeader />

      <!-- 1. SECTION CHIENNE BOT -->
      <InfoView v-if="activeView === 'info'" />

      <MessagesView
        v-else-if="activeView === 'archives'"
        :channel="activeDiscordChannel"
        @inspect-user="handleInspectUser"
      />

      <DiscordEventsView v-else-if="activeView === 'events'" />

      <CommandsView v-else-if="activeView === 'commands'" />

      <LogsView v-else-if="activeView === 'logs'" />

      <UsersView
        v-else-if="activeView === 'users'"
        @inspect-user="handleInspectUser"
      />

      <GeneralConfigView v-else-if="activeView === 'general-config'" />

      <!-- 2. SECTION MODULES -->
      <DailyMessageModuleView v-else-if="activeView === 'module-daily-message'" />

      <CaptchaModuleView v-else-if="activeView === 'module-captcha'" />

      <WelcomeModuleView v-else-if="activeView === 'module-welcome'" />

      <XpLevelModuleView v-else-if="activeView === 'module-xp-level'" />

      <!-- 3. SECTION GAMES -->
      <RoadToInfiniteGameView v-else-if="activeView === 'game-road-to-infinite'" />

      <CountdownGameView v-else-if="activeView === 'game-countdown'" />
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
import { ref, onMounted } from 'vue';
import { useAppState } from '~/composables/useAppState';
import { useAuth } from '~/composables/useAuth';

// Layout
import ChannelsSidebar from '~/components/layout/ChannelsSidebar.vue';
import ChatHeader from '~/components/layout/ChatHeader.vue';

// Views - Section Bot
import InfoView from '~/components/views/bot/InfoView.vue';
import MessagesView from '~/components/views/MessagesView.vue';
import DiscordEventsView from '~/components/views/bot/DiscordEventsView.vue';
import CommandsView from '~/components/views/bot/CommandsView.vue';
import LogsView from '~/components/views/LogsView.vue';
import UsersView from '~/components/views/UsersView.vue';
import GeneralConfigView from '~/components/views/bot/GeneralConfigView.vue';

// Views - Section Modules
import DailyMessageModuleView from '~/components/views/modules/DailyMessageModuleView.vue';
import CaptchaModuleView from '~/components/views/modules/CaptchaModuleView.vue';
import WelcomeModuleView from '~/components/views/modules/WelcomeModuleView.vue';
import XpLevelModuleView from '~/components/views/modules/XpLevelModuleView.vue';

// Views - Section Games
import RoadToInfiniteGameView from '~/components/views/games/RoadToInfiniteGameView.vue';
import CountdownGameView from '~/components/views/games/CountdownGameView.vue';

// Common Modals
import UserModal from '~/components/common/UserModal.vue';
import AuthModal from '~/components/common/AuthModal.vue';
import ToastContainer from '~/components/common/ToastContainer.vue';

const { activeView, activeDiscordChannel, fetchGuild, fetchChannels, fetchStats, fetchUsersAndRoles, users } = useAppState();
const { checkAuthStatus } = useAuth();

const inspectedUser = ref<any>(null);

onMounted(async () => {
  await checkAuthStatus();
  await Promise.all([
    fetchGuild(),
    fetchChannels(),
    fetchStats(),
    fetchUsersAndRoles()
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
