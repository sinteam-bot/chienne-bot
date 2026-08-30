<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres du Système XP & Niveaux</div>
      <p class="config-desc">
        Configurez les taux d'attribution d'expérience par message textuel et temps passé en vocal.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activation du Système d'XP</label>
          <span class="config-hint">Permet aux membres de gagner de l'expérience en discutant dans les salons et en vocal.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="card-subtitle" style="margin-top: 18px;">💬 Gains d'XP par Message Textuel</div>
      <div class="form-row">
        <div class="col-half">
          <label class="form-label">XP Minimum par message</label>
          <input v-model.number="config.message_xp.min" type="number" class="discord-input" />
        </div>
        <div class="col-half">
          <label class="form-label">XP Maximum par message</label>
          <input v-model.number="config.message_xp.max" type="number" class="discord-input" />
        </div>
      </div>
      <div class="form-row" style="margin-top: 10px;">
        <div class="col-half">
          <label class="form-label">Délai de rechargement / Cooldown (secondes)</label>
          <input v-model.number="config.message_xp.cooldown" type="number" class="discord-input" />
        </div>
      </div>

      <div class="card-subtitle" style="margin-top: 18px;">🎙️ Gains d'XP Vocal</div>
      <div class="form-row">
        <div class="col-half">
          <label class="form-label">XP par Minute en salon vocal</label>
          <input v-model.number="config.voice_xp.per_minute" type="number" class="discord-input" />
        </div>
        <div class="col-half">
          <label class="form-label">Intervalle de vérification (secondes)</label>
          <input v-model.number="config.voice_xp.check_interval" type="number" class="discord-input" />
        </div>
      </div>

      <div class="card-subtitle" style="margin-top: 18px;">📈 Calcul des Niveaux</div>
      <div class="form-row">
        <div class="col-half">
          <label class="form-label">XP de Base (Niveau 1)</label>
          <input v-model.number="config.level.base_xp" type="number" class="discord-input" />
        </div>
        <div class="col-half">
          <label class="form-label">Multiplicateur par Niveau</label>
          <input v-model.number="config.level.multiplier" type="number" step="0.1" class="discord-input" />
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 20px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration XP' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';

definePageMeta({
  title: 'Configuration & Paliers',
  icon: '⚙️',
  description: 'Configuration du calcul d\'XP (messages/vocal) et des paliers de niveaux',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration & Paliers - Système XP',
  description: 'Configuration du calcul d\'XP (messages/vocal) et des paliers de niveaux',
  ogTitle: 'Configuration & Paliers - Système XP',
  ogDescription: 'Configuration du calcul d\'XP (messages/vocal) et des paliers de niveaux'
});

const { config, isSaving, load, save } = useConfigFeature('xp', {
  defaultConfig: {
    enabled: true,
    message_xp: { min: 15, max: 25, cooldown: 10 },
    voice_xp: { per_minute: 2, check_interval: 5, min_duration: 1 },
    level: { base_xp: 100, multiplier: 1.5 }
  }
});

async function saveModuleConfig() {
  await save();
}

onMounted(() => {
  load();
});
</script>
