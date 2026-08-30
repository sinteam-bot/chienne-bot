<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Paramètres Généraux -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres du Captcha Mathématique</div>
      <p class="config-desc">
        Configurez le comportement du salon temporaire, les rôles attribués et les règles de sécurité.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le Captcha Mathématique</label>
          <span class="config-hint">Crée automatiquement un salon temporaire dédié à chaque nouveau membre pour vérifier qu'il est humain.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Rôle Membre Vérifié (Attribué après validation)</label>
          <span class="config-hint">Rôle automatiquement ajouté au membre dès que le calcul est résolu avec succès.</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordRoleSelect
            v-model="config.verified_role_id"
            placeholder="Sélectionner le rôle vérifié..."
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">📡 Salon de Logs des Vérifications Discord</label>
          <span class="config-hint">Salon où envoyer l'embed de suivi en direct (création du sas, tentatives du membre, validation, échecs ou kicks). Si aucun salon n'est sélectionné, les logs Discord sont désactivés.</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordChannelSelect
            v-model="config.log_channel_id"
            :allow-null="true"
            null-label="— Aucun salon (Logs Discord désactivés) —"
            :filter-text-only="true"
            placeholder="Sélectionner un salon de logs…"
          />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Format de Nom du Salon Temporaire</label>
          <input v-model="config.captcha_channel_name" type="text" class="discord-input" placeholder="captcha-{username}" />
        </div>
        <div class="col-half">
          <label class="form-label">Temps limite (Minutes)</label>
          <input v-model.number="config.captcha_timeout" type="number" min="1" max="60" class="discord-input" />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Nombre Max de Tentatives</label>
          <input v-model.number="config.max_attempts" type="number" min="1" max="10" class="discord-input" />
        </div>
      </div>
    </div>

    <!-- Formulation & Opérateurs Textuels -->
    <div class="config-card">
      <div class="card-subtitle">🔢 Formulation &amp; Opérateurs Mathématiques</div>
      <p class="config-desc">
        Personnalisez la façon dont les calculs sont énoncés aux nouveaux membres.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Version texte des opérateurs (plus / moins / fois)</label>
          <span class="config-hint">
            Remplace les symboles mathématiques bruts (<code>+</code>, <code>-</code>, <code>*</code>) par des mots en toutes lettres (<code>plus</code>, <code>moins</code>, <code>fois</code>).
          </span>
        </div>
        <label class="switch">
          <input v-model="config.use_word_operators" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <!-- Aperçu en direct -->
      <div class="preview-box" style="margin-top: 14px;">
        <div class="preview-title">👁️ Aperçu de la question générée :</div>
        <div class="preview-text">
          "Combien font douze <span class="op-highlight">{{ previewOperator }}</span> dix-sept ?"
        </div>
        <div class="preview-hint">
          Réponse attendue de l'utilisateur : <code>29</code>
        </div>
      </div>

      <div v-if="config.use_word_operators" style="margin-top: 18px;">
        <label class="form-label" style="margin-bottom: 8px;">Mots personnalisés pour chaque opérateur :</label>
        <div class="form-row">
          <div class="col-third">
            <label class="sub-label">Symbole <code>+</code> (Addition)</label>
            <input v-model="wordOperators['+']" type="text" class="discord-input" placeholder="plus" />
          </div>
          <div class="col-third">
            <label class="sub-label">Symbole <code>-</code> (Soustraction)</label>
            <input v-model="wordOperators['-']" type="text" class="discord-input" placeholder="moins" />
          </div>
          <div class="col-third">
            <label class="sub-label">Symbole <code>*</code> (Multiplication)</label>
            <input v-model="wordOperators['*']" type="text" class="discord-input" placeholder="fois" />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="config-actions-bar">
      <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
        {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Captcha' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

definePageMeta({
  title: 'Configuration',
  icon: '⚙️',
  description: 'Configuration du rôle vérifié, timeout et règles de sécurité',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration - Captcha',
  description: 'Configuration du rôle vérifié, timeout et règles de sécurité',
  ogTitle: 'Configuration - Captcha',
  ogDescription: 'Configuration du rôle vérifié, timeout et règles de sécurité'
});

const { config, isSaving, load, save } = useConfigFeature('captcha', {
  defaultConfig: {
    enabled: true,
    log_channel_id: null,
    verified_role_id: '',
    captcha_channel_name: 'captcha-{username}',
    captcha_timeout: 10,
    max_attempts: 3,
    use_word_operators: false,
    math_questions: {
      min_number: 1,
      max_number: 20,
      use_word_operators: false,
      word_operators: {
        '+': 'plus',
        '-': 'moins',
        '*': 'fois'
      }
    }
  }
});

const wordOperators = reactive<{ [key: string]: string }>({
  '+': 'plus',
  '-': 'moins',
  '*': 'fois'
});

watch(() => config.value, (val) => {
  if (val) {
    const existing = val.math_questions?.word_operators || val.word_operators;
    if (existing && typeof existing === 'object') {
      if (existing['+']) wordOperators['+'] = existing['+'];
      if (existing['-']) wordOperators['-'] = existing['-'];
      if (existing['*']) wordOperators['*'] = existing['*'];
    }
  }
}, { deep: true, immediate: true });

const previewOperator = computed(() => {
  if (config.value.use_word_operators || config.value.math_questions?.use_word_operators) {
    return wordOperators['+'] || 'plus';
  }
  return '+';
});

async function saveModuleConfig() {
  if (!config.value.math_questions) {
    config.value.math_questions = { min_number: 1, max_number: 20 };
  }
  config.value.math_questions.use_word_operators = !!config.value.use_word_operators;
  config.value.math_questions.word_operators = { ...wordOperators };
  config.value.word_operators = { ...wordOperators };

  await save();
}

onMounted(async () => {
  await load();
});
</script>

<style scoped>
.preview-box {
  background: var(--bg-tertiary, #1e1f22);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 6px;
  padding: 14px 16px;
}

.preview-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted, #949ba4);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.preview-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--header-primary, #ffffff);
  font-family: var(--font-primary, sans-serif);
}

.op-highlight {
  color: var(--brand-experiment, #5865f2);
  background: rgba(88, 101, 242, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.preview-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted, #949ba4);
}

.sub-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted, #949ba4);
  margin-bottom: 4px;
}

.col-third {
  flex: 1;
  min-width: 140px;
}
</style>
