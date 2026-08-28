<template>
  <div class="cards-page">
    <header class="cards-page__header">
      <div>
        <h1>🎨 Cartes & visuels</h1>
        <p>Aperçu des templates réutilisables (welcome, level-up, giveaway…).</p>
      </div>
      <div class="cards-page__actions">
        <input
          v-model="userId"
          placeholder="User ID"
          class="cards-page__input"
        />
        <input
          v-model="server"
          placeholder="Nom du serveur"
          class="cards-page__input"
        />
        <input
          v-model.number="level"
          type="number"
          placeholder="Niveau"
          class="cards-page__input cards-page__input--narrow"
        />
      </div>
    </header>

    <div class="cards-page__grid">
      <section class="cards-section">
        <h2>👋 Welcome</h2>
        <UserCard
          template="welcome"
          :payload="welcomePayload"
          :user-id="userId || 'demo-user'"
          :guild-id="guildId || 'demo-guild'"
          :width="800"
          :height="400"
          caption="Carte envoyée aux nouveaux membres."
        />
      </section>

      <section class="cards-section">
        <h2>➕ Join</h2>
        <UserCard
          template="join"
          :payload="joinPayload"
          :width="800"
          :height="400"
        />
      </section>

      <section class="cards-section">
        <h2>➖ Leave</h2>
        <UserCard
          template="leave"
          :payload="leavePayload"
          :width="800"
          :height="400"
        />
      </section>

      <section class="cards-section">
        <h2>🎉 Level up</h2>
        <UserCard
          template="level_up"
          :payload="levelUpPayload"
          :width="800"
          :height="400"
        />
      </section>

      <section class="cards-section">
        <h2>🎁 Giveaway</h2>
        <UserCard
          template="giveaway"
          :payload="giveawayPayload"
          :width="800"
          :height="400"
        />
      </section>

      <section class="cards-section">
        <h2>⚙️ Generic</h2>
        <UserCard
          template="generic"
          :payload="genericPayload"
          :width="800"
          :height="400"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

definePageMeta({
  title: 'Cartes & Canvas',
  icon: '🃏',
  description: 'Générateur et prévisualisation des cartes de profil Discord',
  section: 'modules',
  order: 10
});

useSeoMeta({
  title: 'Cartes & Canvas',
  description: 'Générateur et prévisualisation des cartes de profil Discord',
  ogTitle: 'Cartes & Canvas - Chienne Bot',
  ogDescription: 'Générateur et prévisualisation des cartes de profil Discord'
});

const guildId = ref('1234567890');
const userId = ref('987654321');
const server = ref('Chienne Test');
const level = ref(5);

const welcomePayload = computed(() => ({
  username: 'Alice',
  server: server.value,
  memberCount: 1337,
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png'
}));

const joinPayload = computed(() => ({
  username: 'Bob',
  memberCount: 1338,
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/1.png'
}));

const leavePayload = computed(() => ({
  username: 'Charlie',
  stayDuration: '42 jours',
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/2.png'
}));

const levelUpPayload = computed(() => ({
  username: 'Dave',
  level: level.value,
  totalXp: 2500,
  progressPercent: 65,
  avatarUrl: 'https://cdn.discordapp.com/embed/avatars/3.png'
}));

const giveawayPayload = computed(() => ({
  prize: 'Nitro Classic (1 mois)',
  host: 'Staff',
  winnersCount: 1,
  endsAt: '2026-08-30 18:00',
  description: 'Réagis avec 🎉 pour participer !'
}));

const genericPayload = computed(() => ({
  title: 'Chienne Bot',
  subtitle: 'Une démo du template générique',
  color1: '#5865f2',
  color2: '#f2c7ce'
}));
</script>

<style scoped>
.cards-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}

.cards-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.cards-page__header h1 { margin: 0 0 4px; font-size: 28px; }
.cards-page__header p { margin: 0; color: #b5bac1; font-size: 14px; }

.cards-page__actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.cards-page__input {
  background: #2b2d31;
  color: #f2f3f5;
  border: 1px solid #3f4147;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.cards-page__input--narrow { width: 100px; }

.cards-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 20px;
}

.cards-section {
  background: #1e1f22;
  border: 1px solid #3f4147;
  border-radius: 12px;
  padding: 16px;
}

.cards-section h2 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #fee75c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
