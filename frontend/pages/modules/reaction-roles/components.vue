<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div v-if="error" class="config-card" style="color: var(--red);">❌ {{ error }}</div>

    <!-- Tabs internes : Button / Select -->
    <div class="config-card" style="display: flex; gap: 6px; padding: 6px;">
      <button class="tab" :class="{ active: kind === 'button' }" @click="kind = 'button'">🔘 Bouton</button>
      <button class="tab" :class="{ active: kind === 'select' }" @click="kind = 'select'">📋 Select menu</button>
    </div>

    <!-- Formulaire Button -->
    <div v-if="kind === 'button'" class="config-card">
      <div class="card-subtitle">🔘 Créer un bouton interactif (admin)</div>
      <p class="config-desc" style="margin: 8px 0 12px;">
        Le bouton s'affiche sur le message Discord configuré. Quand un membre clique, l'action (toggle_role, give_role, take_role ou open_url) est exécutée.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
        <div>
          <label class="config-label">Salon</label>
          <DiscordChannelSelect v-model="btnChannel" placeholder="Salon du message" />
        </div>
        <div>
          <label class="config-label">ID du message</label>
          <input v-model="btnMessageId" class="discord-input" placeholder="1234567890..." />
        </div>
        <div>
          <label class="config-label">Label *</label>
          <input v-model="btnLabel" class="discord-input" placeholder="Verify" maxlength="80" />
        </div>
        <div>
          <label class="config-label">Style</label>
          <select v-model="btnStyle" class="discord-input">
            <option value="primary">primary</option>
            <option value="secondary">secondary</option>
            <option value="success">success</option>
            <option value="danger">danger</option>
            <option value="link">link (open_url)</option>
          </select>
        </div>
        <div>
          <label class="config-label">Emoji (optionnel)</label>
          <input v-model="btnEmoji" class="discord-input" placeholder="✅" maxlength="50" />
        </div>
        <div>
          <label class="config-label">Action</label>
          <select v-model="btnAction" class="discord-input">
            <option value="toggle_role">toggle_role (toggle)</option>
            <option value="give_role">give_role (ajouter)</option>
            <option value="take_role">take_role (retirer)</option>
            <option value="open_url">open_url (lien)</option>
          </select>
        </div>
        <div v-if="btnAction !== 'open_url'">
          <label class="config-label">Rôle *</label>
          <DiscordRoleSelect v-model="btnRole" placeholder="Rôle à attribuer/retirer" />
        </div>
        <div v-if="btnAction === 'open_url'">
          <label class="config-label">URL *</label>
          <input v-model="btnUrl" class="discord-input" placeholder="https://exemple.com" />
        </div>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="module-btn module-btn-primary" :disabled="!canCreateButton || creating" @click="createButton">
          {{ creating ? '⏳' : '➕' }} Créer le bouton
        </button>
        <span v-if="createOk" style="color: var(--green); font-size: 12px; align-self: center;">✅ Bouton créé</span>
      </div>
    </div>

    <!-- Formulaire Select -->
    <div v-if="kind === 'select'" class="config-card">
      <div class="card-subtitle">📋 Créer un select menu (admin)</div>
      <p class="config-desc" style="margin: 8px 0 12px;">
        Menu déroulant. Chaque option peut optionnellement être liée à un rôle (1 rôle par option, le rôle est ajouté quand l'option est sélectionnée).
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
        <div>
          <label class="config-label">Salon</label>
          <DiscordChannelSelect v-model="selChannel" placeholder="Salon du message" />
        </div>
        <div>
          <label class="config-label">ID du message</label>
          <input v-model="selMessageId" class="discord-input" placeholder="1234567890..." />
        </div>
        <div>
          <label class="config-label">Placeholder</label>
          <input v-model="selPlaceholder" class="discord-input" placeholder="Choisis tes rôles…" maxlength="100" />
        </div>
        <div>
          <label class="config-label">Min valeurs (0 = optionnel)</label>
          <input v-model.number="selMinValues" type="number" min="0" max="25" class="discord-input" />
        </div>
        <div>
          <label class="config-label">Max valeurs (1 = single)</label>
          <input v-model.number="selMaxValues" type="number" min="1" max="25" class="discord-input" />
        </div>
      </div>
      <div style="margin-top: 12px;">
        <label class="config-label">Options (1 à 25)</label>
        <textarea
          v-model="selOptionsRaw"
          class="discord-input"
          rows="6"
          placeholder="Gamer|gamer|1234567890&#10;Artist|artist|2345678901&#10;Developer|dev|3456789012"
          style="font-family: 'JetBrains Mono', monospace; resize: vertical;"
        ></textarea>
        <p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0;">
          Format : une option par ligne, champs séparés par <code>|</code> :
          <code>Label|value|roleId?</code> (roleId optionnel). Exemple ci-dessus.
        </p>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="module-btn module-btn-primary" :disabled="!canCreateSelect || creating" @click="createSelect">
          {{ creating ? '⏳' : '➕' }} Créer le select
        </button>
        <span v-if="createOk" style="color: var(--green); font-size: 12px; align-self: center;">✅ Select créé</span>
      </div>
    </div>

    <!-- Liste des components configurés -->
    <div class="config-card">
      <div class="card-subtitle">📦 Components configurés ({{ components.length }})</div>
      <div v-if="components.length === 0" style="color: var(--text-muted); padding: 16px; text-align: center;">
        Aucun button ou select configuré. Postez d'abord un message dans Discord puis créez un component ci-dessus.
      </div>
      <div v-else>
        <div v-for="c in components" :key="c.id" class="comp-row">
          <div class="comp-row__icon">{{ c.kind === 'button' ? '🔘' : '📋' }}</div>
          <div class="comp-row__body">
            <div class="comp-row__title">
              <span class="kind-badge" :class="`kind-${c.kind}`">{{ c.kind }}</span>
              <strong>{{ c.metadata?.label || c.metadata?.placeholder || '(sans label)' }}</strong>
            </div>
            <div class="comp-row__meta">
              action: <code>{{ c.metadata?.action || '-' }}</code>
              <span v-if="c.roleId"> · rôle <code>{{ c.roleId.slice(0, 14) }}…</code></span>
              <span v-if="c.metadata?.url"> · url <code>{{ c.metadata.url.slice(0, 30) }}…</code></span>
              <span v-if="c.kind === 'select' && c.metadata?.options">
                · {{ c.metadata.options.length }} options
              </span>
            </div>
          </div>
          <button class="module-btn module-btn-sm" @click="del(c.id)" style="background: rgba(237, 66, 69, 0.15); color: #ed4245;">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReactionRoles, type ReactionRole } from '~/composables/useReactionRoles';

