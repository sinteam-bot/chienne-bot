import { useAuth } from "./useAuth.ts";
import { useToast } from "./useToast.ts";

export function useDiscordApi() {
  const { getAccessToken, getApiKey, openAuthModal, refreshAccessToken } = useAuth();
  const { showToast } = useToast();

  async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}, isRetry: boolean = false): Promise<T> {
    const accessToken = getAccessToken();
    const apiKey = getApiKey();
    const headers = new Headers(options.headers || {});

    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    if (apiKey && !headers.has('x-api-key')) {
      headers.set('x-api-key', apiKey);
    }

    if (!headers.has('x-guild-id') && typeof window !== 'undefined') {
      const storedGuild = window.localStorage.getItem('guild_id');
      if (storedGuild && storedGuild !== ':guild()' && storedGuild !== ':guild') {
        headers.set('x-guild-id', storedGuild);
      }
    }

    let reqBody = options.body;
    const isFormData = typeof FormData !== 'undefined' && reqBody instanceof FormData;
    const isBlob = typeof Blob !== 'undefined' && reqBody instanceof Blob;
    const isURLSearchParams = typeof URLSearchParams !== 'undefined' && reqBody instanceof URLSearchParams;
    const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && (reqBody instanceof ArrayBuffer || ArrayBuffer.isView(reqBody));

    if (reqBody !== undefined && reqBody !== null && typeof reqBody === 'object' && !isFormData && !isBlob && !isURLSearchParams && !isArrayBuffer) {
      reqBody = JSON.stringify(reqBody);
    }

    if (!headers.has('Content-Type') && !isFormData) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        body: reqBody,
        headers
      });

      // Si 401 (non autorisé) et pas encore réessayé, tenter un rafraîchissement transparent du token
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return await apiFetch<T>(endpoint, options, true);
        }
        openAuthModal();
        throw new Error('401 Unauthorized : Veuillez vous reconnecter.');
      } else if (response.status === 401) {
        openAuthModal();
        throw new Error('401 Unauthorized : Authentification requise.');
      }

      if (response.status === 403) {
        let permError = '403 Forbidden : Vous n\'avez pas les permissions requises pour cette action.';
        try {
          const errData = await response.json();
          if (errData?.error) permError = errData.error;
        } catch {}
        showToast(permError, 'error');
        throw new Error(permError);
      }

      if (!response.ok) {
        let errorMsg = `Erreur HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData?.error) errorMsg = errData.error;
        } catch {}
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return (await response.text()) as any;
    } catch (err: any) {
      if (!err.message?.includes('401') && !err.message?.includes('403')) {
        console.error(`[API Error] ${endpoint}:`, err);
      }
      throw err;
    }
  }

  return {
    apiFetch
  };
}
