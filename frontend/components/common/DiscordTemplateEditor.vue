<template>
  <div class="template-editor-wrapper">
    <!-- Barre Supérieure : Préréglages & Actions -->
    <div class="template-toolbar">
      <div class="toolbar-left">
        <label for="template-preset-select" class="toolbar-label">📋 Modèle Prédéfini :</label>
        <select
          id="template-preset-select"
          v-model="selectedPresetId"
          class="discord-select preset-select"
          @change="loadSelectedPreset"
        >
          <option value="" disabled>-- Choisir un modèle --</option>
          <option v-for="p in presets" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>

        <button class="action-btn" title="Réinitialiser le modèle actuel" @click="resetToCurrentPreset">
          🔄 Réinitialiser
        </button>
      </div>

      <div class="toolbar-right">
        <button class="action-btn" title="Copier le template" @click="copyTemplate">
          📋 Copier le Template
        </button>
        <button class="action-btn" title="Copier le payload compilé" @click="copyCompiledPayload">
          📦 Copier le Payload JSON
        </button>
      </div>
    </div>

    <!-- Grille Principale 2 Colonnes (Éditeur à gauche, Prévisualisation à droite) -->
    <div class="template-main-grid">
      
      <!-- =================================================================== -->
      <!-- COLONNE GAUCHE : ÉDITEUR DE TEMPLATE & CONTEXTE JSON                -->
      <!-- =================================================================== -->
      <div class="editor-pane config-card">
        
        <!-- Onglets Mode d'Édition -->
        <div class="editor-tabs">
          <button
            :class="['editor-tab-btn', { active: editorMode === 'embed' }]"
            @click="editorMode = 'embed'"
          >
            ✨ Embed & Message
          </button>
          <button
            :class="['editor-tab-btn', { active: editorMode === 'json' }]"
            @click="editorMode = 'json'"
          >
            💻 JSON Brut
          </button>
          <button
            :class="['editor-tab-btn', { active: editorMode === 'context' }]"
            @click="editorMode = 'context'"
          >
            📊 Données de Test (JSON)
          </button>
        </div>

        <!-- Palette d'Insertion Rapide de Balises -->
        <div class="quick-tags-bar">
          <span class="quick-tags-title">⚡ Insertion rapide :</span>
          <div class="quick-tags-list">
            <button class="quick-tag-btn" @click="insertTag('{{ user.id | userMention }}')">@User</button>
            <button class="quick-tag-btn" @click="insertTag('{{ channel.id | channelMention }}')">#Salon</button>
            <button class="quick-tag-btn" @click="insertTag('{{ role.id | roleMention }}')">@Rôle</button>
            <button class="quick-tag-btn" @click="insertTag('{{ count | number }}')">1 000 (nb)</button>
            <button class="quick-tag-btn" @click="insertTag('{{ date | timeAgo }}')">Il y a X min</button>
            <button class="quick-tag-btn" @click="insertTag('{{ text | bold }}')">**Gras**</button>
            <button class="quick-tag-btn" @click="insertTag('{{ text | code }}')">`Code`</button>
            <button class="quick-tag-btn highlight" @click="insertLoopSnippet()">🔁 Boucle For</button>
            <button class="quick-tag-btn highlight" @click="insertIfSnippet()">❓ Condition If</button>
          </div>
        </div>

        <!-- MODE 1 : CONSTRUCTEUR D'EMBED VISUEL -->
        <div v-show="editorMode === 'embed'" class="form-container">
          
          <!-- Message textuel au-dessus de l'embed -->
          <div class="form-group">
            <div class="label-with-badge">
              <label class="form-label">Message Texte Simple (Content)</label>
              <span class="char-counter" :class="{ danger: (templateState.content?.length || 0) > 2000 }">
                {{ templateState.content?.length || 0 }} / 2000
              </span>
            </div>
            <textarea
              ref="contentInputRef"
              v-model="templateState.content"
              class="discord-textarea"
              rows="2"
              placeholder="Texte Discord (ex: Bonjour {{ user.id | userMention }} !)"
            ></textarea>
          </div>

          <!-- Champs Embed -->
          <div class="embed-builder-box">
            <div class="embed-builder-header">
              <span class="embed-header-title">📐 Structure de l'Embed Discord</span>
              <div class="color-picker-group">
                <label for="color-input">Couleur :</label>
                <input
                  id="color-input"
                  v-model="templateState.embed.color"
                  type="text"
                  class="discord-input color-text-input"
                  placeholder="#5865F2"
                />
                <input
                  v-model="colorPickerValue"
                  type="color"
                  class="color-picker-bubble"
                  @input="onColorPickerChange"
                />
              </div>
            </div>

            <!-- Titre & URL -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Titre de l'Embed</label>
                <input
                  v-model="templateState.embed.title"
                  type="text"
                  class="discord-input"
                  placeholder="ex: 🏆 Classement de {{ guild.name }}"
                />
              </div>
              <div class="form-group">
                <label class="form-label">URL du Titre (optionnel)</label>
                <input
                  v-model="templateState.embed.url"
                  type="text"
                  class="discord-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <div class="label-with-badge">
                <label class="form-label">Description (Supporte boucles & markdown)</label>
                <span class="char-counter" :class="{ danger: (templateState.embed.description?.length || 0) > 4096 }">
                  {{ templateState.embed.description?.length || 0 }} / 4096
                </span>
              </div>
              <textarea
                ref="descInputRef"
                v-model="templateState.embed.description"
                class="discord-textarea code-font"
                rows="6"
                placeholder="Description avec balises ({% for u in leaderboard %}...{% endfor %})"
              ></textarea>
            </div>

            <!-- Auteur & Vignette -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Nom de l'Auteur</label>
                <input
                  v-model="templateState.embed.author.name"
                  type="text"
                  class="discord-input"
                  placeholder="ex: {{ guild.name }}"
                />
              </div>
              <div class="form-group">
                <label class="form-label">URL Vignette (Thumbnail)</label>
                <input
                  v-model="templateState.embed.thumbnail"
                  type="text"
                  class="discord-input"
                  placeholder="ex: {{ user.avatarUrl }}"
                />
              </div>
            </div>

            <!-- Image Grande & Footer -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">URL Grande Image</label>
                <input
                  v-model="templateState.embed.image"
                  type="text"
                  class="discord-input"
                  placeholder="https://..."
                />
              </div>
              <div class="form-group">
                <label class="form-label">Texte du Pied de page (Footer)</label>
                <input
                  v-model="templateState.embed.footer.text"
                  type="text"
                  class="discord-input"
                  placeholder="ex: Mis à jour le {{ now | date('DD/MM/YYYY') }}"
                />
              </div>
            </div>

            <!-- Champs (Fields) de l'Embed -->
            <div class="fields-manager">
              <div class="fields-header">
                <span class="form-label" style="margin: 0;">Champs de l'Embed (Fields) :</span>
                <button class="action-btn small" @click="addField">➕ Ajouter un champ</button>
              </div>

              <div v-if="templateState.embed.fields.length === 0" class="empty-fields-hint">
                Aucun champ supplémentaire. Cliquez sur "Ajouter un champ" pour en insérer.
              </div>

              <div v-for="(f, fIdx) in templateState.embed.fields" :key="fIdx" class="field-item-row">
                <div class="field-inputs">
                  <input
                    v-model="f.name"
                    type="text"
                    class="discord-input field-name-input"
                    placeholder="Nom du champ (ex: Rang)"
                  />
                  <input
                    v-model="f.value"
                    type="text"
                    class="discord-input field-value-input"
                    placeholder="Valeur (ex: #{{ rank }})"
                  />
                  <label class="inline-checkbox">
                    <input v-model="f.inline" type="checkbox" />
                    <span>Inline</span>
                  </label>
                </div>
                <button class="action-btn danger small" title="Supprimer ce champ" @click="removeField(fIdx)">
                  ✕
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- MODE 2 : ÉDITEUR JSON BRUT DU TEMPLATE -->
        <div v-show="editorMode === 'json'" class="form-container">
          <div class="form-group">
            <div class="label-with-badge">
              <label class="form-label">Configuration JSON du Template</label>
              <button class="action-btn small" @click="formatTemplateJson">✨ Formater JSON</button>
            </div>
            <textarea
              v-model="rawTemplateJson"
              class="discord-textarea code-font json-editor-area"
              rows="16"
              @input="onRawJsonInput"
            ></textarea>
            <div v-if="jsonError" class="json-error-alert">
              ⚠️ Erreur JSON : {{ jsonError }}
            </div>
          </div>
        </div>

        <!-- MODE 3 : ÉDITEUR DE CONTEXTE JSON (DONNÉES DE TEST) -->
        <div v-show="editorMode === 'context'" class="form-container">
          <div class="form-group">
            <div class="label-with-badge">
              <label class="form-label">Variables & Données de Test (Contexte)</label>
              <button class="action-btn small" @click="formatContextJson">✨ Formater JSON</button>
            </div>
            <p class="form-help">
              Ces variables sont injectées dans les balises <code>&#123;&#123; variable &#125;&#125;</code> et boucles du template.
            </p>
            <textarea
              v-model="rawContextJson"
              class="discord-textarea code-font json-editor-area"
              rows="16"
              @input="onRawContextInput"
            ></textarea>
            <div v-if="contextJsonError" class="json-error-alert">
              ⚠️ Erreur JSON Données : {{ contextJsonError }}
            </div>
          </div>
        </div>

      </div>

      <!-- =================================================================== -->
      <!-- COLONNE DROITE : PRÉVISUALISATION EN DIRECT DISCORD & PAYLOAD       -->
      <!-- =================================================================== -->
      <div class="preview-pane config-card">
        
        <div class="preview-tabs">
          <button
            :class="['preview-tab-btn', { active: previewTab === 'visual' }]"
            @click="previewTab = 'visual'"
          >
            💬 Rendu Discord en Direct
          </button>
          <button
            :class="['preview-tab-btn', { active: previewTab === 'payload' }]"
            @click="previewTab = 'payload'"
          >
            📦 Payload Compilé ({ content, embeds })
          </button>
        </div>

        <!-- Rendu Visuel Discord -->
        <div v-show="previewTab === 'visual'" class="discord-preview-container">
          
          <div class="mock-discord-chat">
            <!-- Message de simulation -->
            <DiscordMessage
              :message="mockDiscordMessagePayload"
              :is-grouped="false"
            />
          </div>

          <!-- Barre de diagnostic -->
          <div class="preview-diagnostics">
            <div class="diag-item">
              <span class="diag-dot active"></span>
              <span>Rendu réactif temps réel</span>
            </div>
            <div v-if="compiledMessage.embeds.length > 0" class="diag-item">
              <span>Embeds: <strong>{{ compiledMessage.embeds.length }}</strong></span>
            </div>
            <div v-if="compiledMessage.content" class="diag-item">
              <span>Caractères texte: <strong>{{ compiledMessage.content.length }}</strong></span>
            </div>
          </div>

        </div>

        <!-- Rendu Payload JSON -->
        <div v-show="previewTab === 'payload'" class="payload-container">
          <div class="payload-header">
            <span class="form-label">Objet JSON prêt à être envoyé par le bot (discord.js) :</span>
            <button class="action-btn small" @click="copyCompiledPayload">📋 Copier</button>
          </div>
          <pre class="payload-json-box"><code>{{ JSON.stringify(compiledMessage, null, 2) }}</code></pre>
        </div>

      </div>

    </div>

    <!-- Notification Toast -->
    <div v-if="toastMessage" class="toast-notification">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useDiscordTemplateEngine, type DiscordMessageTemplate } from '~/composables/useDiscordTemplateEngine.ts';
