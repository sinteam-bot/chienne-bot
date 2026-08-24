<template>
  <UsersView @inspect-user="inspectUser" />
</template>

<script setup lang="ts">
import { inject } from 'vue';
import UsersView from '~/components/views/UsersView.vue';

const inspectUser = inject<(userOrId: any) => void>('inspectUser');
</script>
