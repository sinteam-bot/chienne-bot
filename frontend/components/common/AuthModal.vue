<template>
  <div v-if="isAuthModalOpen" class="modal-backdrop" @click.self="closeAuthModal">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-banner" style="background: linear-gradient(135deg, #5865F2, #e91e63);"></div>
        <button class="modal-close-btn" title="Fermer" @click="closeAuthModal">✕</button>
      </div>

      <div class="modal-body" style="padding-top: 20px;">
        <div class="modal-user-names">
          <h3 style="display: flex; align-items: center; gap: 8px;">
            🔒 Accès Protégé
          </h3>
          <span class="modal-user-tag" style="margin-top: 4px;">
            Une clé d'authentification API est requise pour interagir avec le serveur.
          </span>
        </div>

        <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
          <div>
            <label class="form-label" for="api-key-input">Clé API / Mot de passe</label>
            <input
              id="api-key-input"
              v-model="inputKey"
              type="password"
              class="discord-input"
              placeholder="Entrez votre clé API..."
              required
              autocomplete="current-password"
              style="padding: 10px 12px; font-size: 14px;"
            />
            <span v-if="errorMessage" style="color: var(--red); font-size: 12px; margin-top: 6px; display: block;">
              {{ errorMessage }}
            </span>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px;">
            <button type="button" class="btn-secondary" @click="closeAuthModal">
              Annuler
            </button>
            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting">Vérification...</span>
              <span v-else>Valider & Déverrouiller</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth.ts';
import { useToast } from '~/composables/useToast.ts';

const { isAuthModalOpen, closeAuthModal, getApiKey, verifyKey } = useAuth();
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
      window.location.reload();
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