import DiscordMessage from '~/components/common/DiscordMessage.vue';

const { renderDiscordMessage } = useDiscordTemplateEngine();

const editorMode = ref<'embed' | 'json' | 'context'>('embed');
const previewTab = ref<'visual' | 'payload'>('visual');
const selectedPresetId = ref('leaderboard');
const presets = ref<any[]>([]);
const toastMessage = ref('');

const contentInputRef = ref<HTMLTextAreaElement | null>(null);
const descInputRef = ref<HTMLTextAreaElement | null>(null);

// État réactif du template
const templateState = reactive({
  content: '',
  embed: {
    title: '',
    url: '',
    description: '',
    color: '#5865F2',
    thumbnail: '',
    image: '',
    author: {
      name: '',
      icon_url: '',
      url: ''
    },
    footer: {
      text: '',
      icon_url: ''
    },
    fields: [] as Array<{ name: string; value: string; inline?: boolean }>
  }
});

const colorPickerValue = ref('#5865F2');

// Contexte JSON (Données de test)
const contextData = ref<any>({});
const rawTemplateJson = ref('');
const rawContextJson = ref('');
const jsonError = ref('');
const contextJsonError = ref('');

// Synchronisation couleur picker
function onColorPickerChange(e: Event) {
  const target = e.target as HTMLInputElement;
  templateState.embed.color = target.value.toUpperCase();
}

