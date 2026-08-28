<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Filtres -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🔍 Filtres</span>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;">
        <div style="flex: 1; min-width: 200px;">
          <label class="config-label">Salon</label>
          <DiscordChannelSelect v-model="filterChannel" placeholder="Tous les salons" />
        </div>
        <div style="min-width: 240px;">
          <label class="config-label">ID du message</label>
          <input
            v-model="filterMessageId"
            class="discord-input"
            placeholder="1234567890..."
            style="width: 100%; font-family: 'JetBrains Mono', monospace;"
          />
        </div>
        <button class="module-btn" @click="load">🔄 Filtrer</button>
        <button class="module-btn" @click="resetFilters">↺ Reset</button>
      </div>
    </div>

    <!-- Formulaire de création -->
    <div class="config-card">
      <div class="card-subtitle">➕ Ajouter un reaction-role (admin)</div>
      <p class="config-desc" style="margin: 8px 0 16px;">
        Postez d'abord un message dans Discord, puis créez le reaction-role ci-dessous.
        Le bot ajoutera automatiquement la réaction sur le message.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        <div>
          <label class="config-label">Salon</label>
          <DiscordChannelSelect v-model="newChannel" placeholder="Salon du message" />
        </div>
        <div>
          <label class="config-label">ID du message</label>
          <input v-model="newMessageId" class="discord-input" placeholder="1234567890..." />
        </div>
        <div>
          <label class="config-label">Emoji</label>
          <input v-model="newEmoji" class="discord-input" placeholder="🎉 ou nom:id" />
        </div>
        <div>
          <label class="config-label">Rôle</label>
          <DiscordRoleSelect v-model="newRole" placeholder="Rôle à attribuer" />
        </div>
      </div>
      <div style="margin-top: 12px;">
        <label class="config-label">Description (optionnel)</label>
        <input v-model="newDescription" class="discord-input" placeholder="Rôle notif, accès au RP, etc." style="width: 100%;" />
      </div>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="module-btn module-btn-primary" :disabled="!canCreate || creating" @click="createOne">
          {{ creating ? '⏳' : '➕' }} Créer le reaction-role
        </button>
        <button class="module-btn" @click="resetForm">↺ Reset</button>
      </div>
      <div v-if="createError" style="color: var(--red); margin-top: 8px; font-size: 12px;">
        ❌ {{ createError }}
      </div>
    </div>

    <!-- Liste -->
    <div v-if="loading && filteredRoles.length === 0" class="config-card" style="text-align: center; color: var(--text-muted);">
      Chargement…
    </div>

    <div v-else-if="filteredRoles.length === 0" class="config-card" style="text-align: center; color: var(--text-muted);">
      <div style="font-size: 36px; margin-bottom: 8px;">🎭</div>
      <p>Aucun réaction-rôle configuré.</p>
    </div>

    <div v-else class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>📋 {{ filteredRoles.length }} réaction-rôle(s)</span>
      </div>
      <div v-for="r in filteredRoles" :key="r.id" class="rr-row">
        <div class="rr-row__emoji">{{ r.emoji }}</div>
        <div class="rr-row__body">
          <div class="rr-row__title">
            <strong>{{ r.description || 'Sans description' }}</strong>
          </div>
          <div class="rr-row__meta">
            Rôle <code>{{ r.roleId }}</code> ·
            salon <code>{{ r.channelId }}</code> ·
            message <a :href="`https://discord.com/channels/${r.guildId}/${r.channelId}/${r.messageId}`" target="_blank">
              <code>{{ r.messageId.slice(0, 20) }}…</code>
            </a>
          </div>
        </div>
        <div class="rr-row__actions">
          <button class="module-btn module-btn-sm" @click="deleteRr(r.id)" style="background: rgba(237, 66, 69, 0.15); color: #ed4245;">
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useReactionRoles, type ReactionRole } from '~/composables/useReactionRoles';

const rr = useReactionRoles();
const allRoles = ref<ReactionRole[]>([]);
const loading = ref(false);

// Filtres
const filterChannel = ref<string>('');
const filterMessageId = ref<string>('');

// Formulaire de création
const newChannel = ref<string>('');
const newMessageId = ref<string>('');
const newEmoji = ref<string>('');
const newRole = ref<string>('');
const newDescription = ref<string>('');
const creating = ref(false);
const createError = ref<string | null>(null);

const canCreate = computed(() =>
  newChannel.value && newMessageId.value && newEmoji.value && newRole.value
);

const filteredRoles = computed(() => {
  let list = [...allRoles.value];
  if (filterChannel.value) list = list.filter(r => r.channelId === filterChannel.value);
  if (filterMessageId.value) list = list.filter(r => r.messageId === filterMessageId.value);
  return list.sort((a, b) => b.createdAt - a.createdAt);
});

async function load() {
  loading.value = true;
  try {
    const params: any = { limit: 200 };
    if (filterMessageId.value) params.message_id = filterMessageId.value;
    allRoles.value = await rr.list(params);
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filterChannel.value = '';
  filterMessageId.value = '';
  load();
}

function resetForm() {
  newChannel.value = '';
  newMessageId.value = '';
  newEmoji.value = '';
  newRole.value = '';
  newDescription.value = '';
  createError.value = null;
}

async function createOne() {
  if (!canCreate.value) return;
  creating.value = true;
  createError.value = null;
  try {
    // channel select returns either the ID or the value field. We accept the
    // raw value (string) as the channel id.
    const guildId = (await import('~/composables/useDiscordApi')).useDiscordApi ? '' : '';
    const created = await rr.create({
      guildId: guildId || process?.env?.GUILD_ID || '',
      channelId: String(newChannel.value),
      messageId: String(newMessageId.value),
      emoji: String(newEmoji.value),
      roleId: String(newRole.value),
      description: newDescription.value || undefined
    });
    if (!created.success) {
      createError.value = created.error || 'Erreur inconnue';
      return;
    }
    if (created.data) allRoles.value.unshift(created.data);
    resetForm();
  } catch (e: any) {
    createError.value = e.message;
  } finally {
    creating.value = false;
  }
}

async function deleteRr(id: string) {
  if (!confirm('Supprimer ce réaction-rôle ?')) return;
  try {
    await rr.remove(id);
    allRoles.value = allRoles.value.filter(r => r.id !== id);
  } catch (e: any) {
    createError.value = e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.config-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.config-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
}
.module-btn:hover:not(:disabled) { background: var(--brand-experiment, #5865f2); color: white; }
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-sm { padding: 4px 10px; font-size: 12px; }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; }

.rr-row {
  display: grid;
  grid-template-columns: 50px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.rr-row:last-child { border-bottom: none; }
.rr-row__emoji {
  font-size: 28px;
  text-align: center;
  width: 50px;
  height: 50px;
  line-height: 50px;
  background: rgba(88, 101, 242, 0.1);
  border-radius: 8px;
}
.rr-row__title { font-size: 14px; color: var(--text-normal); margin-bottom: 4px; }
.rr-row__meta { font-size: 11px; color: var(--text-muted); }
.rr-row__meta code { font-family: 'JetBrains Mono', monospace; background: var(--background-secondary); padding: 1px 4px; border-radius: 3px; }
.rr-row__meta a { color: inherit; text-decoration: none; }
.rr-row__meta a:hover code { color: var(--brand-experiment, #5865f2); }
</style>
