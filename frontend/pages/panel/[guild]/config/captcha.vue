<template>
  <div v-if="isLoading" class="config-loading">
    <div class="spinner"></div>
  </div>

  <div v-else class="config-page-wrapper">
    <!-- Paramètres Généraux -->
    <div class="config-card">
      <div class="card-subtitle">🔒 Sas Anti-Raid &amp; Paramètres Généraux</div>
      <p class="config-desc">
        Configurez le comportement du sas de vérification, le salon temporaire et le rôle membre vérifié.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le Captcha</label>
          <span class="config-hint">Crée automatiquement un salon temporaire dédié à chaque nouvel arrivant pour vérifier qu'il est humain.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">🏷️ Rôle Membre Vérifié (Attribué après validation)</label>
          <span class="config-hint">Rôle automatiquement ajouté au membre dès que le calcul est résolu avec succès.</span>
        </div>
        <div style="min-width: 260px;">
          <DiscordRoleSelect
            v-model="config.verified_role_id"
            placeholder="Sélectionner le rôle vérifié…"
          />
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">📜 Salon Discord des Logs de Captcha</label>
          <span class="config-hint">Salon où envoyer l'embed de suivi en direct (création du sas, réponses, validation, kicks).</span>
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
          <input
            v-model="config.captcha_channel_name"
            type="text"
            class="discord-input"
            placeholder="captcha-{username}"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Temps Limite (secondes)</label>
          <input
            v-model.number="config.timeout_seconds"
            type="number"
            min="10"
            max="600"
            class="discord-input"
            placeholder="180"
          />
        </div>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Nombre Max de Tentatives</label>
          <input
            v-model.number="config.max_attempts"
            type="number"
            min="1"
            max="10"
            class="discord-input"
            placeholder="3"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Action en cas d'Échec</label>
          <select v-model="config.failure_action" class="discord-input">
            <option value="kick">Expulsion (Kick)</option>
            <option value="ban">Bannissement (Ban)</option>
            <option value="none">Aucune (Fermeture du salon)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Mode de Captcha -->
    <div class="config-card">
      <div class="card-subtitle">🎯 Mode de Vérification</div>
      <p class="config-desc">
        Choisissez la méthode de vérification présentée aux nouveaux membres.
      </p>

      <div class="form-row">
        <div class="col-full">
          <label class="form-label">Type de Captcha</label>
          <select v-model="config.captcha_type" class="discord-input">
            <option value="math">🧮 Math — Calcul arithmétique en texte (recommandé)</option>
            <option value="image">🖼️ Image — Reconnaissance de texte sur image PNG (requiert Canvas)</option>
            <option value="web">🌐 Web — Page externe hCaptcha</option>
          </select>
        </div>
      </div>

      <!-- Accessibilité audio -->
      <div class="config-item" style="margin-top: 18px;">
        <div class="config-label-group">
          <label class="config-label">🔊 Accessibilité audio (TTS) — uniquement pour le mode Math</label>
          <span class="config-hint">
            Attache un fichier WAV prononçant la question mathématique pour les personnes malvoyantes.
          </span>
        </div>
        <label class="switch" :class="{ disabled: config.captcha_type !== 'math' }">
          <input
            v-model="config.audio_accessibility"
            type="checkbox"
            :disabled="config.captcha_type !== 'math'"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Formulation & Opérateurs Textuels -->
    <div v-show="config.captcha_type === 'math'" class="config-card">
      <div class="card-subtitle">🔢 Formulation &amp; Opérateurs en Français</div>
      <p class="config-desc">
        Personnalisez la façon dont les nombres et opérateurs sont présentés aux nouveaux membres pour bloquer les OCR.
      </p>

      <div class="form-row" style="margin-bottom: 18px;">
        <div class="col-third">
          <label class="form-label">Nombre 1</label>
          <select v-model="config.num1_mode" class="discord-input">
            <option value="text">📝 Texte (ex: "douze")</option>
            <option value="digit">🔢 Chiffre (ex: "12")</option>
            <option value="random">🎲 Aléatoire</option>
          </select>
        </div>
        <div class="col-third">
          <label class="form-label">Opérateur</label>
          <select v-model="config.operator_mode" class="discord-input">
            <option value="text">📝 Texte (ex: "plus")</option>
            <option value="symbol">🔣 Symbole (ex: "+")</option>
            <option value="random">🎲 Aléatoire</option>
          </select>
        </div>
        <div class="col-third">
          <label class="form-label">Nombre 2</label>
          <select v-model="config.num2_mode" class="discord-input">
            <option value="text">📝 Texte (ex: "douze")</option>
            <option value="digit">🔢 Chiffre (ex: "12")</option>
            <option value="random">🎲 Aléatoire</option>
          </select>
        </div>
      </div>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le mode texte pour les opérateurs</label>
          <span class="config-hint">
            Active la conversion automatique des symboles en mots (<code>+</code> → <code>plus</code>, <code>-</code> → <code>moins</code>, <code>*</code> → <code>fois</code>).
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
          Réponse attendue de l'utilisateur : <code>29</code><br>
          <em>Opérateur : <strong>{{ config.operator_mode === 'random' ? 'texte ou symbole (aléatoire)' : config.operator_mode === 'text' ? 'texte' : 'symbole' }}</strong> — Nombres : <strong>{{ config.num1_mode === 'random' ? 'texte ou chiffre (aléatoire)' : config.num1_mode === 'text' ? 'texte' : 'chiffre' }}</strong>.</em>
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
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useConfigFeature } from '~/composables/useConfigFeature.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

definePageMeta({
  title: 'Configuration Captcha',
  hidden: true
});

useSeoMeta({
  title: 'Captcha Mathématique - Configuration',
  description: 'Configuration de la vérification anti-raid par captcha'
});

const route = useRoute();
const guildId = (route.params.guild as string) || 'default';

const { config, isLoading, isSaving, load, save } = useConfigFeature('captcha', {
  defaultConfig: {
    enabled: true,
    captcha_type: 'math',
    audio_accessibility: false,
    verified_role_id: null,
    log_channel_id: null,
    captcha_channel_name: 'captcha-{username}',
    timeout_seconds: 180,
    max_attempts: 3,
    failure_action: 'kick',
    use_word_operators: false,
    num1_mode: 'text',
    num2_mode: 'text',
    operator_mode: 'symbol',
    math_questions: {
      min_number: 1,
      max_number: 20,
      operations: ['+', '-', '*'],
      use_word_operators: false,
      word_operators: { '+': 'plus', '-': 'moins', '*': 'fois' }
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
  if (config.value?.use_word_operators || config.value?.math_questions?.use_word_operators) {
    return wordOperators['+'] || 'plus';
  }
  return '+';
});

async function saveModuleConfig() {
  if (!config.value.math_questions) {
    config.value.math_questions = { min_number: 1, max_number: 20, operations: ['+', '-', '*'] };
  }
  config.value.math_questions.use_word_operators = !!config.value.use_word_operators;
  config.value.math_questions.word_operators = { ...wordOperators };
  config.value.word_operators = { ...wordOperators };

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

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.col-half {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-third {
  flex: 1;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-full {
  flex: 1;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-normal, #dbdee1);
}

.sub-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted, #949ba4);
  margin-bottom: 4px;
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
}

.op-highlight {
  color: var(--blurple, #5865f2);
  background: rgba(88, 101, 242, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.preview-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted, #949ba4);
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

.switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