watch(() => templateState.embed.color, (newColor) => {
  if (newColor && /^#[0-9A-Fa-f]{6}$/.test(newColor)) {
    colorPickerValue.value = newColor;
  }
});

// Compilation réactive en direct
const compiledMessage = computed(() => {
  try {
    const tpl: DiscordMessageTemplate = {
      content: templateState.content,
      embed: {
        title: templateState.embed.title,
        url: templateState.embed.url,
        description: templateState.embed.description,
        color: templateState.embed.color,
        thumbnail: templateState.embed.thumbnail ? { url: templateState.embed.thumbnail } : undefined,
        image: templateState.embed.image ? { url: templateState.embed.image } : undefined,
        author: templateState.embed.author.name ? templateState.embed.author : undefined,
        footer: templateState.embed.footer.text ? templateState.embed.footer : undefined,
        fields: templateState.embed.fields.filter(f => f.name && f.value)
      }
    };

    return renderDiscordMessage(tpl, contextData.value);
  } catch (err: any) {
    return {
      content: `⚠️ Erreur de compilation : ${err.message}`,
      embeds: []
    };
  }
});

// Formatage mock pour le composant DiscordMessage
const mockDiscordMessagePayload = computed(() => {
  return {
    id: 'mock_preview_msg',
    author: {
      id: 'bot_id',
      username: 'bot',
      displayName: 'bot',
      avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
      bot: true
    },
    content: compiledMessage.value.content,
    embeds: compiledMessage.value.embeds,
    createdTimestamp: Date.now()
  };
});

