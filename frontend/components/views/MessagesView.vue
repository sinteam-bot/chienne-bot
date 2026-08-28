<template>
  <div class="view-panel">
    <!-- Zone de défilement des messages -->
    <div ref="scrollerRef" class="messages-scroller" @scroll="handleScroll">
      <!-- En-tête de début de salon avec options d'export -->
      <div v-if="!hasMoreMessages && !isLoading" class="channel-start-banner">
        <div class="channel-start-icon">#</div>
        <h2 class="channel-start-title">Bienvenue dans #{{ channel?.name }} !</h2>
        <p class="channel-start-desc">C'est le début du salon #{{ channel?.name }}.</p>
        <div v-if="messages.length > 0" class="channel-export-actions">
          <button class="btn-channel-export" @click="exportHtml">📥 Exporter le salon en HTML</button>
          <button class="btn-channel-export" @click="exportJson">📄 Exporter en JSON</button>
        </div>
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
import { ref, watch, nextTick } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi';
import { useToast } from '~/composables/useToast';
import type { ChannelItem } from '~/composables/useAppState';
import DiscordMessage from '../common/DiscordMessage.vue';
import { generateHtmlTranscript, downloadFile } from '~/utils/transcriptExporter';

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

function isMessageGrouped(currentMsg: any, prevMsg: any): boolean {
  if (!prevMsg) return false;
  if (currentMsg.author?.id !== prevMsg.author?.id) return false;
  const currTime = new Date(currentMsg.timestamp || currentMsg.created_at).getTime();
  const prevTime = new Date(prevMsg.timestamp || prevMsg.created_at).getTime();
  return (currTime - prevTime) < 5 * 60 * 1000;
}

async function sendMessage() {
  const content = inputContent.value.trim();
  if (!content || !props.channel || isSending.value) return;

  isSending.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any }>(`/api/channels/${props.channel.id}/messages`, {
      method: 'POST',
      body: { content }
    });
    if (res.success && res.data) {
      messages.value.push(res.data);
      inputContent.value = '';
      scrollToBottom();
    } else {
      showToast('Erreur lors de l\'envoi du message', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isSending.value = false;
  }
}

function exportHtml() {
  if (!props.channel) return;
  const transcriptMessages = messages.value.map(m => ({
    id: m.id,
    author_id: m.author?.id || m.author_id,
    author_tag: m.author?.tag || m.author?.username,
    author_avatar: m.author?.avatarUrl,
    is_staff: false,
    content: m.content,
    created_at: m.timestamp || m.created_at
  }));

  const html = generateHtmlTranscript({
    title: `Salon #${props.channel.name}`,
    channelName: props.channel.name,
    exportedAt: new Date()
  }, transcriptMessages);

  downloadFile(html, `transcript-${props.channel.name}.html`, 'text/html');
  showToast(`Transcript de #${props.channel.name} téléchargé (HTML) !`, 'success');
}

function exportJson() {
  if (!props.channel) return;
  const data = {
    channel: props.channel,
    exportedAt: new Date().toISOString(),
    messages: messages.value
  };

  downloadFile(JSON.stringify(data, null, 2), `transcript-${props.channel.name}.json`, 'application/json');
  showToast(`Transcript de #${props.channel.name} téléchargé (JSON) !`, 'success');
}
</script>

<style scoped>
.view-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background-color: var(--bg-primary);
}

.messages-scroller {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
}

.channel-start-banner {
  margin-bottom: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.channel-start-icon {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background-color: var(--bg-tertiary);
  color: var(--text-normal);
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-weight: 300;
}

.channel-start-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-normal);
  margin-bottom: 8px;
}

.channel-start-desc {
  color: var(--text-muted);
  font-size: 14px;
}

.channel-export-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.btn-channel-export {
  background: var(--bg-secondary);
  color: var(--text-normal);
  border: 1px solid var(--border-subtle);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-channel-export:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: white;
}

.loading-more-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  color: var(--text-muted);
  font-size: 12px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  margin-top: auto;
}

.message-input-area {
  padding: 0 16px 24px 16px;
  background-color: var(--bg-primary);
}

.message-form {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 4px 12px;
  border: 1px solid var(--border-subtle);
}

.message-form:focus-within {
  border-color: var(--brand);
}

.message-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-normal);
  font-size: 14px;
  padding: 8px 0;
  outline: none;
  resize: none;
  max-height: 140px;
  font-family: inherit;
}

.input-btn-send {
  background: transparent;
  border: none;
  color: var(--brand);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: opacity 0.15s;
}

.input-btn-send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
