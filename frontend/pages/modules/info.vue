<template>
  <div class="view-panel">
    <div class="module-view-scroller">
      <div class="module-header" style="margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 700; color: var(--header-primary); margin: 0 0 6px 0; display: flex; align-items: center; gap: 10px;">
            <span>ℹ️</span> Commandes d'Information
          </h2>
          <p class="module-desc" style="margin: 0; color: var(--text-muted); font-size: 13px;">
            Visualisez les informations du serveur, d'un membre et les avatars.
            Équivalent dashboard des commandes <code>/serverinfo</code>, <code>/userinfo</code> et <code>/avatar</code>.
          </p>
        </div>
      </div>

      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Commandes d\'Information',
  icon: 'ℹ️',
  description: 'Voir les informations Discord (serveur, user, avatar) depuis le dashboard',
  section: 'modules',
  order: 11
});

useSeoMeta({
  title: 'Commandes d\'Information - Bot',
  description: 'Voir les informations du serveur, d\'un membre et les avatars',
  ogTitle: 'Commandes d\'Information - Bot',
  ogDescription: 'Visualisez les informations du serveur, d\'un membre et les avatars depuis le dashboard.'
});
</script>