// Chargement des presets
async function fetchPresets() {
  try {
    const res = await fetch('/api/template/presets');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        presets.value = json.data;
        loadSelectedPreset();
      }
    }
  } catch (e) {
    console.warn('Impossible de charger les préréglages de template:', e);
  }
}

function loadSelectedPreset() {
  const preset = presets.value.find(p => p.id === selectedPresetId.value);
  if (!preset) return;

  const tpl = preset.template || {};
  const emb = tpl.embed || {};

  templateState.content = tpl.content || '';
  templateState.embed.title = emb.title || '';
  templateState.embed.url = emb.url || '';
  templateState.embed.description = emb.description || '';
  templateState.embed.color = emb.color || '#5865F2';
  templateState.embed.thumbnail = typeof emb.thumbnail === 'string' ? emb.thumbnail : (emb.thumbnail?.url || '');
  templateState.embed.image = typeof emb.image === 'string' ? emb.image : (emb.image?.url || '');
  templateState.embed.author = {
    name: emb.author?.name || '',
    icon_url: emb.author?.icon_url || emb.author?.iconUrl || '',
    url: emb.author?.url || ''
  };
  templateState.embed.footer = {
    text: emb.footer?.text || '',
    icon_url: emb.footer?.icon_url || emb.footer?.iconUrl || ''
  };
  templateState.embed.fields = Array.isArray(emb.fields) ? JSON.parse(JSON.stringify(emb.fields)) : [];

  contextData.value = JSON.parse(JSON.stringify(preset.context || {}));
  syncRawJsonFromState();
  syncRawContextJson();
}

function resetToCurrentPreset() {
  loadSelectedPreset();
  showToast('Modèle réinitialisé !');
}

function syncRawJsonFromState() {
  const fullTpl = {
    content: templateState.content,
    embed: {
      ...templateState.embed
    }
  };
  rawTemplateJson.value = JSON.stringify(fullTpl, null, 2);
  jsonError.value = '';
}

function syncRawContextJson() {
  rawContextJson.value = JSON.stringify(contextData.value, null, 2);
  contextJsonError.value = '';
}

watch(templateState, () => {
  if (editorMode.value === 'embed') {
    syncRawJsonFromState();
  }
}, { deep: true });

function onRawJsonInput() {
  try {
    const parsed = JSON.parse(rawTemplateJson.value);
    jsonError.value = '';
    templateState.content = parsed.content || '';
    if (parsed.embed) {
      templateState.embed.title = parsed.embed.title || '';
      templateState.embed.url = parsed.embed.url || '';
      templateState.embed.description = parsed.embed.description || '';
      templateState.embed.color = parsed.embed.color || '#5865F2';
      templateState.embed.thumbnail = parsed.embed.thumbnail || '';
      templateState.embed.image = parsed.embed.image || '';
      templateState.embed.author = parsed.embed.author || { name: '', icon_url: '', url: '' };
      templateState.embed.footer = parsed.embed.footer || { text: '', icon_url: '' };
      templateState.embed.fields = parsed.embed.fields || [];
    }
  } catch (err: any) {
    jsonError.value = err.message;
  }
}

function onRawContextInput() {
  try {
    contextData.value = JSON.parse(rawContextJson.value);
    contextJsonError.value = '';
  } catch (err: any) {
    contextJsonError.value = err.message;
  }
}

