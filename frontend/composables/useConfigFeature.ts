import { ref } from 'vue';
import { useDiscordApi } from './useDiscordApi.ts';
import { useToast } from './useToast.ts';

export interface UseConfigFeatureOptions<T = any> {
  defaultConfig?: Partial<T>;
  onSuccess?: (savedData: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Composable universel pour la lecture et la sauvegarde des configurations de modules (features)
 * basées sur le système multi-niveaux C12 :
 * - Lecture : GET /api/config/:guildId/:feature (fusionne example -> default -> guild -> env)
 * - Écriture : PATCH /api/config/:guildId/:feature (écrit dans data/{guildId}/{feature}.config.yml)
 */
export function useConfigFeature<T extends Record<string, any> = Record<string, any>>(
  featureName?: string,
  options: UseConfigFeatureOptions<T> = {}
) {
  const api = useDiscordApi();
  const { showToast } = useToast();

  const config = ref<T>({ ...(options.defaultConfig || {}) } as T);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const currentGuildId = ref<string>('');

  /**
   * Résout le guild_id actuel (URL > localStorage > /api/guild > 'default')
   */
  async function resolveGuildId(explicitGuildId?: string): Promise<string> {
    if (explicitGuildId && explicitGuildId.trim() !== '') {
      currentGuildId.value = explicitGuildId;
      return explicitGuildId;
    }
    if (typeof window === 'undefined') {
      currentGuildId.value = 'default';
      return 'default';
    }

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('guild_id') || params.get('guildId');
    if (fromUrl) {
      currentGuildId.value = fromUrl;
      window.localStorage.setItem('guild_id', fromUrl);
      return fromUrl;
    }

    const fromStorage = window.localStorage.getItem('guild_id');
    if (fromStorage && fromStorage.trim() !== '') {
      currentGuildId.value = fromStorage;
      return fromStorage;
    }

    try {
      const res = await api.apiFetch<{ success: boolean; data: any }>('/api/guild');
      const gid = res.data?.id;
      if (gid) {
        currentGuildId.value = gid;
        window.localStorage.setItem('guild_id', gid);
        return gid;
      }
    } catch {
      // ignore
    }

    currentGuildId.value = 'default';
    return 'default';
  }

  /**
   * Récupère la configuration d'une feature pour une guilde (GET /api/config/:guildId/:feature)
   */
  async function getFeatureConfig<R = T>(feature?: string, guildId?: string): Promise<R | null> {
    const feat = feature || featureName;
    if (!feat) throw new Error('Nom de feature requis pour charger la configuration');

    const gid = await resolveGuildId(guildId);
    isLoading.value = true;
    try {
      const res = await api.apiFetch<{ success: boolean; guildId: string; feature: string; data: R }>(
        `/api/config/${encodeURIComponent(gid)}/${encodeURIComponent(feat)}`
      );
      if (res.success && res.data) {
        config.value = { ...config.value, ...res.data };
        return res.data;
      }
      return null;
    } catch (err: any) {
      options.onError?.(err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sauvegarde la configuration d'une feature pour une guilde (PATCH /api/config/:guildId/:feature)
   * Écrit directement dans data/{guildId}/{feature}.config.yml
   */
  async function saveFeatureConfig<R = T>(
    featureOrPatch?: string | Partial<T>,
    patchOrGuildId?: Partial<T> | string,
    explicitGuildId?: string
  ): Promise<R | null> {
    let feat = featureName;
    let patch: Partial<T> = {};
    let guildId = explicitGuildId;

    if (typeof featureOrPatch === 'string') {
      feat = featureOrPatch;
      if (patchOrGuildId && typeof patchOrGuildId === 'object') {
        patch = patchOrGuildId;
      }
    } else if (featureOrPatch && typeof featureOrPatch === 'object') {
      patch = featureOrPatch;
      if (typeof patchOrGuildId === 'string') {
        guildId = patchOrGuildId;
      }
    }

    if (!feat) throw new Error('Nom de feature requis pour sauvegarder la configuration');

    const gid = await resolveGuildId(guildId);
    isSaving.value = true;

    try {
      const res = await api.apiFetch<{ success: boolean; guildId: string; feature: string; data: R; message?: string }>(
        `/api/config/${encodeURIComponent(gid)}/${encodeURIComponent(feat)}`,
        {
          method: 'PATCH',
          body: patch
        }
      );

      if (res.success && res.data) {
        config.value = { ...config.value, ...res.data };
        showToast(res.message || `Configuration "${feat}" enregistrée dans data/${gid}/${feat}.config.yml !`, 'success');
        options.onSuccess?.(res.data as any);
        return res.data;
      }
      return null;
    } catch (err: any) {
      showToast(`Erreur de sauvegarde (${feat}): ${err.message}`, 'error');
      options.onError?.(err);
      throw err;
    } finally {
      isSaving.value = false;
    }
  }

  return {
    config,
    isLoading,
    isSaving,
    currentGuildId,
    resolveGuildId,
    getFeatureConfig,
    saveFeatureConfig,
    // Méthodes pratiques liées au featureName
    load: (guildId?: string) => getFeatureConfig(featureName, guildId),
    save: (patch?: Partial<T>, guildId?: string) => saveFeatureConfig(patch || config.value, guildId)
  };
}
