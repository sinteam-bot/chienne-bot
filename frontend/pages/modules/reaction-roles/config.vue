<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Activation -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres Généraux</div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Rôles à Réaction</label>
          <span class="config-hint">Active l'attribution automatique de rôles via réactions.</span>
        </div>
        <label class="switch">
          <input v-model="form.enabled" type="checkbox" @change="scheduleSave" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Auto-assignation par les membres</label>
          <span class="config-hint">
            Si activé, n'importe quel membre peut s'attribuer le rôle en cliquant sur la réaction.
            Si désactivé, seuls les staffs (ManageRoles) peuvent déclencher.
          </span>
        </div>
        <label class="switch">
          <input v-model="form.self_assignable" type="checkbox" @change="scheduleSave" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Limite par message</label>
          <span class="config-hint">Nombre maximum de paires emoji↔rôle par message. Sécurité anti-spam.</span>
        </div>
        <input
          v-model.number="form.max_per_message"
          type="number"
          min="1"
          max="50"
          class="discord-input"
          style="width: 80px; text-align: center;"
          @change="scheduleSave"
        />
      </div>
    </div>

    <!-- Rôles autorisés (admin) -->
    <div class="config-card">
      <div class="card-subtitle">🛡️ Rôles autorisés (admin)</div>
      <p class="config-desc">
        Seuls les membres avec l'un de ces rôles (ou la permission ManageRoles)
        peuvent utiliser les commandes <code>/reactionrole-*</code>.
      </p>
      <div style="margin-top: 12px;">
        <DiscordRoleSelect
          v-model="form.allowed_roles"
          multiple
          placeholder="Aucun (tous les admins ManageRoles)"
        />
      </div>
    </div>

    <!-- Aide -->
    <div class="config-card">
      <div class="card-subtitle">💡 Astuces</div>
      <ul style="margin: 8px 0 0 20px; color: var(--text-muted); font-size: 13px; line-height: 1.7;">
        <li>Les <strong>réactions existantes</strong> sur un message sont automatiquement détectées : si un membre retire puis remet la réaction, le rôle est ajouté/retiré.</li>
        <li>Vous pouvez utiliser des <strong>emojis custom</strong> (format <code>nom:id</code>) ou des <strong>emojis unicode</strong> (🎉, ✅, etc.).</li>
        <li>Quand un message avec reaction-roles est <strong>supprimé</strong>, les associations sont automatiquement nettoyées.</li>
        <li>Le bot ne peut pas attribuer des rôles <strong>au-dessus de ses propres rôles</strong> dans la hiérarchie Discord.</li>
      </ul>
    </div>

    <!-- Save bar -->
    <div v-if="dirty" class="config-card" style="position: sticky; bottom: 16px; background: var(--brand-experiment, #5865f2); color: white; display: flex; align-items: center; justify-content: space-between;">
      <span>⚠️ Modifications non enregistrées</span>
      <div style="display: flex; gap: 8px;">
        <button class="module-btn" @click="reload" style="background: rgba(255,255,255,0.15); color: white; border: none;">Annuler</button>
        <button class="module-btn" @click="save" :disabled="saving" style="background: white; color: var(--brand-experiment, #5865f2); border: none; font-weight: 600;">
          {{ saving ? '⏳' : '💾' }} Enregistrer
        </button>
      </div>
    </div>

    <div v-if="saveOk" style="color: var(--green); text-align: center; font-size: 13px;">✅ Configuration enregistrée</div>
    <div v-if="saveError" style="color: var(--red); text-align: center; font-size: 13px;">❌ {{ saveError }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useFeatures } from '~/composables/useFeatures';

const features = useFeatures();

const form = reactive({
  enabled: false,
  self_assignable: true,
  max_per_message: 25,
  allowed_roles: [] as string[]
});

const dirty = ref(false);
const saving = ref(false);
const saveOk = ref(false);
const saveError = ref<string | null>(null);
let saveTimer: any = null;

async function load() {
  try {
    const state: any = await features.get('reaction-roles');
    const cfg = state?.state?.config || state?.config || {};
    form.enabled = !!cfg.enabled;
    form.self_assignable = cfg.self_assignable !== false;
    form.max_per_message = cfg.max_per_message || 25;
    form.allowed_roles = Array.isArray(cfg.allowed_roles) ? cfg.allowed_roles : [];
    dirty.value = false;
  } catch (e) {
    saveError.value = (e as any).message;
  }
}

function scheduleSave() {
  dirty.value = true;
  saveOk.value = false;
  saveError.value = null;
  if (saveTimer) clearTimeout(saveTimer);
  // Pas d'auto-save: l'utilisateur clique "Enregistrer" explicitement
}

async function save() {
  saving.value = true;
  saveError.value = null;
  try {
    await features.update('reaction-roles', {
      enabled: form.enabled,
      self_assignable: form.self_assignable,
      max_per_message: form.max_per_message,
      allowed_roles: form.allowed_roles
    });
    dirty.value = false;
    saveOk.value = true;
    setTimeout(() => (saveOk.value = false), 3000);
  } catch (e: any) {
    saveError.value = e.message;
  } finally {
    saving.value = false;
  }
}

function reload() {
  load();
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
.config-hint {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}
.config-label-group { flex: 1; min-width: 0; }
.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.config-item:last-child { border-bottom: none; }

.switch {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; inset: 0;
  background: #4e5058;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.slider::before {
  content: '';
  position: absolute;
  width: 18px; height: 18px;
  left: 3px; top: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}
.switch input:checked + .slider { background: #57f287; }
.switch input:checked + .slider::before { transform: translateX(20px); }

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
</style>
