<template>
  <div style="display: flex; flex-direction: column; gap: 20px;">
    <!-- Formulaire de création -->
    <div class="config-card">
      <div class="card-subtitle">➕ Créer un item de shop (admin)</div>
      <p class="config-desc" style="margin: 8px 0 16px;">
        Les membres pourront acheter cet item avec <code>/shop-buy &lt;nom&gt;</code>.
        Le rôle (optionnel) est donné à l'achat ; l'XP (optionnel) est ajoutée.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        <div>
          <label class="config-label">Nom</label>
          <input v-model="form.name" class="discord-input" placeholder="Potion de vie" maxlength="50" />
        </div>
        <div>
          <label class="config-label">Prix</label>
          <input v-model.number="form.price" type="number" min="0" class="discord-input" placeholder="100" />
        </div>
        <div>
          <label class="config-label">Rôle cadeau (optionnel)</label>
          <DiscordRoleSelect v-model="form.roleRewardId" placeholder="Aucun" />
        </div>
        <div>
          <label class="config-label">XP cadeau (optionnel)</label>
          <input v-model.number="form.xpReward" type="number" min="0" class="discord-input" placeholder="0" />
        </div>
      </div>
      <div style="margin-top: 12px;">
        <label class="config-label">Description (optionnel)</label>
        <input v-model="form.description" class="discord-input" placeholder="Restaure 50 HP" maxlength="200" style="width: 100%;" />
      </div>
      <div style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap;">
        <label class="config-check">
          <input v-model="form.isTradeable" type="checkbox" /> Échangeable
        </label>
        <label class="config-check">
          <input v-model="form.isDroppable" type="checkbox" /> Droppable
        </label>
      </div>
      <div style="margin-top: 16px;">
        <button class="module-btn module-btn-primary" :disabled="!canCreate || creating" @click="createOne">
          {{ creating ? '⏳' : '➕' }} Créer l'item
        </button>
        <span v-if="createOk" style="margin-left: 12px; color: var(--green);">✅ Créé</span>
        <span v-if="createError" style="margin-left: 12px; color: var(--red);">❌ {{ createError }}</span>
      </div>
    </div>

    <!-- Liste -->
    <div class="config-card">
      <div class="card-subtitle" style="display: flex; align-items: center; justify-content: space-between;">
        <span>🛒 Items du shop ({{ items.length }})</span>
        <button class="module-btn" @click="load" :disabled="loading">🔄 Rafraîchir</button>
      </div>
      <div v-if="loading && items.length === 0" style="color: var(--text-muted); padding: 24px; text-align: center;">Chargement…</div>
      <div v-else-if="items.length === 0" style="color: var(--text-muted); padding: 24px; text-align: center;">
        Aucun item dans le shop. Créez-en un ci-dessus.
      </div>
      <div v-else>
        <div v-for="item in items" :key="item.id" class="item-row">
          <div class="item-row__emoji">{{ item.emoji || '🛒' }}</div>
          <div class="item-row__body">
            <div class="item-row__title">
              <strong>{{ item.name }}</strong>
              <span class="item-row__price">{{ item.price.toLocaleString('fr-FR') }} 🪙</span>
            </div>
            <div v-if="item.description" class="item-row__desc">{{ item.description }}</div>
            <div class="item-row__flags">
              <span v-if="item.roleRewardId" class="flag">🎖️ Rôle: <code>{{ item.roleRewardId.slice(0, 14) }}…</code></span>
              <span v-if="item.xpReward" class="flag">⭐ +{{ item.xpReward }} XP</span>
              <span v-if="item.isTradeable" class="flag">✅ Échangeable</span>
              <span v-if="item.isDroppable" class="flag">✅ Droppable</span>
            </div>
          </div>
          <button class="module-btn module-btn-sm" @click.stop="deleteOne(item)" style="background: rgba(237, 66, 69, 0.15); color: #ed4245;">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEconomy, type ShopItem } from '~/composables/useEconomy';

const economy = useEconomy();
const items = ref<ShopItem[]>([]);
const loading = ref(false);
const creating = ref(false);
const createOk = ref(false);
const createError = ref<string | null>(null);

const form = ref({
  name: '',
  price: 0,
  description: '',
  roleRewardId: '',
  xpReward: 0,
  isTradeable: true,
  isDroppable: true
});

const canCreate = computed(() => form.value.name.length > 0 && form.value.price >= 0);

async function load() {
  loading.value = true;
  try {
    const res = await economy.listShop();
    items.value = Array.isArray(res) ? res : [];
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
}

async function createOne() {
  if (!canCreate.value) return;
  creating.value = true;
  createOk.value = false;
  createError.value = null;
  try {
    const payload: any = {
      name: form.value.name,
      price: form.value.price,
      description: form.value.description || undefined,
      roleRewardId: form.value.roleRewardId || undefined,
      xpReward: form.value.xpReward || undefined,
      isTradeable: form.value.isTradeable,
      isDroppable: form.value.isDroppable
    };
    const r = await economy.createShopItem(payload);
    if (!r.success) {
      createError.value = r.error || 'Erreur';
      return;
    }
    if (r.data) items.value.push(r.data);
    createOk.value = true;
    setTimeout(() => (createOk.value = false), 3000);
    // Reset form
    form.value = { name: '', price: 0, description: '', roleRewardId: '', xpReward: 0, isTradeable: true, isDroppable: true };
  } catch (e: any) {
    createError.value = e.message;
  } finally {
    creating.value = false;
  }
}

async function deleteOne(item: ShopItem) {
  if (!confirm(`Supprimer "${item.name}" ?`)) return;
  try {
    await economy.deleteShopItem(item.id);
    items.value = items.value.filter(i => i.id !== item.id);
  } catch {}
}

onMounted(load);
</script>

<style scoped>
.config-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.config-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}
.config-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
}
.config-check input { width: 16px; height: 16px; }

.module-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  background: var(--background-modifier-hover);
  color: var(--text-normal);
  font-size: 13px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  font-family: inherit;
}
.module-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.module-btn-sm { padding: 4px 10px; font-size: 12px; }
.module-btn-primary { background: var(--brand-experiment, #5865f2); color: white; border-color: transparent; }

.item-row {
  display: grid;
  grid-template-columns: 50px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.item-row:last-child { border-bottom: none; }
.item-row__emoji {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: var(--background-secondary);
  border-radius: 8px;
}
.item-row__title { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.item-row__title strong { font-size: 14px; }
.item-row__price { color: #fee75c; font-size: 13px; font-weight: 600; }
.item-row__desc { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.item-row__flags { display: flex; gap: 8px; flex-wrap: wrap; }
.flag { font-size: 11px; color: var(--text-muted); background: var(--background-secondary); padding: 1px 6px; border-radius: 3px; }
.flag code { font-family: 'JetBrains Mono', monospace; }
</style>
