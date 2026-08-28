<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>
    <div v-if="ok" class="config-card" style="color: var(--green);">✅ {{ ok }}</div>

    <div class="config-card">
      <div class="card-subtitle">🔊 Configuration des vocaux temporaires (admin)</div>
      <p class="config-desc" style="margin: 8px 0 16px;">
        Cochez les salons vocaux qui serviront de "Join-to-Trigger" : un user qui y entre
        déclenche la création d'un salon vocal privé à côté. Configurez aussi la catégorie parente,
        le template de nom et les limites.
      </p>

      <div class="config-item">
        <label class="config-label">Activé</label>
        <label class="switch">
          <input v-model="form.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <label class="config-label">Join-to-Trigger channels</label>
        <div style="flex: 1;">
          <DiscordChannelSelect
            v-model="form.joinChannels"
            multiple
            channel-type="guild-voice"
            placeholder="Sélectionner un ou plusieurs salons vocaux"
          />
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Catégorie parente</label>
        <div style="flex: 1; min-width: 240px;">
          <DiscordChannelSelect v-model="form.categoryId" channel-type="guild-category" placeholder="Aucune (racine)" />
        </div>
      </div>

      <div class="config-item">
        <label class="config-label">Template du nom</label>
        <input v-model="form.format" class="discord-input" placeholder="{user}'s game" style="flex: 1; max-width: 320px;" />
        <span class="config-hint">Variables : <code>{user}</code> = displayName, <code>{username}</code> = pseudo</span>
      </div>

      <div class="config-item">
        <label class="config-label">Delay suppression (s)</label>
        <input v-model.number="form.deleteDelaySeconds" type="number" min="0" max="300" class="discord-input" style="width: 100px;" />
        <span class="config-hint">0 = immédiat après vide</span>
      </div>

      <div class="config-item">
        <label class="config-label">Max vocaux simultanés</label>
        <input v-model.number="form.maxPerGuild" type="number" min="0" max="50" class="discord-input" style="width: 100px;" />
        <span class="config-hint">0 = illimité (anti-spam)</span>
      </div>

      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="module-btn module-btn-primary" :disabled="saving" @click="save">{{ saving ? '⏳' : '💾' }} Enregistrer</button>
        <button class="module-btn" @click="reload">↺ Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useTempVoice } from '~/composables/useTempVoice';

const api = useTempVoice();
const form = reactive({
  enabled: false,
  joinChannels: [] as string[],
  categoryId: null as string | null,
  format: "{user}'s game",
  deleteDelaySeconds: 5,
  maxPerGuild: 0
});
const saving = ref(false);
const error = ref<string | null>(null);
const ok = ref<string | null>(null);

async function load() {
  try {
    const c = await api.getConfig();
    form.enabled = c.enabled;
    form.joinChannels = c.joinChannels || [];
    form.categoryId = c.categoryId;
    form.format = c.format;
    form.deleteDelaySeconds = c.deleteDelaySeconds;
    form.maxPerGuild = c.maxPerGuild;
  } catch (e: any) {
    error.value = e.message;
  }
}

async function save() {
  saving.value = true;
  error.value = null;
  ok.value = null;
  try {
    await api.updateConfig({
      guildId: process.env.GUILD_ID || 'demo',
      enabled: form.enabled,
      joinChannels: form.joinChannels,
      categoryId: form.categoryId,
      format: form.format,
      deleteDelaySeconds: form.deleteDelaySeconds,
      maxPerGuild: form.maxPerGuild
    });
    ok.value = 'Configuration enregistrée';
    setTimeout(() => ok.value = null, 3000);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

function reload() { load(); }

onMounted(load);
</script>

<style scoped>
.config-card { background: var(--background-modifier-hover); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; }
.config-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin: 0; }
.config-desc code { font-family: 'JetBrains Mono', monospace; background: var(--background-secondary); padding: 1px 4px; border-radius: 3px; font-size: 11px; }
.config-label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); min-width: 160px; }
.config-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap; }
.config-item:last-child { border-bottom: none; }
.config-hint { font-size: 11px; color: var(--text-muted); }
.config-hint code { font-family: 'JetBrains Mono', monospace; background: var(--background-secondary); padding: 1px 4px; border-radius: 3px; }
.switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; inset: 0; background: #4e5058; border-radius: 12px; cursor: pointer; transition: background 0.2s; }
.slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: transform 0.2s; }
.switch input:checked + .slider { background: #57f287; }
.switch input:checked + .slider::before { transform: translateX(20px); }

.module-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; background: var(--background-modifier-hover); color: var(--text-normal); font-size: 13px; border: 1px solid var(--border-subtle); cursor: pointer; font-family: inherit; }
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; }
</style>
