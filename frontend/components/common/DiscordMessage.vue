<template>
  <div :class="['message-group', { grouped: isGrouped }]">
    <!-- Colonne Avatar ou Timestamp condensé -->
    <div class="message-avatar-col">
      <img
        v-if="!isGrouped"
        :src="getProxiedImageUrl(message.author?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png')"
        alt="Avatar"
        class="message-avatar"
        loading="lazy"
        referrerpolicy="no-referrer"
        crossorigin="anonymous"
        @click="$emit('inspect-user', message.author?.id)"
      />
      <span v-else class="grouped-timestamp">{{ shortTime }}</span>
    </div>

    <!-- Colonne Contenu -->
    <div class="message-content-col">
      <!-- Header avec Auteur et Date (si non groupé) -->
      <div v-if="!isGrouped" class="message-header">
        <span
          class="message-author"
          :style="{ color: message.memberColor || 'var(--header-primary)' }"
          @click="$emit('inspect-user', message.author?.id)"
        >
          {{ message.author?.displayName || message.author?.username || 'Utilisateur' }}
        </span>
        <span v-if="message.author?.bot" class="bot-badge">BOT</span>
        <span class="message-timestamp">{{ fullTime }}</span>
      </div>

      <!-- Texte du message -->
      <div v-if="message.content" class="message-text" v-html="formattedContent"></div>

      <!-- Pièces jointes / Images -->
      <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
        <div v-for="att in message.attachments" :key="att.id" style="margin-top: 6px;">
          <img
            v-if="isImageAttachment(att)"
            :src="getProxiedImageUrl(att.url)"
            :alt="att.name"
            class="message-attachment-image"
            loading="lazy"
            referrerpolicy="no-referrer"
            @click="openImage(att.url)"
          />
          <a v-else :href="att.url" target="_blank" rel="noopener noreferrer" class="discord-link">
            📎 {{ att.name }} ({{ formatBytes(att.size) }})
          </a>
        </div>
      </div>

      <!-- Embeds Discord -->
      <div v-if="message.embeds && message.embeds.length > 0" class="message-embeds">
        <DiscordEmbed
          v-for="(emb, idx) in message.embeds"
          :key="idx"
          :embed="emb"
        />
      </div>

      <!-- Réactions -->
      <div v-if="message.reactions && message.reactions.length > 0" class="message-reactions">
        <div
          v-for="(react, idx) in message.reactions"
          :key="idx"
          class="reaction-pill"
          :title="getReactionTitle(react)"
        >
          <img
            v-if="getReactionUrl(react)"
            :src="getProxiedImageUrl(getReactionUrl(react))"
            class="discord-reaction-emoji"
            :alt="getReactionLabel(react)"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <span v-else class="reaction-unicode">{{ getReactionLabel(react) }}</span>
          <span class="reaction-count">{{ react.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DiscordEmbed from './DiscordEmbed.vue';
import { useDiscordFormatter } from '~/composables/useDiscordFormatter.ts';
import { getProxiedImageUrl } from '~/composables/useDiscordImageProxy.ts';

const props = defineProps<{
  message: any;
  isGrouped?: boolean;
}>();

defineEmits<{
  (e: 'inspect-user', userId: string): void;
}>();

const { formatDiscordContent } = useDiscordFormatter();

const shortTime = computed(() => {
  try {
    const d = new Date(props.message.createdAt || props.message.createdTimestamp);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
});

const fullTime = computed(() => {
  try {
    const d = new Date(props.message.createdAt || props.message.createdTimestamp);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
});

function isImageAttachment(att: any): boolean {
  if (!att) return false;
  if (att.contentType && att.contentType.startsWith('image/')) return true;
  const name = att.name || att.url || '';
  if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(name)) return true;
  return false;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function openImage(url: string) {
  window.open(url, '_blank');
}

function getReactionUrl(react: any): string | null {
  if (react.url) return getProxiedImageUrl(react.url);
  const emojiId = react.id || react.emoji?.id;
  if (emojiId) {
    const ext = react.animated || react.emoji?.animated ? 'gif' : 'png';
    return getProxiedImageUrl(`https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=32&quality=lossless`);
  }
  return null;
}

function getReactionLabel(react: any): string {
  if (typeof react.emoji === 'string') return react.emoji;
  if (react.emoji?.name) return react.emoji.name;
  if (react.name) return react.name;
  return '⭐';
}

function getReactionTitle(react: any): string {
  const label = getReactionLabel(react);
  return `${label} (${react.count})`;
}

const formattedContent = computed(() => {
  return formatDiscordContent(props.message?.content || '', props.message);
});
</script>
