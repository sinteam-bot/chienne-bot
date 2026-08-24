<template>
  <div :class="['message-group', { grouped: isGrouped }]">
    <!-- Colonne Avatar ou Timestamp condensé -->
    <div class="message-avatar-col">
      <img
        v-if="!isGrouped"
        :src="message.author?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'"
        alt="Avatar"
        class="message-avatar"
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
            :src="att.url"
            :alt="att.name"
            class="message-attachment-image"
            loading="lazy"
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
          :title="react.emoji?.name"
        >
          <img
            v-if="react.emoji?.id"
            :src="`https://cdn.discordapp.com/emojis/${react.emoji.id}.png?size=32`"
            class="discord-reaction-emoji"
            :alt="react.emoji.name"
          />
          <span v-else class="reaction-unicode">{{ react.emoji?.name }}</span>
          <span class="reaction-count">{{ react.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DiscordEmbed from './DiscordEmbed.vue';

const props = defineProps<{
  message: any;
  isGrouped?: boolean;
}>();

defineEmits<{
  (e: 'inspect-user', userId: string): void;
}>();

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
  if (att.contentType && att.contentType.startsWith('image/')) return true;
  if (att.name && /\.(png|jpe?g|gif|webp)$/i.test(att.name)) return true;
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

const formattedContent = computed(() => {
  let content = props.message.content || '';
  if (!content) return '';

  // Échappement HTML basique
  content = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Blocs de code ```js
  content = content.replace(/```([a-z]*)\n([\s\S]*?)```/gi, (_match: string, lang: string, code: string) => {
    return `<pre class="discord-code-block"><span class="code-lang-tag">${lang}</span><code>${code}</code></pre>`;
  });

  // Code inline `code`
  content = content.replace(/`([^`]+)`/g, '<code class="discord-inline-code">$1</code>');

  // Gras **text**
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italique *text* ou _text_
  content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Souligné __text__
  content = content.replace(/__(.*?)__/g, '<u>$1</u>');

  // Emojis personnalisés Discord <:name:id> ou <a:name:id>
  content = content.replace(/&lt;(a?):([a-zA-Z0-9_]+):(\d+)&gt;/g, (_match: string, animated: string, name: string, id: string) => {
    const ext = animated ? 'gif' : 'png';
    return `<img class="discord-custom-emoji" src="https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless" alt=":${name}:" title=":${name}:" />`;
  });

  // Mentions <@123456789>
  content = content.replace(/&lt;@!?(\d+)&gt;/g, '<span class="discord-mention">@Utilisateur</span>');

  // Mentions salons <#123456789>
  content = content.replace(/&lt;#(\d+)&gt;/g, '<span class="discord-mention">#salon</span>');

  // Sauts de ligne
  content = content.replace(/\n/g, '<br/>');

  return content;
});
</script>
