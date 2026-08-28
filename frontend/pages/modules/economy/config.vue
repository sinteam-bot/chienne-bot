<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres Généraux</div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Économie</label>
          <span class="config-hint">Active la monnaie virtuelle, le shop, les drops et les échanges.</span>
        </div>
        <label class="switch">
          <input v-model="form.enabled" type="checkbox" @change="dirty = true" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Récompense quotidienne</label>
          <span class="config-hint">Montant du /daily. Cooldown configurable ci-dessous.</span>
        </div>
        <input
          v-model.number="form.daily_reward"
          type="number"
          min="0"
          class="discord-input"
          style="width: 100px; text-align: center;"
          @change="dirty = true"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Cooldown /daily (heures)</label>
          <span class="config-hint">Nombre d'heures entre deux claims quotidiens.</span>
        </div>
        <input
          v-model.number="form.cooldown_hours"
          type="number"
          min="1"
          max="168"
          class="discord-input"
          style="width: 80px; text-align: center;"
          @change="dirty = true"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Solde de départ</label>
          <span class="config-hint">Montant donné aux nouveaux membres à leur première interaction.</span>
        </div>
        <input
          v-model.number="form.starting_balance"
          type="number"
          min="0"
          class="discord-input"
          style="width: 100px; text-align: center;"
          @change="dirty = true"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Taxe /pay (%)</label>
          <span class="config-hint">Pourcentage prélevé sur chaque transfert (0 = aucune taxe).</span>
        </div>
        <input
          v-model.number="form.tax_percent"
          type="number"
          min="0"
          max="50"
          class="discord-input"
          style="width: 80px; text-align: center;"
          @change="dirty = true"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Solde maximum</label>
          <span class="config-hint">Plafond dur pour éviter les overflows.</span>
        </div>
        <input
          v-model.number="form.max_balance"
          type="number"
          min="1"
          class="discord-input"
          style="width: 140px; text-align: center;"
          @change="dirty = true"
        />
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">🎁 Drops</div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Durée par défaut (min)</label>
          <span class="config-hint">Durée appliquée si l'argument n'est pas fourni à /dropobjet.</span>
        </div>
        <input
          v-model.number="form.drops.default_duration_min"
          type="number"
          min="1"
          max="10"
          class="discord-input"
          style="width: 60px; text-align: center;"
          @change="dirty = true"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Durée max (min)</label>
          <span class="config-hint">Borne supérieure pour /dropobjet.</span>
        </div>
        <input
          v-model.number="form.drops.max_duration_min"
          type="number"
          min="1"
          max="60"
          class="discord-input"
          style="width: 60px; text-align: center;"
          @change="dirty = true"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Claim par bouton uniquement</label>
          <span class="config-hint">Si activé (par défaut), les membres cliquent sur un bouton "Récupérer". Sinon, la 🎉 réaction claim aussi.</span>
        </div>
        <label class="switch">
          <input v-model="form.drops.require_button" type="checkbox" @change="dirty = true" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">📦 Inventaire</div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Items max par user</label>
          <span class="config-hint">Limite dure d'items cumulés (somme des quantités) par user.</span>
        </div>
        <input
          v-model.number="form.inventory.max_per_user"
          type="number"
          min="1"
          class="discord-input"
          style="width: 100px; text-align: center;"
          @change="dirty = true"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Quantité max par item</label>
          <span class="config-hint">Quantité maximale pour un même item dans l'inventaire d'un user.</span>
        </div>
        <input
          v-model.number="form.inventory.max_quantity_per_item"
          type="number"
          min="1"
          class="discord-input"
          style="width: 100px; text-align: center;"
          @change="dirty = true"
        />
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">📚 Retention</div>
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Rétention de l'historique (jours)</label>
          <span class="config-hint">Les transactions plus anciennes que X jours sont éligibles au nettoyage cron.</span>
        </div>
        <input
          v-model.number="form.history_retention_days"
          type="number"
          min="1"
          class="discord-input"
          style="width: 100px; text-align: center;"
          @change="dirty = true"
        />
      </div>
    </div>

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
  daily_reward: 100,
  cooldown_hours: 22,
  starting_balance: 0,
  tax_percent: 0,
  max_balance: 999999999,
  drops: { default_duration_min: 2, max_duration_min: 10, require_button: true },
  inventory: { max_per_user: 200, max_quantity_per_item: 999 },
  history_retention_days: 90
});

const dirty = ref(false);
const saving = ref(false);
const saveOk = ref(false);
const saveError = ref<string | null>(null);

async function load() {
  try {
    const state: any = await features.get('economy');
    const cfg = state?.state?.config || state?.config || {};
    form.enabled = !!cfg.enabled;
    form.daily_reward = cfg.daily_reward ?? 100;
    form.cooldown_hours = cfg.cooldown_hours ?? 22;
    form.starting_balance = cfg.starting_balance ?? 0;
    form.tax_percent = cfg.tax_percent ?? 0;
    form.max_balance = cfg.max_balance ?? 999999999;
    form.drops = { ...form.drops, ...(cfg.drops || {}) };
    form.inventory = { ...form.inventory, ...(cfg.inventory || {}) };
    form.history_retention_days = cfg.history_retention_days ?? 90;
    dirty.value = false;
  } catch (e: any) {
    saveError.value = e.message;
  }
}

async function save() {
  saving.value = true;
  saveError.value = null;
  try {
    await features.update('economy', { ...form });
    dirty.value = false;
    saveOk.value = true;
    setTimeout(() => (saveOk.value = false), 3000);
  } catch (e: any) {
    saveError.value = e.message;
  } finally {
    saving.value = false;
  }
}

function reload() { load(); }

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
.config-hint { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
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

.switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; inset: 0;
  background: #4e5058; border-radius: 12px;
  cursor: pointer; transition: background 0.2s;
}
.slider::before {
  content: '';
  position: absolute;
  width: 18px; height: 18px;
  left: 3px; top: 3px;
  background: white; border-radius: 50%;
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
