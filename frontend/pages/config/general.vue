<template>
  <div v-if="isLoading" style="display: flex; justify-content: center; padding: 40px;">
    <div class="spinner" style="width: 32px; height: 32px;"></div>
  </div>

  <div v-else-if="config" style="display: flex; flex-direction: column; gap: 20px;">
    <!-- 1. Paramètres Discord Généraux -->
    <div class="config-card">
      <div class="card-subtitle">🤖 Identifiants & Couleur Discord</div>
      <p class="config-desc">
        Configurez les clés et identifiants principaux du bot Discord enregistrés dans <code>config.yml</code>.
      </p>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Client ID (Application ID)</label>
          <input v-model="config.discord.client_id" type="text" class="discord-input" placeholder="Ex: 1337543177086959657" />
        </div>
        <div class="col-half">
          <label class="form-label">Guild ID (Serveur Principal)</label>
          <input v-model="config.discord.guild_id" type="text" class="discord-input" placeholder="Ex: 1337543177086959657" />
        </div>
      </div>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Couleur par défaut du Bot (Embeds)</label>
          <div class="color-picker-row">
            <input v-model="config.discord.default_color" type="color" />
            <input v-model="config.discord.default_color" type="text" class="discord-input" style="font-family: var(--font-code);" />
          </div>
        </div>
      </div>

      <div class="config-actions-bar">
        <button class="btn-primary" :disabled="isSaving" @click="saveSection('discord', config.discord)">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Paramètres Discord' }}
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
  title: 'Configuration Discord',
  icon: '🤖',
  description: 'Paramètres généraux du bot Discord',
  section: 'bot',
  hidden: true
});

useSeoMeta({
  title: 'Configuration Discord',
  description: 'Paramètres généraux du bot Discord',
  ogTitle: 'Configuration Discord - Bot',
  ogDescription: 'Paramètres généraux du bot Discord'
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
        discord: res.data.discord || {}
      };
    }
  } catch (err: any) {
    showToast('Erreur chargement config: ' + err.message, 'error');
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
      showToast(`Section ${sectionName} sauvegardée dans config.yml !`, 'success');
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
