<template>
  <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
    <div class="spinner" style="width: 32px; height: 32px;"></div>
  </div>

  <div v-else-if="config" style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Protection Web & API -->
    <div class="config-card">
      <div class="card-subtitle">🛡️ Protection Web & Authentification API</div>
      <p class="config-desc">
        Sécurisez le dashboard web et les routes API du bot avec authentification par clé secrète.
      </p>

      <div class="form-group-toggle">
        <div class="toggle-info">
          <span class="form-label">Activer l'Authentification API</span>
          <p class="form-help">Rejette les requêtes non autorisées sans clé valide dans le header <code>x-api-key</code>.</p>
        </div>
        <label class="switch">
          <input v-model="config.web.auth.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider"></div>

      <div>
        <label class="form-label">Clé Secrète / Mot de Passe API</label>
        <input v-model="config.web.auth.api_key" type="password" class="discord-input" placeholder="Clé API secrète..." />
      </div>

      <div class="form-group-toggle" style="margin-top: 14px;">
        <div class="toggle-info">
          <span class="form-label">Protéger également les pages HTML statiques</span>
          <p class="form-help">Affiche une page 401 pour tout visiteur non authentifié sans session active.</p>
        </div>
        <label class="switch">
          <input v-model="config.web.auth.protect_static" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveSection('web', config.web)">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Sécurité Web' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';

definePageMeta({
  title: 'Sécurité API & Web',
  icon: '🛡️',
  description: 'Gestion de l\'authentification web et sécurité API',
  section: 'bot',
  hidden: true
});

useSeoMeta({
  title: 'Sécurité API & Web',
  description: 'Gestion de l\'authentification web et sécurité API',
  ogTitle: 'Sécurité API & Web - Chienne Bot',
  ogDescription: 'Gestion de l\'authentification web et sécurité API'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

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
        web: res.data.web || { auth: {} }
      };
      config.value.web.auth = config.value.web.auth || {};
    }
  } catch (err: any) {
    showToast('Erreur chargement: ' + err.message, 'error');
  } finally {
    isLoading.value = false;
  }
}

async function saveSection(sectionName: string, sectionData: any) {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: sectionName,
        config: sectionData
      }
    });
    if (res.success) {
      showToast('Paramètres de sécurité Web sauvegardés !', 'success');
    } else {
      showToast('Erreur de sauvegarde', 'error');
    }
  } catch (err: any) {
    showToast(`Erreur: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>
