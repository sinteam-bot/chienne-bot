<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Bannière Stats -->
    <div class="module-stats-banner">
      <div class="module-stat-card">
        <div class="module-stat-icon">🎭</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Statut du Module</span>
          <span class="module-stat-value" :style="{ color: config?.enabled ? 'var(--green)' : 'var(--red)' }">
            {{ config?.enabled ? 'Activé' : 'Désactivé' }}
          </span>
          <span class="module-stat-sub">Attribution auto de rôles via réactions</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">📊</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Rôles configurés</span>
          <span class="module-stat-value">{{ totalRoles }}</span>
          <span class="module-stat-sub">sur ce serveur</span>
        </div>
      </div>

      <div class="module-stat-card">
        <div class="module-stat-icon">🎯</div>
        <div class="module-stat-info">
          <span class="module-stat-label">Auto-assignation</span>
          <span class="module-stat-value">
            {{ config?.self_assignable ? '✅' : '🔒' }}
          </span>
          <span class="module-stat-sub">
            {{ config?.self_assignable ? 'Tous les membres' : 'Staff uniquement' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Guide -->
    <div class="config-card">
      <div class="card-subtitle">📖 Comment ça marche</div>
      <p style="color: var(--text-muted); font-size: 13px; line-height: 1.6; margin: 8px 0 16px;">
        Les rôles à réaction permettent d'attribuer ou de retirer un rôle Discord
        automatiquement lorsqu'un membre ajoute ou retire une réaction spécifique sur un message.
        Idéal pour les <strong>salons de rôles</strong>, <strong>sondages</strong> ou <strong>self-roles</strong>.
      </p>
      <ol style="color: var(--text-muted); font-size: 13px; line-height: 1.7; margin: 0 0 16px 20px;">
        <li>Postez un message dans n'importe quel salon (épinglez-le si besoin)</li>
        <li>Utilisez <code>/reactionrole-add</code> pour lier un emoji à un rôle sur ce message</li>
        <li>Le bot ajoute automatiquement la réaction sur le message</li>
        <li>Les membres cliquent sur la réaction → ils obtiennent le rôle</li>
        <li>Ils recliquent → ils perdent le rôle</li>
      </ol>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <NuxtLink to="/modules/reaction-roles/roles" class="module-btn">
          <span>🎭</span> Voir les rôles configurés
        </NuxtLink>
        <NuxtLink to="/modules/reaction-roles/config" class="module-btn">
          <span>⚙️</span> Configuration
        </NuxtLink>
      </div>
    </div>

    <!-- Derniers rôles ajoutés -->
    <div class="config-card" v-if="recent.length > 0">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🆕 Derniers rôles ajoutés</span>
        <NuxtLink to="/modules/reaction-roles/roles" class="module-btn" style="font-size: 12px; padding: 4px 10px; text-decoration: none;">
          Voir tout →
        </NuxtLink>
      </div>
      <div v-for="r in recent" :key="r.id" style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
        <span style="font-size: 20px;">{{ r.emoji }}</span>
        <div style="flex: 1;">
          <div style="font-size: 13px; color: var(--text-normal);">
            → Rôle <code style="background: var(--background-secondary); padding: 1px 6px; border-radius: 3px;">{{ r.roleId }}</code>
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">
            Salon <code>{{ r.channelId }}</code> · Message <code>{{ r.messageId.slice(0, 16) }}…</code>
            <span v-if="r.description"> · {{ r.description }}</span>
          </div>
        </div>
        <button class="module-btn module-btn-sm" @click="deleteRr(r.id)" style="background: rgba(237, 66, 69, 0.15); color: #ed4245;">
          🗑️
        </button>
      </div>
    </div>

    <div v-if="!loading && recent.length === 0" class="config-card" style="text-align: center; color: var(--text-muted);">
      <div style="font-size: 48px; margin-bottom: 12px;">🎭</div>
      <p>Aucun rôle à réaction configuré pour le moment.</p>
      <p style="font-size: 12px;">Utilisez <code>/reactionrole-add</code> dans Discord pour en créer un.</p>
    </div>

    <div v-if="error" class="config-card" style="color: var(--red);">
      ❌ {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useReactionRoles, type ReactionRole } from '~/composables/useReactionRoles';
import { useFeatures } from '~/composables/useFeatures';

const rr = useReactionRoles();
const features = useFeatures();
const config = ref<any>(null);
const allRoles = ref<ReactionRole[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const totalRoles = computed(() => allRoles.value.length);
const recent = computed(() => allRoles.value.slice(0, 5));

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [state, list] = await Promise.all([
      features.get('reaction-roles'),
      rr.list({ limit: 200 })
    ]);
    config.value = state?.state?.config || state?.config || null;
    if (config.value && !config.value.enabled) {
      config.value = { ...config.value, enabled: false };
    }
    allRoles.value = list || [];
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

async function deleteRr(id: string) {
  if (!confirm('Supprimer ce réaction-rôle ?')) return;
  try {
    await rr.remove(id);
    allRoles.value = allRoles.value.filter(r => r.id !== id);
  } catch (e: any) {
    error.value = e.message;
  }
}

onMounted(load);
</script>

<style scoped>
.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  text-decoration: none;
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:hover { background: var(--brand-experiment, #5865f2); color: white; }
.module-btn-sm { padding: 4px 8px; font-size: 12px; }
</style>
