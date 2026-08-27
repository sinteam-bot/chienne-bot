<template>
  <UsersView @inspect-user="inspectUser" />
</template>

<script setup lang="ts">
import { inject } from 'vue';
import UsersView from '~/components/views/UsersView.vue';

definePageMeta({
  title: 'Membres & Rôles',
  icon: '👥',
  description: 'Annuaire des utilisateurs, rôles et inspection de profil',
  section: 'bot',
  order: 6
});

useSeoMeta({
  title: 'Membres & Rôles',
  description: 'Annuaire des utilisateurs, rôles et inspection de profil',
  ogTitle: 'Membres & Rôles - Chienne Bot',
  ogDescription: 'Annuaire des utilisateurs, rôles et inspection de profil'
});

const inspectUser = inject<(userOrId: any) => void>('inspectUser');
</script>
