<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Carte d'état / Décompte Live -->
    <div class="config-card" style="position: relative; overflow: hidden;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div
            style="width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px;"
            :style="{ background: bumpStatus.isReady ? 'rgba(87, 242, 135, 0.15)' : 'rgba(88, 101, 242, 0.15)' }"
          >
            <span v-if="bumpStatus.isReady">🚀</span>
            <span v-else>⏳</span>
          </div>
          <div>
            <h3 style="margin: 0 0 4px 0; font-size: 18px; color: var(--header-primary);">
              {{ bumpStatus.isReady ? 'Le serveur est prêt à être bumpé !' : 'Recharge du Bump en cours' }}
            </h3>
            <span style="font-size: 13px; color: var(--text-muted);">
              {{ bumpStatus.isReady ? 'Tapez /bump dans Discord pour booster le serveur sur Disboard' : `Prochain rappel dans ${formattedRemaining}` }}
            </span>
          </div>
        </div>

        <div>
          <button
            class="action-btn"
            style="background: var(--brand-experiment, #5865f2); color: white; border: none; font-size: 13px; padding: 8px 16px; display: flex; align-items: center; gap: 8px;"
            :disabled="sendingTest"
            @click="handleTestReminder"
          >
            <span v-if="sendingTest" class="spinner" style="width: 14px; height: 14px;"></span>
            <span>🔔 Tester le Rappel Discord</span>
          </button>
        </div>
      </div>

      <!-- Barre de progression -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
          <span>Progression du cooldown (2h)</span>
          <span><strong>{{ progressPercent }}%</strong></span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
          <div
            style="height: 100%; transition: width 1s linear; border-radius: 4px;"
            :style="{
              width: `${progressPercent}%`,
              background: bumpStatus.isReady ? 'var(--green, #57f287)' : 'var(--brand-experiment, #5865f2)'
            }"
          ></div>
        </div>
      </div>

      <!-- Détails métadonnées -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; background: var(--bg-tertiary); padding: 14px 18px; border-radius: 8px; font-size: 13px;">
        <div>
          <span style="color: var(--text-muted); display: block; font-size: 11px; margin-bottom: 2px;">Dernier Bumper</span>
          <strong style="color: var(--header-primary);">{{ bumpStatus.lastBump?.bumperUsername || bumpStatus.lastBump?.username || '—' }}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted); display: block; font-size: 11px; margin-bottom: 2px;">Date du dernier bump</span>
          <strong style="color: var(--header-primary);">
            <DiscordTime v-if="bumpStatus.lastBump?.bumpedAt" :value="bumpStatus.lastBump.bumpedAt" mode="both" />
            <span v-else>—</span>
          </strong>
        </div>
        <div>
          <span style="color: var(--text-muted); display: block; font-size: 11px; margin-bottom: 2px;">Prochain rappel prévu à</span>
          <strong style="color: var(--header-primary);">
            <span v-if="bumpStatus.isReady" class="module-status-pill verified" style="font-size: 11px; padding: 2px 6px;">🟢 Prêt maintenant</span>
            <DiscordTime v-else-if="nextReminderTimestamp" :value="nextReminderTimestamp" mode="both" />
            <span v-else>—</span>
          </strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, type Ref } from 'vue';
import { useDiscordApi } from '~/composables/useDiscordApi.ts';
import { useToast } from '~/composables/useToast.ts';
import { useDateFormatter } from '~/composables/useDateFormatter.ts';
import DiscordTime from '~/components/common/DiscordTime.vue';

const { apiFetch } = useDiscordApi();
const { showToast } = useToast();
const { parseDateSafe } = useDateFormatter();

const bumpStatus = inject<Ref<any>>('bumpStatus', ref({}));
const loadBumpStatus = inject<() => Promise<void>>('loadBumpStatus', async () => {});

const sendingTest = ref(false);

const remainingSeconds = computed(() => {
  return bumpStatus.value.remainingSeconds || 0;
});

const formattedRemaining = computed(() => {
  const sTotal = remainingSeconds.value;
  if (sTotal <= 0) return '00:00:00';
  const h = Math.floor(sTotal / 3600);
  const m = Math.floor((sTotal % 3600) / 60);
  const s = sTotal % 60;

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
});

const progressPercent = computed(() => {
  const total = 2 * 3600;
  const elapsed = Math.max(0, total - remainingSeconds.value);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
});

const nextReminderTimestamp = computed(() => {
  if (!bumpStatus.value.lastBump?.bumpedAt) return null;
  const d = parseDateSafe(bumpStatus.value.lastBump.bumpedAt);
  if (!d) return null;
  return new Date(d.getTime() + 2 * 3600 * 1000);
});

async function handleTestReminder() {
  sendingTest.value = true;
  try {
    const res = await apiFetch<{ success: boolean; message?: string }>('/api/bump/test-reminder', {
      method: 'POST'
    });
    if (res.success) {
      showToast('🔔 Rappel envoyé avec succès sur Discord !', 'success');
      await loadBumpStatus();
    } else {
      showToast('Erreur envoi rappel: ' + (res as any).error, 'error');
    }
  } catch (err: any) {
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    sendingTest.value = false;
  }
}
</script>
