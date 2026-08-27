<template>
  <div class="features-page">
    <header class="features-page__header">
      <div>
        <h1>🧩 Fonctionnalités du bot</h1>
        <p>Activez ou désactivez les fonctionnalités de <strong>Chienne</strong> pour ce serveur.</p>
      </div>
      <div class="features-page__actions">
        <button class="btn-refresh" :disabled="loading" @click="load">
          {{ loading ? '⏳ Chargement…' : '🔄 Rafraîchir' }}
        </button>
      </div>
    </header>

    <div v-if="error" class="features-page__error">
      ❌ {{ error }}
    </div>

    <div v-if="loading && features.length === 0" class="features-page__loading">
      Chargement des fonctionnalités…
    </div>

    <div v-else class="features-page__grid">
      <FeatureCard
        v-for="f in features"
        :key="f.name"
        :name="f.name"
        :title="featuresApi.label(f.name)"
        :emoji="featuresApi.emoji(f.name)"
        :description="featuresApi.description(f.name)"
        :enabled="f.state.enabled"
        :source="f.state.source"
        :guild-id="guildId"
        @updated="onUpdated"
      />
    </div>

    <footer class="features-page__footer">
      <p>
        💡 Astuce : les modifications sont prises en compte <strong>instantanément</strong>, sans redémarrage du bot.
        Les états sont stockés en base de données et surchargent la configuration YAML.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useFeatures, type FeatureEntry } from '~/composables/useFeatures';

const featuresApi = useFeatures();
const features = ref<FeatureEntry[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const guildId = computed(() => {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('guild_id') || undefined;
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    features.value = await featuresApi.list(guildId.value);
  } catch (e: any) {
    error.value = e.message || 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

function onUpdated(payload: { name: string; enabled: boolean }) {
  const f = features.value.find(x => x.name === payload.name);
  if (f) {
    f.state.enabled = payload.enabled;
    f.state.source = 'db';
  }
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.features-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f3f5;
}

.features-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}

.features-page__header h1 {
  margin: 0 0 4px;
  font-size: 28px;
}

.features-page__header p {
  margin: 0;
  color: #b5bac1;
  font-size: 14px;
}

.btn-refresh {
  background: #4e5058;
  color: #f2f3f5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #5865f2;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.features-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.features-page__error {
  background: #ed4245;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.features-page__loading {
  text-align: center;
  padding: 60px 20px;
  color: #80848e;
  font-size: 16px;
}

.features-page__footer {
  margin-top: 32px;
  padding: 16px;
  background: #2b2d31;
  border-radius: 8px;
  border: 1px solid #3f4147;
}

.features-page__footer p {
  margin: 0;
  color: #b5bac1;
  font-size: 13px;
  line-height: 1.5;
}

.features-page__footer strong {
  color: #fee75c;
}
</style>