function formatTemplateJson() {
  syncRawJsonFromState();
  showToast('JSON du template formaté !');
}

function formatContextJson() {
  syncRawContextJson();
  showToast('JSON des données formaté !');
}

function addField() {
  templateState.embed.fields.push({
    name: 'Nouveau Champ',
    value: 'Valeur du champ {{ count }}',
    inline: true
  });
}

function removeField(idx: number) {
  templateState.embed.fields.splice(idx, 1);
}

function insertTag(tag: string) {
  if (editorMode.value === 'embed') {
    // Insérer dans la description par défaut
    templateState.embed.description += (templateState.embed.description ? ' ' : '') + tag;
  } else if (editorMode.value === 'json') {
    rawTemplateJson.value += tag;
    onRawJsonInput();
  }
  showToast(`Balise insérée : ${tag}`);
}

function insertLoopSnippet() {
  const snippet = '\n{% for item in leaderboard %}\n#{{ loop.index }} {{ item.name }} — {{ item.score }} pts\n{% endfor %}\n';
  insertTag(snippet);
}

function insertIfSnippet() {
  const snippet = '\n{% if user.isVip %}⭐ Membre VIP{% else %}👤 Membre Standard{% endif %}\n';
  insertTag(snippet);
}

function copyTemplate() {
  navigator.clipboard.writeText(rawTemplateJson.value);
  showToast('Template copié dans le presse-papiers !');
}

function copyCompiledPayload() {
  navigator.clipboard.writeText(JSON.stringify(compiledMessage.value, null, 2));
  showToast('Payload JSON compilé copié !');
}

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 2500);
}

onMounted(() => {
  fetchPresets();
});
</script>

<style scoped>
.template-editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
}

.template-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--header-primary);
}

.preset-select {
  min-width: 280px;
}

.template-main-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1024px) {
  .template-main-grid {
    grid-template-columns: 1fr;
  }
}

.editor-pane,
.preview-pane {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.editor-tabs,
.preview-tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 8px;
}

.editor-tab-btn,
.preview-tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.editor-tab-btn:hover,
.preview-tab-btn:hover {
  color: var(--header-primary);
  background-color: rgba(255, 255, 255, 0.05);
}

.editor-tab-btn.active,
.preview-tab-btn.active {
  color: #ffffff;
  background-color: var(--brand, #5865f2);
}

.quick-tags-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: var(--bg-tertiary);
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.quick-tags-title {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.quick-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quick-tag-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--header-primary);
  font-family: var(--font-code);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-tag-btn:hover {
  background-color: var(--brand, #5865f2);
  border-color: var(--brand, #5865f2);
  color: #fff;
}

.quick-tag-btn.highlight {
  border-color: rgba(241, 196, 15, 0.4);
  color: #f1c40f;
}

.quick-tag-btn.highlight:hover {
  background-color: #f1c40f;
  color: #000;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.char-counter {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-code);
}

.char-counter.danger {
  color: var(--red, #f23f43);
  font-weight: 700;
}

.embed-builder-box {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.embed-builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.embed-header-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--header-primary);
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-text-input {
  width: 90px;
  font-family: var(--font-code);
  font-size: 12px;
  padding: 4px 8px;
  text-transform: uppercase;
}

.color-picker-bubble {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .form-row-2 {
    grid-template-columns: 1fr;
  }
}

.code-font {
  font-family: var(--font-code);
  font-size: 12.5px;
  line-height: 1.45;
}

.json-editor-area {
  min-height: 320px;
  resize: vertical;
}

.json-error-alert {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(242, 63, 67, 0.15);
  border: 1px solid rgba(242, 63, 67, 0.3);
  color: var(--red, #f23f43);
  font-size: 12px;
}

.fields-manager {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-fields-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  padding: 6px 0;
}

.field-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
  align-items: center;
}

.field-name-input {
  flex: 1;
}

.field-value-input {
  flex: 2;
}

.inline-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-normal);
  cursor: pointer;
}

/* Discord Chat Preview */
.discord-preview-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock-discord-chat {
  background-color: #313338;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 16px;
  min-height: 200px;
}

.preview-diagnostics {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: var(--bg-tertiary);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.diag-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.diag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--green, #23a55a);
}

.payload-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payload-json-box {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px;
  max-height: 480px;
  overflow-y: auto;
  font-family: var(--font-code);
  font-size: 12px;
  color: #58d68d;
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: #23a55a;
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
