<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- Paramètres Généraux -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres Généraux de l'Économie</div>
      <p class="config-desc">
        Configurez la monnaie virtuelle, les récompenses quotidiennes, les taxes et les limites de solde.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Économie</label>
          <span class="config-hint">Active la monnaie virtuelle, la boutique, les drops et les échanges.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Récompense quotidienne (/daily)</label>
          <span class="config-hint">Montant en pièces offert lors de la commande /daily.</span>
        </div>
        <input
          v-model.number="config.daily_reward"
          type="number"
          min="0"
          class="discord-input"
          style="width: 120px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Cooldown /daily (heures)</label>
          <span class="config-hint">Nombre d'heures entre deux récompenses quotidiennes.</span>
        </div>
        <input
          v-model.number="config.cooldown_hours"
          type="number"
          min="1"
          max="168"
          class="discord-input"
          style="width: 80px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Solde de départ</label>
          <span class="config-hint">Montant accordé aux nouveaux membres à leur première interaction.</span>
        </div>
        <input
          v-model.number="config.starting_balance"
          type="number"
          min="0"
          class="discord-input"
          style="width: 120px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Taxe sur les virements /pay (%)</label>
          <span class="config-hint">Pourcentage prélevé sur chaque transfert (0 = aucune taxe).</span>
        </div>
        <input
          v-model.number="config.tax_percent"
          type="number"
          min="0"
          max="50"
          class="discord-input"
          style="width: 80px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Solde maximum autorisé</label>
          <span class="config-hint">Plafond dur pour éviter les overflows mathématiques.</span>
        </div>
        <input
          v-model.number="config.max_balance"
          type="number"
          min="1"
          class="discord-input"
          style="width: 140px; text-align: center;"
        />
      </div>
    </div>

    <!-- Drops & Cadeaux -->
    <div class="config-card">
      <div class="card-subtitle">🎁 Drops &amp; Boîtes Cadeaux</div>
      <p class="config-desc">
        Configuration des distributions d'objets ou de pièces dans les salons textuels.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Durée par défaut (minutes)</label>
          <span class="config-hint">Durée appliquée si l'argument n'est pas fourni à /drop.</span>
        </div>
        <input
          v-if="config.drops"
          v-model.number="config.drops.default_duration_min"
          type="number"
          min="1"
          max="10"
          class="discord-input"
          style="width: 80px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Durée maximum (minutes)</label>
          <span class="config-hint">Borne supérieure pour les drops programmés.</span>
        </div>
        <input
          v-if="config.drops"
          v-model.number="config.drops.max_duration_min"
          type="number"
          min="1"
          max="60"
          class="discord-input"
          style="width: 80px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Récupération par bouton uniquement</label>
          <span class="config-hint">Si activé, les membres doivent cliquer sur le bouton "Récupérer" pour claim.</span>
        </div>
        <label class="switch">
          <input
            v-if="config.drops"
            v-model="config.drops.require_button"
            type="checkbox"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Inventaire -->
    <div class="config-card">
      <div class="card-subtitle">📦 Limites d'Inventaire</div>
      <p class="config-desc">
        Capacités maximales de stockage par utilisateur et par item.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Items max par utilisateur</label>
          <span class="config-hint">Limite dure d'items cumulés (somme des quantités) par membre.</span>
        </div>
        <input
          v-if="config.inventory"
          v-model.number="config.inventory.max_per_user"
          type="number"
          min="1"
          class="discord-input"
          style="width: 100px; text-align: center;"
        />
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Quantité max par item</label>
          <span class="config-hint">Quantité maximale pour un même objet dans l'inventaire d'un membre.</span>
        </div>
        <input
          v-if="config.inventory"
          v-model.number="config.inventory.max_quantity_per_item"
          type="number"
          min="1"
          class="discord-input"
          style="width: 100px; text-align: center;"
        />
      </div>
    </div>

    <!-- Rétention -->
    <div class="config-card">
      <div class="card-subtitle">📚 Rétention des Transactions</div>
      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Rétention de l'historique (jours)</label>
          <span class="config-hint">Les transactions plus anciennes que X jours sont nettoyées automatiquement par tâche cron.</span>
        </div>
        <input
          v-model.number="config.history_retention_days"
          type="number"
          min="1"
          class="discord-input"
          style="width: 100px; text-align: center;"
        />
      </div>
    </div>

    <div class="config-actions-bar">
      <button class="btn-primary" :disabled="isSaving" @click="saveConfig">
        {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Économie' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';

definePageMeta({
  title: 'Configuration Économie',
  hidden: true
});

useSeoMeta({
  title: 'Économie & Boutique - Configuration',
  description: 'Configuration de l\'économie, drops et inventaire virtuel'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('economy', {
  defaultConfig: {
    enabled: true,
    daily_reward: 100,
    cooldown_hours: 22,
    starting_balance: 0,
    tax_percent: 0,
    max_balance: 999999999,
    drops: { default_duration_min: 2, max_duration_min: 10, require_button: true },
    inventory: { max_per_user: 200, max_quantity_per_item: 999 },
    history_retention_days: 90
  }
});

async function saveConfig() {
  await save(config.value, guildId);
}

onMounted(() => {
  load(guildId);
});
</script>

<style scoped>
.config-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card {
  background: var(--bg-secondary, #2b2d31);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-md, 8px);
  padding: 20px;
}

.card-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  margin-bottom: 4px;
}

.config-desc {
  font-size: 13px;
  color: var(--text-muted, #949ba4);
  margin-bottom: 16px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.04));
  gap: 16px;
}

.config-item:last-child {
  border-bottom: none;
}

.config-label-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
}

.config-hint {
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.discord-input {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 4px);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-normal, #dbdee1);
  outline: none;
  transition: border-color var(--transition-fast);
}

.discord-input:focus {
  border-color: var(--blurple, #5865F2);
}

.config-actions-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

.btn-primary {
  background: var(--blurple, #5865F2);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm, 4px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  background: var(--blurple-hover, #4752c4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary, #4e5058);
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--status-positive, #57f287);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.config-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--blurple, #5865F2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
