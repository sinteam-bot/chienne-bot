<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card">
      <div
        class="card-subtitle"
        style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;"
      >
        <span>⛔ Blacklist du Leaderboard</span>
        <button class="module-btn" @click="load" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>

      <p style="color: var(--text-muted); font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
        Les membres et rôles listés ici sont <strong>exclus du classement</strong> des invitations.
        La commande Discord <code>/invite blacklist add-member|add-role|remove @user|@role [reason]</code>
        permet de gérer cette liste depuis le serveur.
      </p>

      <div v-if="error" style="color: var(--red);">❌ {{ error }}</div>

      <div
        v-else-if="loading && blacklist.length === 0"
        style="color: var(--text-muted); text-align: center; padding: 32px;"
      >
        ⏳ Chargement…
      </div>

      <div
        v-else-if="blacklist.length === 0"
        style="color: var(--text-muted); text-align: center; padding: 32px; background: var(--background-secondary); border-radius: 6px;"
      >
        ✅ Aucun membre ou rôle blacklisté pour le moment.
      </div>

      <div v-else class="module-table-wrapper">
        <table class="module-table">
          <thead>
            <tr>
              <th style="width: 80px;">Type</th>
              <th>ID / Mention</th>
              <th>Raison</th>
              <th style="width: 160px;">Modérateur</th>
              <th style="width: 160px;">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in blacklist" :key="`${b.guildId}-${b.targetId}`">
              <td>
                <span
                  class="type-pill"
                  :class="b.targetType === 'role' ? 'type-pill-role' : 'type-pill-user'"
                >
                  {{ b.targetType === 'role' ? '🎭 Rôle' : '👤 Membre' }}
                </span>
              </td>
              <td>
                <code style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">
                  {{ b.targetId }}
                </code>
                <DiscordUser
                  v-if="b.targetType === 'user'"
                  :user-id="b.targetId"
                  :show-id="true"
                  style="margin-left: 8px;"
                />
              </td>
              <td>
                <span v-if="b.reason" style="font-size: 12px;">{{ b.reason }}</span>
                <span v-else style="color: var(--text-muted); font-style: italic; font-size: 12px;">
                  Pas de raison
                </span>
              </td>
              <td>
                <DiscordUser v-if="b.moderatorId" :user-id="b.moderatorId" :show-id="false" />
                <span v-else style="color: var(--text-muted); font-size: 12px;">—</span>
              </td>
              <td>
                <DiscordTime :value="b.createdAt" mode="relative" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useInvites } from '~/composables/useInvites';
import { useToast } from '~/composables/useToast';
import DiscordUser from '~/components/common/DiscordUser.vue';
import DiscordTime from '~/components/common/DiscordTime.vue';

definePageMeta({
  title: 'Blacklist des Invites',
  icon: '⛔',
  description: 'Membres et rôles exclus du classement',
  section: 'modules',
  hidden: true
});

useSeoMeta({
  title: 'Blacklist des Invites - Bot',
  description: 'Membres et rôles exclus du leaderboard des invitations',
  ogTitle: 'Blacklist des Invites - Bot'
});

const invites = useInvites();
const { showToast } = useToast();

const blacklist = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams(window.location.search);
    const guildId = params.get('guild_id') || '';
    if (!guildId) {
      error.value = 'Aucun serveur sélectionné.';
      blacklist.value = [];
      return;
    }
    const data = await invites.getBlacklist(guildId);
    blacklist.value = Array.isArray(data) ? data : [];
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
    showToast({ type: 'error', message: error.value });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.type-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.type-pill-user {
  background: rgba(88, 101, 242, 0.2);
  color: #5865f2;
  border: 1px solid rgba(88, 101, 242, 0.3);
}
.type-pill-role {
  background: rgba(235, 69, 158, 0.2);
  color: #eb459e;
  border: 1px solid rgba(235, 69, 158, 0.3);
}
.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:hover:not(:disabled) {
  background: var(--brand-experiment, #5865f2);
  color: white;
}
</style>
