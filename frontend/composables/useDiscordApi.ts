import { useAuth } from "./useAuth.ts";
import { useToast } from "./useToast.ts";

export function useDiscordApi() {
  const { getApiKey, openAuthModal } = useAuth();
  const { showToast } = useToast();

  async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const apiKey = getApiKey();
    const headers = new Headers(options.headers || {});

    if (apiKey && !headers.has('x-api-key')) {
      headers.set('x-api-key', apiKey);
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

      if (response.status === 401) {
        openAuthModal();
        throw new Error('401 Unauthorized: Une clé API valide est requise.');
      }

      if (!response.ok) {
        let errorMsg = `Erreur HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData?.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return (await response.text()) as any;
    } catch (err: any) {
      if (!err.message?.includes('401')) {
        console.error(`[API Error] ${endpoint}:`, err);
      }
      throw err;
    }
  }

  return {
    apiFetch
  };
}
