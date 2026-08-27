<template>
  <div class="discord-embed" :style="{ borderLeftColor: embedColor }">
    <!-- Author -->
    <div v-if="embed.author" class="embed-author">
      <img
        v-if="embed.author.icon_url || embed.author.iconURL"
        :src="getProxiedImageUrl(embed.author.icon_url || embed.author.iconURL)"
        alt="Author Icon"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <span v-html="formatDiscordContent(embed.author.name || '')"></span>
    </div>

    <!-- Title -->
    <div v-if="embed.title" class="embed-title">
      <a v-if="embed.url" :href="embed.url" target="_blank" rel="noopener noreferrer" class="discord-link" v-html="formatDiscordContent(embed.title)"></a>
      <span v-else v-html="formatDiscordContent(embed.title)"></span>
    </div>

    <!-- Description -->
    <div v-if="embed.description" class="embed-desc" v-html="formattedDescription"></div>

    <!-- Thumbnail -->
    <div v-if="embed.thumbnail" class="embed-thumbnail" style="float: right; margin-left: 12px;">
      <img
        :src="getProxiedImageUrl(embed.thumbnail.url || embed.thumbnail.proxy_url)"
        alt="Thumbnail"
        style="max-width: 80px; max-height: 80px; border-radius: 4px;"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
    </div>

    <!-- Fields Grid -->
    <div v-if="embed.fields && embed.fields.length > 0" class="embed-fields-grid">
      <div v-for="(field, index) in embed.fields" :key="index" class="embed-field">
        <div class="embed-field-name" v-html="formatDiscordContent(field.name || '')"></div>
        <div class="embed-field-value" v-html="formatDiscordContent(field.value || '')"></div>
      </div>
    </div>

    <!-- Image -->
    <div v-if="embed.image" class="embed-image">
      <img
        :src="getProxiedImageUrl(embed.image.url || embed.image.proxy_url)"
        alt="Embed Image"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
    </div>

    <!-- Footer -->
    <div v-if="embed.footer || embed.timestamp" class="embed-footer">
      <img
        v-if="embed.footer?.icon_url || embed.footer?.iconURL"
        :src="getProxiedImageUrl(embed.footer.icon_url || embed.footer.iconURL)"
        alt="Footer Icon"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <span v-if="embed.footer?.text" v-html="formatDiscordContent(embed.footer.text)"></span>
      <span v-if="embed.timestamp && embed.footer?.text">•</span>
      <span v-if="embed.timestamp">{{ formatTimestamp(embed.timestamp) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDiscordFormatter } from '~/composables/useDiscordFormatter.ts';
import { getProxiedImageUrl } from '~/composables/useDiscordImageProxy.ts';

const props = defineProps<{
  embed: any;
}>();

const { formatDiscordContent } = useDiscordFormatter();

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

const formattedDescription = computed(() => {
  return formatDiscordContent(props.embed?.description || '');
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
