<template>
  <div class="view-panel">
    <div class="config-layout">
      <!-- Navigation latérale des onglets de configuration -->
      <nav class="config-sidebar" aria-label="Paramètres">
        <div class="config-nav-header">Configuration du Bot</div>
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['config-nav-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Contenu des onglets -->
      <main class="config-content-scroll">
        <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
          <div class="spinner" style="width: 32px; height: 32px;"></div>
        </div>

        <div v-else-if="config">
          <!-- 1. Onglet Bienvenue -->
          <div v-if="activeTab === 'welcome'" class="config-tab-panel">
            <div class="config-header">
              <h3>👋 Message de Bienvenue & Présentation</h3>
              <p class="config-desc">Personnalisez le salon, le message d'accueil et le canal de présentation des nouveaux arrivants.</p>
            </div>

            <div class="config-card">
              <div class="form-group-toggle">
                <div class="toggle-info">
                  <span class="form-label">Activer le module de bienvenue</span>
                  <p class="form-help">Envoie un message lorsqu'un membre rejoint le serveur.</p>
                </div>
                <label class="switch">
                  <input v-model="config.welcome.enabled" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-divider"></div>

              <div class="form-row">
                <div class="col-half">
                  <label class="form-label">ID Salon de Bienvenue</label>
                  <input v-model="config.welcome.welcome_channel_id" type="text" class="discord-input" placeholder="ID salon ou null pour salon système" />
                </div>
                <div class="col-half">
                  <label class="form-label">ID Salon de Présentation</label>
                  <input v-model="config.welcome.presentation_channel_id" type="text" class="discord-input" placeholder="ID salon présentation" />
                </div>
              </div>

              <div>
                <label class="form-label">Titre de l'Embed</label>
                <input v-model="config.welcome.embed.title" type="text" class="discord-input" />
              </div>

              <div>
                <label class="form-label">Description de l'Embed (placeholders: {username}, {server})</label>
                <textarea v-model="config.welcome.embed.description" class="discord-textarea" rows="3"></textarea>
              </div>

              <div class="form-row">
                <div class="col-half">
                  <label class="form-label">Couleur de l'Embed</label>
                  <div class="color-picker-row">
                    <input v-model="config.welcome.embed.color" type="color" />
                    <input v-model="config.welcome.embed.color" type="text" class="discord-input" />
                  </div>
                </div>
              </div>

              <div class="config-actions-bar">
                <button class="btn-primary" :disabled="isSaving" @click="saveModule('welcome', config.welcome)">
                  {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Bienvenue' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 2. Onglet Captcha -->
          <div v-if="activeTab === 'captcha'" class="config-tab-panel">
            <div class="config-header">
              <h3>🔒 Vérification Captcha Mathématique</h3>
              <p class="config-desc">Empêchez les robots d'accéder au serveur grâce au captcha automatique.</p>
            </div>

            <div class="config-card">
              <div class="form-group-toggle">
                <div class="toggle-info">
                  <span class="form-label">Activer le Captcha</span>
                  <p class="form-help">Crée un salon de vérification temporaire à l'arrivée d'un membre.</p>
                </div>
                <label class="switch">
                  <input v-model="config.captcha.enabled" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-divider"></div>

              <div class="form-row">
                <div class="col-half">
                  <label class="form-label">ID Rôle Vérifié</label>
                  <input v-model="config.captcha.verified_role_id" type="text" class="discord-input" placeholder="ID rôle à attribuer" />
                </div>
                <div class="col-half">
                  <label class="form-label">Nom du salon temporaire</label>
                  <input v-model="config.captcha.captcha_channel_name" type="text" class="discord-input" />
                </div>
              </div>

              <div class="form-row">
                <div class="col-half">
                  <label class="form-label">Temps limite (minutes)</label>
                  <input v-model.number="config.captcha.captcha_timeout" type="number" class="discord-input" />
                </div>
                <div class="col-half">
                  <label class="form-label">Max Tentatives</label>
                  <input v-model.number="config.captcha.max_attempts" type="number" class="discord-input" />
                </div>
              </div>

              <div class="config-actions-bar">
                <button class="btn-primary" :disabled="isSaving" @click="saveModule('captcha', config.captcha)">
                  {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Captcha' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 3. Onglet Pensée du Jour IA -->
          <div v-if="activeTab === 'daily'" class="config-tab-panel">
            <div class="config-header">
              <h3>🌅 Pensée du Jour & Génération IA</h3>
              <p class="config-desc">Configuration des modèles OpenAI / OpenRouter et du salon de publication.</p>
            </div>

            <div class="config-card">
              <div class="form-group-toggle">
                <div class="toggle-info">
                  <span class="form-label">Module Pensée du Jour Actif</span>
                  <p class="form-help">Pré-rendu et publication quotidienne du message.</p>
                </div>
                <label class="switch">
                  <input v-model="config.daily_message.enabled" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-divider"></div>

              <div>
                <label class="form-label">ID Salon de Publication</label>
                <input v-model="config.daily_message.channel_id" type="text" class="discord-input" placeholder="ID salon Discord" />
              </div>

              <div>
                <label class="form-label">ID Rôle à mentionner (optionnel)</label>
                <input v-model="config.daily_message.role_mention_id" type="text" class="discord-input" placeholder="ID rôle mentionné" />
              </div>

              <div class="config-actions-bar">
                <button class="btn-primary" :disabled="isSaving" @click="saveModule('daily_message', config.daily_message)">
                  {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Pensée du Jour' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 4. Onglet Protection Web & API -->
          <div v-if="activeTab === 'web'" class="config-tab-panel">
            <div class="config-header">
              <h3>🛡️ Protection Web & Authentification API</h3>
              <p class="config-desc">Sécurisez l'accès au tableau de bord et à l'API REST par clé d'authentification.</p>
            </div>

            <div class="config-card">
              <div class="form-group-toggle">
                <div class="toggle-info">
                  <span class="form-label">Activer l'Authentification API</span>
                  <p class="form-help">Rejette les requêtes /api non autorisées sans clé d'API valide.</p>
                </div>
                <label class="switch">
                  <input v-model="config.web.auth.enabled" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-divider"></div>

              <div>
                <label class="form-label">Clé Secrète / Mot de Passe API</label>
                <input v-model="config.web.auth.api_key" type="text" class="discord-input" />
                <span class="form-help">Cette clé doit être fournie dans le header `x-api-key` ou lors du déverrouillage de l'interface.</span>
              </div>

              <div class="form-group-toggle" style="margin-top: 10px;">
                <div class="toggle-info">
                  <span class="form-label">Protéger également les pages statiques</span>
                  <p class="form-help">Si activé, affiche une page 401 pour tout visiteur sans clé.</p>
                </div>
                <label class="switch">
                  <input v-model="config.web.auth.protect_static" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="config-actions-bar">
                <button class="btn-primary" :disabled="isSaving" @click="saveModule('web', config.web)">
                  {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Sécurité Web' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 5. Onglet Planificateur & Scheduler -->
          <div v-if="activeTab === 'scheduler'" class="config-tab-panel">
            <div class="config-header">
              <h3>⏰ Planificateur de Tâches (Scheduler / Crons)</h3>
              <p class="config-desc">Horaires et exécution automatique des tâches récurrentes du bot.</p>
            </div>

            <div class="config-card">
              <div class="form-group-toggle">
                <div class="toggle-info">
                  <span class="form-label">Activer le Planificateur</span>
                  <p class="form-help">Contrôle global de toutes les tâches planifiées.</p>
                </div>
                <label class="switch">
                  <input v-model="config.scheduler.enabled" type="checkbox" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-divider"></div>

              <div>
                <label class="form-label">Fuseau Horaire</label>
                <input v-model="config.scheduler.timezone" type="text" class="discord-input" />
              </div>

              <div v-if="config.scheduler.tasks" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
                <div class="card-subtitle">Tâches Planifiées</div>

                <div v-for="(task, key) in config.scheduler.tasks" :key="key" style="background-color: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <strong style="text-transform: capitalize;">{{ String(key).replace('_', ' ') }}</strong>
                    <label class="switch">
                      <input v-model="task.enabled" type="checkbox" />
                      <span class="slider"></span>
                    </label>
                  </div>
                  <div style="margin-top: 8px;">
                    <label class="form-label" style="font-size: 11px;">Expression Cron :</label>
                    <input v-model="task.cron" type="text" class="discord-input" style="font-family: var(--font-code);" />
                  </div>
                </div>
              </div>

              <div class="config-actions-bar">
                <button class="btn-primary" :disabled="isSaving" @click="saveModule('scheduler', config.scheduler)">
                  {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Planificateur' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const tabs = [
  { id: 'welcome', label: 'Bienvenue & Accueil', icon: '👋' },
  { id: 'captcha', label: 'Captcha & Sécurité', icon: '🔒' },
  { id: 'daily', label: 'Pensée du Jour IA', icon: '🌅' },
  { id: 'web', label: 'Protection Web & API', icon: '🛡️' },
  { id: 'scheduler', label: 'Planificateur / Crons', icon: '⏰' }
];

const activeTab = ref('welcome');
const config = ref<any>(null);
const isLoading = ref(true);
const isSaving = ref(false);

onMounted(() => {
  loadConfig();
});

async function loadConfig() {
  isLoading.value = true;
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data) {
      config.value = {
        welcome: res.data.welcome || {},
        captcha: res.data.captcha || {},
        daily_message: res.data.daily_message || {},
        web: res.data.web || { auth: {} },
        scheduler: res.data.scheduler || { tasks: {} }
      };

      // Assurer structures
      config.value.welcome.embed = config.value.welcome.embed || {};
      config.value.web.auth = config.value.web.auth || {};
    }
  } catch (err: any) {
    console.error('Erreur chargement configuration:', err);
    showToast('Erreur de chargement de la configuration', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function saveModule(moduleName: string, moduleData: any) {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message: string }>('/api/config', {
      method: 'POST',
      body: JSON.stringify({
        module: moduleName,
        config: moduleData
      })
    });

    if (res.success) {
      showToast(res.message || `Module ${moduleName} enregistré !`, 'success');
    }
  } catch (err: any) {
    showToast(`Erreur d'enregistrement: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