const rr = useReactionRoles();
const kind = ref<'button' | 'select'>('button');
const components = ref<ReactionRole[]>([]);
const loading = ref(false);
const creating = ref(false);
const createError = ref<string | null>(null);
const createOk = ref(false);

// === Form Button ===
const btnChannel = ref<string>('');
const btnMessageId = ref<string>('');
const btnLabel = ref<string>('');
const btnStyle = ref<string>('primary');
const btnEmoji = ref<string>('');
const btnAction = ref<string>('toggle_role');
const btnRole = ref<string>('');
const btnUrl = ref<string>('');

const canCreateButton = computed(() =>
  btnChannel.value && btnMessageId.value && btnLabel.value &&
  (btnAction.value === 'open_url' ? !!btnUrl.value : !!btnRole.value)
);

async function createButton() {
  if (!canCreateButton.value) return;
  creating.value = true;
  createError.value = null;
  createOk.value = false;
  try {
    const metadata = {
      label: btnLabel.value,
      style: btnStyle.value,
      emoji: btnEmoji.value || undefined,
      action: btnAction.value
    };
    if (btnAction.value === 'open_url') {
      metadata.url = btnUrl.value;
    }
    if (btnRole.value) {
      metadata.roleId = btnRole.value;
    }
    const r = await rr.createButton({
      guildId: process.env.GUILD_ID || '',
      channelId: btnChannel.value,
      messageId: btnMessageId.value,
      label: btnLabel.value,
      style: btnStyle.value,
      emoji: btnEmoji.value || undefined,
      action: btnAction.value,
      roleId: btnRole.value || undefined,
      url: btnAction.value === 'open_url' ? btnUrl.value : undefined
    });
    if (!r.success) {
      createError.value = r.error || 'Erreur';
      return;
    }
    if (r.data) components.value.unshift(r.data);
    createOk.value = true;
    setTimeout(() => createOk.value = false, 3000);
    btnLabel.value = ''; btnEmoji.value = ''; btnUrl.value = '';
  } catch (e: any) {
    createError.value = e.message;
  } finally {
    creating.value = false;
  }
}

