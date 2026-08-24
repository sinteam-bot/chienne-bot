<template>
  <div class="archives-layout">
    <!-- Sous-Sidebar Discord dédiée aux salons et catégories -->
    <DiscordChannelsSubSidebar @select-channel="onChannelSelected" />

    <!-- Zone principale d'affichage des messages du salon -->
    <div class="archives-content">
      <MessagesView
        :channel="activeDiscordChannel"
        @inspect-user="inspectUser"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppState, type ChannelItem } from '~/composables/useAppState.ts';
import DiscordChannelsSubSidebar from '~/components/layout/DiscordChannelsSubSidebar.vue';
import MessagesView from '~/components/views/MessagesView.vue';

const route = useRoute();
const router = useRouter();
const { activeDiscordChannel, discordChannels, setActiveDiscordChannel } = useAppState();
const inspectUser = inject<(userOrId: any) => void>('inspectUser');

function syncChannelFromRoute() {
  const channelIdParam = route.params.channelId as string;
  if (channelIdParam && discordChannels.value.length > 0) {
    const found = discordChannels.value.find(c => c.id === channelIdParam);
    if (found) {
      setActiveDiscordChannel(found);
    } else {
      setActiveDiscordChannel({
        id: channelIdParam,
        name: channelIdParam,
        type: 'text'
      });
    }
  }
}

onMounted(() => {
  syncChannelFromRoute();
});

watch(() => route.params.channelId, () => {
  syncChannelFromRoute();
});

watch(discordChannels, () => {
  syncChannelFromRoute();
});

function onChannelSelected(ch: ChannelItem) {
  router.push(`/archives/${ch.id}`);
}
</script>

<style scoped>
.archives-layout {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.archives-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-primary);
}
</style>
