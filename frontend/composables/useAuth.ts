const isAuthModalOpen = ref(false);
const authRequired = ref(false);
const savedApiKey = ref('');

export function useAuth() {
  if (typeof window !== 'undefined' && !savedApiKey.value) {
    savedApiKey.value = localStorage.getItem('chienne_bot_api_key') || '';
  }

  function getApiKey(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chienne_bot_api_key') || savedApiKey.value;
    }
    return savedApiKey.value;
  }

  function setApiKey(key: string) {
    savedApiKey.value = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('chienne_bot_api_key', key);
    }
  }

  function clearApiKey() {
    savedApiKey.value = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chienne_bot_api_key');
    }
  }

  function openAuthModal() {
    isAuthModalOpen.value = true;
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false;
  }

  async function checkAuthStatus(): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const data = await res.json();
        authRequired.value = !!data.authRequired;
        return authRequired.value;
      }
    } catch (e) {
      console.warn('Erreur vérification statut auth:', e);
    }
    return false;
  }

  async function verifyKey(keyToTest: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setApiKey(keyToTest);
          isAuthModalOpen.value = false;
          return true;
        }
      }
    } catch (e) {
      console.error('Erreur validation clé API:', e);
    }
    return false;
  }

  return {
    isAuthModalOpen: readonly(isAuthModalOpen),
    authRequired: readonly(authRequired),
    getApiKey,
    setApiKey,
    clearApiKey,
    openAuthModal,
    closeAuthModal,
    checkAuthStatus,
    verifyKey
  };
}