// === Form Select ===
const selChannel = ref<string>('');
const selMessageId = ref<string>('');
const selPlaceholder = ref<string>('Choisis une option…');
const selMinValues = ref<number>(1);
const selMaxValues = ref<number>(1);
const selOptionsRaw = ref<string>('');

const canCreateSelect = computed(() => {
  if (!selChannel.value || !selMessageId.value) return false;
  if (selMinValues.value > selMaxValues.value) return false;
  const opts = parseOptions(selOptionsRaw.value);
  return opts.length >= 1 && opts.length <= 25;
});

function parseOptions(raw: string) {
  return raw.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 2) return null;
    const opt: any = { label: parts[0], value: parts[1] };
    if (parts[2]) opt.roleId = parts[2];
    return opt;
  }).filter(Boolean);
}

async function createSelect() {
  if (!canCreateSelect.value) return;
  creating.value = true;
  createError.value = null;
  createOk.value = false;
  try {
    const options = parseOptions(selOptionsRaw.value);
    const r = await rr.createSelect({
      guildId: process.env.GUILD_ID || '',
      channelId: selChannel.value,
      messageId: selMessageId.value,
      placeholder: selPlaceholder.value,
      minValues: selMinValues.value,
      maxValues: selMaxValues.value,
      options
    });
    if (!r.success) {
      createError.value = r.error || 'Erreur';
      return;
    }
    if (r.data) components.value.unshift(r.data);
    createOk.value = true;
    setTimeout(() => createOk.value = false, 3000);
    selOptionsRaw.value = '';
  } catch (e: any) {
    createError.value = e.message;
  } finally {
    creating.value = false;
  }
}

async function del(id: string) {
  if (!confirm('Supprimer ce component ?')) return;
  try {
    await rr.remove(id);
    components.value = components.value.filter(c => c.id !== id);
  } catch (e: any) {
    createError.value = e.message;
  }
}

async function load() {
  loading.value = true;
  try {
    const all = await rr.list({ limit: 200 });
    components.value = all.filter(c => c.kind === 'button' || c.kind === 'select');
  } finally {
    loading.value = false;
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
.config-desc code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--background-secondary);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.tab {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.tab.active {
  background: var(--brand-experiment, #5865f2);
  color: white;
  border-color: transparent;
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
}
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; }
.module-btn-sm { padding: 4px 10px; font-size: 12px; }

.comp-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.comp-row:last-child { border-bottom: none; }
.comp-row__icon {
  font-size: 22px;
  text-align: center;
  width: 40px;
  height: 40px;
  line-height: 40px;
  background: rgba(88, 101, 242, 0.1);
  border-radius: 8px;
}
.comp-row__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 4px;
}
.comp-row__meta { font-size: 11px; color: var(--text-muted); }
.comp-row__meta code {
  font-family: 'JetBrains Mono', monospace;
  background: var(--background-secondary);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
}

.kind-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.kind-badge.kind-button { background: rgba(88, 101, 242, 0.2); color: #5865f2; }
.kind-badge.kind-select { background: rgba(155, 89, 182, 0.2); color: #9b59b6; }
</style>
