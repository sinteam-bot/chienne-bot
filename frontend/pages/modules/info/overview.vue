<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <div class="config-card" v-if="error">❌ {{ error }}</div>

    <!-- Section SERVEUR -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🏛️ Serveur</span>
        <button class="module-btn" @click="loadServer" :disabled="loadingServer">🔄 Rafraîchir</button>
      </div>
      <div v-if="loadingServer && !server" style="color: var(--text-muted); padding: 16px;">Chargement…</div>
      <div v-else-if="server" class="info-grid">
        <div class="info-avatar">
          <img v-if="server.iconURL" :src="server.iconURL" :alt="server.name" />
          <div v-else class="info-avatar-fallback">{{ (server.name || '?').charAt(0) }}</div>
        </div>
        <div class="info-fields">
          <div class="info-row"><span class="info-label">Nom</span><span class="info-value">{{ server.name }}</span></div>
          <div class="info-row"><span class="info-label">Membres</span><span class="info-value">{{ server.memberCount }}</span></div>
          <div class="info-row"><span class="info-label">Salons</span><span class="info-value">{{ server.channels }}</span></div>
          <div class="info-row"><span class="info-label">Rôles</span><span class="info-value">{{ server.roles }}</span></div>
          <div class="info-row"><span class="info-label">Emojis</span><span class="info-value">{{ server.emojis }}</span></div>
          <div class="info-row"><span class="info-label">Propriétaire</span><span class="info-value"><code>{{ server.ownerId }}</code></span></div>
          <div class="info-row" v-if="server.createdAt"><span class="info-label">Créé le</span><span class="info-value">{{ formatDate(server.createdAt) }}</span></div>
          <div class="info-row"><span class="info-label">ID</span><span class="info-value"><code>{{ server.id }}</code></span></div>
        </div>
      </div>
    </div>

    <!-- Section UTILISATEUR -->
    <div class="config-card">
      <div class="card-subtitle">👤 Utilisateur</div>
      <p class="config-desc" style="margin: 8px 0 12px;">
        Visualisez les informations de n'importe quel membre du serveur en entrant son ID Discord.
      </p>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <input
          v-model="userIdInput"
          class="discord-input"
          placeholder="ID Discord (ex: 1234567890)"
          style="flex: 1;"
          @keyup.enter="loadUser"
        />
        <button class="module-btn module-btn-primary" :disabled="!userIdInput || loadingUser" @click="loadUser">
          {{ loadingUser ? '⏳' : '🔍' }} Chercher
        </button>
      </div>
      <div v-if="userError" style="color: var(--red); margin-bottom: 12px;">❌ {{ userError }}</div>
      <div v-if="user" class="info-grid">
        <div class="info-avatar">
          <img v-if="user.avatarURL" :src="user.avatarURL" :alt="user.username" />
          <div v-else class="info-avatar-fallback">{{ (user.username || '?').charAt(0) }}</div>
        </div>
        <div class="info-fields">
          <div class="info-row"><span class="info-label">Pseudo</span><span class="info-value">{{ user.username }}</span></div>
          <div v-if="user.globalName" class="info-row"><span class="info-label">Nom global</span><span class="info-value">{{ user.globalName }}</span></div>
          <div class="info-row"><span class="info-label">Type</span><span class="info-value">{{ user.bot ? '🤖 Bot' : '👤 Humain' }}</span></div>
          <div v-if="user.nick" class="info-row"><span class="info-label">Surnom</span><span class="info-value">{{ user.nick }}</span></div>
          <div class="info-row"><span class="info-label">ID</span><span class="info-value"><code>{{ user.id }}</code></span></div>
          <div class="info-row"><span class="info-label">Compte créé</span><span class="info-value">{{ formatDate(new Date(user.createdTimestamp)) }}</span></div>
          <div v-if="user.joinedTimestamp" class="info-row"><span class="info-label">Rejoint le</span><span class="info-value">{{ formatDate(new Date(user.joinedTimestamp)) }}</span></div>
          <div v-if="user.roles.length" class="info-row"><span class="info-label">Rôles ({{ user.roles.length }})</span><span class="info-value info-roles">{{ user.roles.length }} rôles</span></div>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-subtitle">💡 Astuces</div>
      <p class="config-desc">
        Les équivalents en commande slash sont <code>/serverinfo</code>, <code>/userinfo [user]</code> et <code>/avatar [user]</code>.
        Ces commandes Discord produisent des embeds formatés avec les mêmes données.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useInfo, type ServerInfo, type UserInfo } from '~/composables/useInfo';

const info = useInfo();
const server = ref<ServerInfo | null>(null);
const user = ref<UserInfo | null>(null);
const loadingServer = ref(false);
const loadingUser = ref(false);
const error = ref<string | null>(null);
const userError = ref<string | null>(null);
const userIdInput = ref('');

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('fr-FR');
}

async function loadServer() {
  loadingServer.value = true;
  error.value = null;
  try {
    server.value = await info.getServer();
  } catch (e: any) {
    error.value = e.message || 'Erreur';
  } finally {
    loadingServer.value = false;
  }
}

async function loadUser() {
  if (!userIdInput.value) return;
  loadingUser.value = true;
  userError.value = null;
  user.value = null;
  try {
    user.value = await info.getUser(userIdInput.value);
  } catch (e: any) {
    userError.value = e.message || 'Utilisateur introuvable';
  } finally {
    loadingUser.value = false;
  }
}

onMounted(loadServer);
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
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; }
.config-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin: 0; }
.config-desc code { font-family: 'JetBrains Mono', monospace; background: var(--background-secondary); padding: 1px 4px; border-radius: 3px; }

.info-grid {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 16px;
  align-items: start;
  margin-top: 12px;
}
.info-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--background-modifier-hover);
}
.info-avatar img { width: 100%; height: 100%; object-fit: cover; }
.info-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: var(--text-muted);
  background: linear-gradient(135deg, #5865f2, #eb459e);
}
.info-fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
.info-value { color: var(--text-normal); }
.info-value code { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.info-roles { color: var(--brand-experiment, #5865f2); }
</style>
