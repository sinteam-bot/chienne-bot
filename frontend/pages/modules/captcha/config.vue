<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div class="card-subtitle">⚙️ Paramètres du Captcha Mathématique</div>
      <p class="config-desc">
        Configurez le comportement du salon temporaire, les rôles attribués et les règles arithmétiques.
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

      <div class="config-actions-bar" style="margin-top: 20px;">
        <button class="btn-primary" :disabled="isSaving" @click="saveModuleConfig">
          {{ isSaving ? 'Enregistrement...' : '💾 Sauvegarder Configuration Captcha' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import DiscordRoleSelect from '~/components/ui/DiscordRoleSelect.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();

const isSaving = ref(false);

const config = ref<any>({
  enabled: true,
  verified_role_id: '',
  captcha_channel_name: 'captcha-{username}',
  captcha_timeout: 10,
  max_attempts: 3
});

async function loadConfig() {
  try {
    const res = await apiFetch<{ success: boolean; data: any }>('/api/config');
    if (res.success && res.data?.security_question) {
      config.value = {
        ...config.value,
        ...res.data.security_question
      };
    }
  } catch (err) {
    console.error('Erreur chargement config captcha:', err);
  }
}

async function saveModuleConfig() {
  isSaving.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/config', {
      method: 'POST',
      body: {
        module: 'security_question',
        config: config.value
      }
    });
    if (res.success) {
      showToast('Configuration Captcha sauvegardée avec succès !', 'success');
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
