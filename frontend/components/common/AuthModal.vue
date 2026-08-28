<template>
  <div v-if="isAuthModalOpen" class="modal-backdrop" @click.self="closeAuthModal">
    <div class="modal-card" style="max-width: 440px;">
      <div class="modal-header">
        <div class="modal-banner" style="background: linear-gradient(135deg, #5865F2, #7289da);"></div>
        <button class="modal-close-btn" title="Fermer" @click="closeAuthModal">✕</button>
      </div>

      <div class="modal-body" style="padding-top: 20px;">
        <div class="modal-user-names" style="text-align: center;">
          <h3 style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 20px;">
            🔒 Authentification Dashboard
          </h3>
          <span class="modal-user-tag" style="margin-top: 6px; font-size: 13px;">
            Connectez-vous avec votre compte Discord pour accéder aux fonctionnalités selon votre rôle (Admin, Modérateur, Membre).
          </span>
        </div>

        <!-- 1. Bouton Principal : Connexion avec Discord -->
        <div style="margin-top: 20px;">
          <button
            type="button"
            class="btn-discord-oauth"
            style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 16px; background-color: #5865F2; color: #ffffff; border: none; border-radius: 4px; font-weight: 600; font-size: 15px; cursor: pointer; transition: background-color 0.2s;"
            @click="loginWithDiscord"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Se connecter avec Discord</span>
          </button>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; margin: 18px 0; color: var(--text-muted); font-size: 12px;">
          <div style="flex: 1; height: 1px; background: var(--background-modifier-accent);"></div>
          <span>OU VIA CLÉ API (SYSTÈME)</span>
          <div style="flex: 1; height: 1px; background: var(--background-modifier-accent);"></div>
        </div>

        <!-- 2. Formulaire Clé API Fallback -->
        <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label class="form-label" for="api-key-input">Clé API Administrateur</label>
            <input
              id="api-key-input"
              v-model="inputKey"
              type="password"
              class="discord-input"
              placeholder="Entrez votre clé API..."
              autocomplete="current-password"
              style="padding: 10px 12px; font-size: 14px;"
            />
            <span v-if="errorMessage" style="color: var(--red); font-size: 12px; margin-top: 6px; display: block;">
              {{ errorMessage }}
            </span>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
            <button type="button" class="btn-secondary" @click="closeAuthModal">
              Fermer
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting || !inputKey.trim()">
              <span v-if="isSubmitting">Vérification...</span>
              <span v-else>Valider la clé</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth.ts';
import { useToast } from '~/composables/useToast.ts';

const { isAuthModalOpen, closeAuthModal, getApiKey, verifyKey, loginWithDiscord } = useAuth();
const { showToast } = useToast();

const inputKey = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

onMounted(() => {
  inputKey.value = getApiKey();
});

watch(isAuthModalOpen, (open) => {
  if (open) {
    inputKey.value = getApiKey();
    errorMessage.value = '';
  }
});

async function handleSubmit() {
  if (!inputKey.value.trim()) return;
  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const valid = await verifyKey(inputKey.value.trim());
    if (valid) {
      showToast('Authentification réussie !', 'success');
      closeAuthModal();
    } else {
      errorMessage.value = 'Clé API incorrecte ou rejetée par le serveur.';
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Erreur lors de la vérification.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.btn-discord-oauth:hover {
  background-color: #4752c4 !important;
}
</style>
