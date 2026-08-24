<template>
  <div class="view-panel">
    <!-- Zone de défilement des messages -->
    <div ref="scrollerRef" class="messages-scroller" @scroll="handleScroll">
      <!-- En-tête de début de salon -->
      <div v-if="!hasMoreMessages && !isLoading" class="channel-start-banner">
        <div class="channel-start-icon">#</div>
        <h2 class="channel-start-title">Bienvenue dans #{{ channel?.name }} !</h2>
        <p class="channel-start-desc">C'est le début du salon #{{ channel?.name }}.</p>
      </div>

      <!-- Spinner chargement anciens messages -->
      <div v-if="isLoadingOlder" class="loading-more-messages">
        <div class="spinner"></div>
        <span>Chargement des messages plus anciens...</span>
      </div>

      <!-- Liste des messages -->
      <div class="messages-list">
        <DiscordMessage
          v-for="(msg, index) in messages"
          :key="msg.id || index"
          :message="msg"
          :is-grouped="isMessageGrouped(msg, messages[index - 1])"
          @inspect-user="$emit('inspect-user', $event)"
        />
      </div>

      <!-- Spinner initial -->
      <div v-if="isLoading && messages.length === 0" style="display: flex; justify-content: center; padding: 40px;">
        <div class="spinner" style="width: 32px; height: 32px;"></div>
      </div>
    </div>

    <!-- Zone de composition / Envoi de message -->
    <div class="message-input-area">
      <form class="message-form" @submit.prevent="sendMessage">
        <textarea
          ref="textareaRef"
          v-model="inputContent"
          class="message-textarea"
          :placeholder="`Envoyer un message dans #${channel?.name || 'salon'} (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)`"
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <button type="submit" class="input-btn-send" :disabled="!inputContent.trim() || isSending" title="Envoyer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import type { ChannelItem } from '~/composables/useAppState.ts';
import DiscordMessage from '../common/DiscordMessage.vue';

const props = defineProps<{
  channel: ChannelItem | null;
}>();

defineEmits<{
  (e: 'inspect-user', userId: string): void;
}>();

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const messages = ref<any[]>([]);
const isLoading = ref(false);
const isLoadingOlder = ref(false);
const hasMoreMessages = ref(true);
const inputContent = ref('');
const isSending = ref(false);
const scrollerRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

watch(() => props.channel?.id, (newId) => {
  if (newId && !newId.startsWith('virtual-')) {
    loadMessages(newId);
  }
}, { immediate: true });

async function loadMessages(channelId: string) {
  isLoading.value = true;
  messages.value = [];
  hasMoreMessages.value = true;

  try {
    const res = await apiFetch<{ success: boolean; data: any }>(`/api/channels/${channelId}/messages?limit=50`);
    if (res.success && res.data) {
      const msgList = Array.isArray(res.data) ? res.data : (res.data.messages || []);
      messages.value = msgList;
      hasMoreMessages.value = res.data.hasMore !== undefined ? res.data.hasMore : msgList.length >= 50;
      scrollToBottom();
    }
  } catch (err: any) {
    console.error('Erreur chargement messages:', err);
  } finally {
    isLoading.value = false;
  }
}

async function loadOlderMessages() {
  if (!props.channel || isLoadingOlder.value || !hasMoreMessages.value || messages.value.length === 0) return;

  const oldestMsg = messages.value[0];
  if (!oldestMsg) return;

  isLoadingOlder.value = true;
  const prevScrollHeight = scrollerRef.value?.scrollHeight || 0;

  try {
    const res = await apiFetch<{ success: boolean; data: any }>(
      `/api/channels/${props.channel.id}/messages?limit=50&before=${oldestMsg.id}`
    );
    if (res.success && res.data) {
      const olderList = Array.isArray(res.data) ? res.data : (res.data.messages || []);
      if (olderList.length === 0) {
        hasMoreMessages.value = false;
      } else {
        messages.value = [...olderList, ...messages.value];
        hasMoreMessages.value = res.data.hasMore !== undefined ? res.data.hasMore : olderList.length >= 50;
        nextTick(() => {
          if (scrollerRef.value) {
            const newScrollHeight = scrollerRef.value.scrollHeight;
            scrollerRef.value.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      }
    }
  } catch (err: any) {
    console.error('Erreur anciens messages:', err);
  } finally {
    isLoadingOlder.value = false;
  }
}

function handleScroll() {
  if (scrollerRef.value && scrollerRef.value.scrollTop < 60) {
    loadOlderMessages();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (scrollerRef.value) {
      scrollerRef.value.scrollTop = scrollerRef.value.scrollHeight;
    }
  });
}

function isMessageGrouped(curr: any, prev: any): boolean {
  if (!prev || !curr) return false;
  if (curr.author?.id !== prev.author?.id) return false;

  const currTime = new Date(curr.createdAt || curr.createdTimestamp).getTime();
  const prevTime = new Date(prev.createdAt || prev.createdTimestamp).getTime();
  // Regrouper si moins de 5 minutes d'écart
  return (currTime - prevTime) < 5 * 60 * 1000;
}

async function sendMessage() {
  const text = inputContent.value.trim();
  if (!text || !props.channel || isSending.value) return;

  isSending.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data?: any }>(`/api/channels/${props.channel.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: text })
    });

    if (res.success) {
      inputContent.value = '';
      if (res.data) {
        messages.value.push(res.data);
      } else {
        // Rafraîchir
        const fresh = await apiFetch<{ success: boolean; data: any[] }>(`/api/channels/${props.channel.id}/messages?limit=20`);
        if (fresh.success && fresh.data) messages.value = fresh.data;
      }
      scrollToBottom();
    }
  } catch (err: any) {
    showToast(`Erreur d'envoi: ${err.message}`, 'error');
  } finally {
    isSending.value = false;
  }
}
</script>
