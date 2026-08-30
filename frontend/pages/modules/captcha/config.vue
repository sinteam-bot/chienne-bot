<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Paramètres Généraux -->
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres du Captcha</div>
      <p class="config-desc">
        Configurez le comportement du salon temporaire, les rôles attribués et les règles de sécurité.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le Captcha</label>
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

    <!-- Mode de Captcha -->
    <div class="config-card">
      <div class="card-subtitle">🎯 Mode de Vérification</div>
      <p class="config-desc">
        Choisissez la méthode de vérification présentée aux nouveaux membres. Chaque mode a ses prérequis.
      </p>

      <div class="form-row">
        <div class="col-full">
          <label class="form-label">Type de captcha</label>
          <select v-model="config.captcha_type" class="discord-input discord-select">
            <option value="math">🧮 Math — Calcul arithmétique en texte (par défaut)</option>
            <option value="image">🖼️ Image — Reconnaissance de texte sur image PNG (requiert canvas)</option>
            <option value="web">🌐 Web — Page hCaptcha externe (requiert HCAPTCHA_SITE_KEY + HCAPTCHA_SECRET)</option>
          </select>
        </div>
      </div>

      <!-- Encadré d'aperçu / prérequis par mode -->
      <div class="preview-box" style="margin-top: 14px;">
        <div class="preview-title">ℹ️ Comportement selon le mode sélectionné :</div>
        <div v-if="config.captcha_type === 'math'" class="preview-text">
          <strong>🧮 Math :</strong> le membre reçoit « Combien font 7 + 5 ? » et doit répondre par le chiffre.
          <div class="preview-hint">Aucun prérequis. Toujours fonctionnel. Recommandé pour démarrer.</div>
        </div>
        <div v-else-if="config.captcha_type === 'image'" class="preview-text">
          <strong>🖼️ Image :</strong> le membre voit une image avec un texte déformé et doit le recopier.
          <div class="preview-hint">
            Prérequis : la bibliothèque <code>canvas</code> doit être installée (<code>npm install canvas</code>).
            Si absente, le bot fallback automatiquement sur le mode math.
          </div>
        </div>
        <div v-else-if="config.captcha_type === 'web'" class="preview-text">
          <strong>🌐 Web :</strong> le membre clique sur un bouton qui ouvre une page web avec hCaptcha,
          puis colle le token de validation dans Discord.
          <div class="preview-hint">
            Prérequis : <code>HCAPTCHA_SITE_KEY</code> et <code>HCAPTCHA_SECRET</code> dans <code>.env</code>,
            et <code>WEB_BASE_URL</code> doit pointer sur l'URL publique HTTPS du bot.
            Si une variable manque, fallback sur math.
          </div>
        </div>
      </div>

      <!-- Accessibilité audio (uniquement pertinente pour math) -->
      <div class="config-item" style="margin-top: 18px;">
        <div class="config-label-group">
          <label class="config-label">🔊 Accessibilité audio (TTS) — uniquement pour le mode Math</label>
          <span class="config-hint">
            Attache un fichier WAV au message d'accueil qui prononce la question mathématique.
            Le membre peut l'écouter localement s'il a des difficultés de lecture.
            <span v-if="config.captcha_type !== 'math'">
              <br><em style="color: var(--text-muted);">⚠️ Non applicable aux modes image / web (ignoré).</em>
            </span>
          </span>
        </div>
        <label class="switch" :class="{ disabled: config.captcha_type !== 'math' }">
          <input v-model="config.audio_accessibility" type="checkbox" :disabled="config.captcha_type !== 'math'" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Formulation & Opérateurs Textuels (uniquement pour le mode Math) -->
    <div class="config-card" v-show="config.captcha_type === 'math'">
      <div class="card-subtitle">🔢 Formulation &amp; Représentation</div>
      <p class="config-desc">
        Personnalisez la façon dont les nombres et opérateurs sont présentés aux nouveaux membres.
        Chaque champ peut être rendu en <strong>texte</strong>, en <strong>symbole/chiffre</strong>, ou en <strong>aléatoire</strong>.
      </p>

      <!-- Modes par champ -->
      <div class="form-row" style="margin-bottom: 18px;">
        <div class="col-third">
          <label class="form-label">Nombre 1</label>
          <select v-model="config.num1_mode" class="discord-input discord-select">
            <option value="text">📝 Texte (ex: "douze")</option>
            <option value="digit">🔢 Chiffre (ex: "12")</option>
            <option value="random">🎲 Aléatoire</option>
          </select>
        </div>
        <div class="col-third">
          <label class="form-label">Opérateur</label>
          <select v-model="config.operator_mode" class="discord-input discord-select">
            <option value="text">📝 Texte (ex: "plus")</option>
            <option value="symbol">🔣 Symbole (ex: "+")</option>
            <option value="random">🎲 Aléatoire</option>
          </select>
        </div>
        <div class="col-third">
          <label class="form-label">Nombre 2</label>
          <select v-model="config.num2_mode" class="discord-input discord-select">
            <option value="text">📝 Texte (ex: "douze")</option>
            <option value="digit">🔢 Chiffre (ex: "12")</option>
            <option value="random">🎲 Aléatoire</option>
          </select>
        </div>
      </div>

      <div class="config-item" style="margin-top: 8px;">
        <div class="config-label-group">
          <label class="config-label">Activer le mode texte pour les opérateurs</label>
          <span class="config-hint">
            Active la conversion automatique des opérateurs en mots (ex: <code>+</code> → <code>plus</code>) quand l'opérateur est rendu en mode <strong>texte</strong>.
            Si désactivé, l'opérateur est toujours affiché en symbole, indépendamment du mode choisi ci-dessus.
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
          <em>Avec vos réglages, l'opérateur sera rendu en <strong>{{ config.operator_mode === 'random' ? 'texte ou symbole (aléatoire)' : config.operator_mode === 'text' ? 'texte' : 'symbole' }}</strong>, et les nombres en <strong>{{ config.num1_mode === 'random' ? 'texte ou chiffre (aléatoire)' : config.num1_mode === 'text' ? 'texte' : 'chiffre' }}</strong>.</em>
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
  description: 'Configuration du captcha : mode, rôle vérifié, timeout et règles de sécurité',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration - Captcha',
  description: 'Configuration du captcha : mode, rôle vérifié, timeout et règles de sécurité',
  ogTitle: 'Configuration - Captcha',
  ogDescription: 'Configuration du captcha : mode, rôle vérifié, timeout et règles de sécurité'
});

