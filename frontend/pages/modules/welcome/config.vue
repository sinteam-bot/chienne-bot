<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle">⚙️ Configuration du Message d'Accueil</div>
      <p class="config-desc">
        Personnalisez le salon d'envoi, les mentions et l'embed Discord envoyé à chaque nouveau membre.
      </p>

      <div class="config-item">
        <div class="config-label-group">
          <label class="config-label">Activer le module Bienvenue</label>
          <span class="config-hint">Envoie automatiquement un message lorsqu'un membre rejoint le serveur.</span>
        </div>
        <label class="switch">
          <input v-model="config.enabled" type="checkbox" />
          <span class="slider"></span>
        </label>
      </div>

      <div class="form-divider"></div>

      <div class="form-row">
        <div class="col-half">
          <label class="form-label">Salon de Bienvenue (Message Public)</label>
          <DiscordChannelSelect
            v-model="config.welcome_channel_id"
            :allow-null="true"
            null-label="— Salon Système Discord par défaut —"
            placeholder="Sélectionner le salon de bienvenue..."
            :filter-text-only="true"
          />
        </div>
        <div class="col-half">
          <label class="form-label">Salon de Présentation (Mentionné dans l'accueil)</label>
          <DiscordChannelSelect
            v-model="config.presentation_channel_id"
            :allow-null="true"
            null-label="— Aucun salon de présentation —"
            placeholder="Sélectionner le salon de présentation..."
            :filter-text-only="true"
          />
        </div>
      </div>

      <div style="margin-top: 14px;">
        <label class="form-label">Titre de l'Embed de Bienvenue</label>
        <input v-model="config.embed.title" type="text" class="discord-input" placeholder="Bienvenue sur le serveur !" />
      </div>

      <div style="margin-top: 14px;">
        <label class="form-label">Description de l'Embed (placeholders: {username}, {server}, {presentation})</label>
        <textarea v-model="config.embed.description" class="discord-textarea" rows="3"></textarea>
      </div>

      <div class="form-row" style="margin-top: 14px;">
        <div class="col-half">
          <label class="form-label">Couleur de l'Embed</label>
          <div class="color-picker-row">
            <input v-model="config.embed.color" type="color" />
            <input v-model="config.embed.color" type="text" class="discord-input" style="font-family: var(--font-code);" />
          </div>
        </div>
      </div>

      <div class="config-actions-bar" style="margin-top: 20px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Bienvenue' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordChannelSelect from '~/components/ui/DiscordChannelSelect.vue';

definePageMeta({
  title: 'Configuration',
  icon: '⚙️',
  description: 'Configuration des salons cibles et modèle d\'embed de bienvenue',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Configuration - Bienvenue',
  description: 'Configuration des salons cibles et modèle d\'embed de bienvenue',
  ogTitle: 'Configuration - Bienvenue',
  ogDescription: 'Configuration des salons cibles et modèle d\'embed de bienvenue'
});

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const isSaving = ref(false);

const config = ref<any>({
  enabled: true,
  welcome_channel_id: null,
  presentation_channel_id: null,
  embed: {
    title: 'Bienvenue sur le serveur !',
    description: 'Bienvenue {username} sur **{server}** !\n\nN\'hésite pas à te présenter dans le salon {presentation}.',
    color: '#5865F2'
  }
});

async function loadConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.welcome) {
      config.value = {
        ...config.value,
        ...res.data.welcome,
        embed: {
          ...config.value.embed,
          ...(res.data.welcome.embed || {})
        }
      };
    }
  } catch (err) {
    console.error('Erreur chargement config welcome:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: 'welcome',
        config: config.value
      }
    });
    if (res.success) {
      showToast('Configuration Bienvenue sauvegardée avec succès !', 'success');
    } else {
      showToast('Erreur de sauvegarde', 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>
