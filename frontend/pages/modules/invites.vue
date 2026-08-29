<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <div class="module-header" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
              <span>🎟️</span> Suivi des Invitations
            </h2>
            <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
              Tracker qui invite qui, leaderboard des inviteurs, détection des "fake invites" et blacklist.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span
              class="status-pill"
              :class="config?.enabled ? 'status-pill-on' : 'status-pill-off'"
              :title="config?.enabled ? 'Feature activée' : 'Feature désactivée'"
            >
              {{ config?.enabled ? '✅ Activé' : '💤 Désactivé' }}
            </span>
          </div>
        </div>

        <div
          class="module-tab-nav"
          style="margin-top: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px; flex-wrap: wrap;"
        >
          <NuxtLink
            to="/modules/invites/leaderboard"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/invites/leaderboard') }"
          >
            <span>🏆</span> Classement
          </NuxtLink>
          <NuxtLink
            to="/modules/invites/blacklist"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/invites/blacklist') }"
          >
            <span>⛔</span> Blacklist
          </NuxtLink>
          <NuxtLink
            to="/modules/invites/config"
            class="module-tab-btn"
            :class="{ active: isTabActive('/modules/invites/config') }"
          >
            <span>⚙️</span> Configuration
          </NuxtLink>
        </div>
      </div>

      <div v-if="!config && configLoading" class="config-card" style="text-align: center; color: var(--text-muted); padding: 32px;">
        ⏳ Chargement de la configuration du feature…
      </div>

      <div v-if="configError" class="config-card" style="text-align: center; color: var(--red); padding: 16px;">
        ❌ {{ configError }}
      </div>

      <NuxtPage v-show="config" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useInvites } from '~/composables/useInvites';

definePageMeta({
  title: 'Suivi des Invitations',
  icon: '🎟️',
  description: 'Tracker des invitations, leaderboard, fake detection et blacklist',
  section: 'modules',
  order: 20
});

useSeoMeta({
  title: 'Suivi des Invitations - Bot',
  description: 'Système de tracking des invitations avec détection de fake et blacklist (style InviteLogger)',
  ogTitle: 'Suivi des Invitations - Bot',
  ogDescription: 'Système de tracking des invitations avec détection de fake et blacklist'
});

const route = useRoute();
const invites = useInvites();

const config = ref<any>(null);
const configLoading = ref(false);
const configError = ref<string | null>(null);
const guildId = ref<string>('');

async function loadConfig() {
  configLoading.value = true;
  configError.value = null;
  try {
    guildId.value = await invites.getGuildId();
    if (!guildId.value) {
      configError.value = 'Aucun serveur détecté. Configurez discord.guild_id dans config.yml ou utilisez le sélecteur de guilde.';
      config.value = null;
      return;
    }
    config.value = await invites.getConfig(guildId.value);
  } catch (e: any) {
    configError.value = e.message || 'Erreur inconnue';
    console.warn('Impossible de charger la config invites:', e);
  } finally {
    configLoading.value = false;
  }
}

function isTabActive(path: string): boolean {
  if (path === '/modules/invites/leaderboard' && (route.path === '/modules/invites' || route.path === '/modules/invites/')) {
    return true;
  }
  return route.path.startsWith(path);
}

onMounted(loadConfig);
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill-on {
  background: rgba(87, 242, 135, 0.15);
  color: #57f287;
  border: 1px solid rgba(87, 242, 135, 0.3);
}
.status-pill-off {
  background: rgba(150, 155, 165, 0.15);
  color: #969ba5;
  border: 1px solid rgba(150, 155, 165, 0.3);
}
.module-tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.module-tab-btn:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}
.module-tab-btn.active {
  background: var(--brand-experiment, #5865f2);
  color: white;
  font-weight: 600;
}
</style>