const { config, isSaving, load, save } = useConfigFeature('captcha', {
  defaultConfig: {
    enabled: true,
    captcha_type: 'math',
    audio_accessibility: false,
    log_channel_id: null,
    verified_role_id: '',
    captcha_channel_name: 'captcha-{username}',
    captcha_timeout: 10,
    max_attempts: 3,
    use_word_operators: false,
    num1_mode: 'text',
    num2_mode: 'text',
    operator_mode: 'symbol',
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

  // Normalisation du type (fallback sur math si invalide)
  const validTypes = ['math', 'image', 'web'];
  if (!validTypes.includes(config.value.captcha_type)) {
    config.value.captcha_type = 'math';
  }

  // audio_accessibility n'a de sens qu'avec math ; on persiste la
  // valeur telle quelle (le service ignore si le type != math)
  if (typeof config.value.audio_accessibility !== 'boolean') {
    config.value.audio_accessibility = false;
  }

  // Modes de représentation math (text/digit/random)
  const validNumModes = ['text', 'digit', 'random'];
  const validOpModes = ['text', 'symbol', 'random'];
  if (!validNumModes.includes(config.value.num1_mode)) config.value.num1_mode = 'text';
  if (!validNumModes.includes(config.value.num2_mode)) config.value.num2_mode = 'text';
  if (!validOpModes.includes(config.value.operator_mode)) config.value.operator_mode = 'symbol';

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

.col-full {
  flex: 1;
  min-width: 100%;
}

.switch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
