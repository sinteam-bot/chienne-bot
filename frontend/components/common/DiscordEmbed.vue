<template>
  <div class="discord-embed" :style="{ borderLeftColor: embedColor }">
    <!-- Author -->
    <div v-if="embed.author" class="embed-author">
      <img v-if="embed.author.icon_url || embed.author.iconURL" :src="embed.author.icon_url || embed.author.iconURL" alt="Author Icon" />
      <span>{{ embed.author.name }}</span>
    </div>

    <!-- Title -->
    <div v-if="embed.title" class="embed-title">
      <a v-if="embed.url" :href="embed.url" target="_blank" rel="noopener noreferrer" class="discord-link">
        {{ embed.title }}
      </a>
      <span v-else>{{ embed.title }}</span>
    </div>

    <!-- Description -->
    <div v-if="embed.description" class="embed-desc" v-html="formattedDescription"></div>

    <!-- Fields Grid -->
    <div v-if="embed.fields && embed.fields.length > 0" class="embed-fields-grid">
      <div v-for="(field, index) in embed.fields" :key="index" class="embed-field">
        <div class="embed-field-name">{{ field.name }}</div>
        <div class="embed-field-value" v-html="formatDiscordText(field.value)"></div>
      </div>
    </div>

    <!-- Image -->
    <div v-if="embed.image" class="embed-image">
      <img :src="embed.image.url || embed.image.proxy_url" alt="Embed Image" loading="lazy" />
    </div>

    <!-- Footer -->
    <div v-if="embed.footer || embed.timestamp" class="embed-footer">
      <img v-if="embed.footer?.icon_url || embed.footer?.iconURL" :src="embed.footer.icon_url || embed.footer.iconURL" alt="Footer Icon" />
      <span v-if="embed.footer?.text">{{ embed.footer.text }}</span>
      <span v-if="embed.timestamp && embed.footer?.text">•</span>
      <span v-if="embed.timestamp">{{ formatTimestamp(embed.timestamp) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  embed: any;
}>();

const embedColor = computed(() => {
  if (!props.embed) return 'var(--brand)';
  if (props.embed.color) {
    if (typeof props.embed.color === 'number') {
      return '#' + props.embed.color.toString(16).padStart(6, '0');
    }
    return String(props.embed.color);
  }
  return 'var(--brand)';
});

function formatDiscordText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/`([^`]+)`/g, '<code class="discord-inline-code">$1</code>')
    .replace(/<@!?(\d+)>/g, '<span class="discord-mention">@Utilisateur</span>')
    .replace(/<#(\d+)>/g, '<span class="discord-mention">#salon</span>')
    .replace(/<@&(\d+)>/g, '<span class="discord-mention">@rôle</span>')
    .replace(/\n/g, '<br/>');
}

const formattedDescription = computed(() => {
  return formatDiscordText(props.embed?.description || '');
});

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}
</script>
