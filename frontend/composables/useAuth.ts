import { ref, computed, readonly } from 'vue';

export interface AuthUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  role: 'admin' | 'mod' | 'viewer';
  isApiKey?: boolean;
}

const isAuthModalOpen = ref(false);
const authRequired = ref(false);
const savedApiKey = ref('');
const accessToken = ref('');
const currentUser = ref<AuthUser | null>(null);
const isInitializing = ref(false);

export function useAuth() {
  if (typeof window !== 'undefined' && !accessToken.value && !savedApiKey.value) {
    savedApiKey.value = localStorage.getItem('bot_api_key') || '';
    accessToken.value = sessionStorage.getItem('bot_access_token') || '';
    const storedUser = sessionStorage.getItem('bot_user');
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser);
      } catch {}
    }
  }

  // Vérifier si des tokens ou erreurs sont présents dans l'URL (retour OAuth2 Discord)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const roleFromUrl = urlParams.get('role') as 'admin' | 'mod' | 'viewer' | null;
    const usernameFromUrl = urlParams.get('username');
    const authError = urlParams.get('auth_error');

    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      if (usernameFromUrl && roleFromUrl) {
        currentUser.value = {
          userId: '',
          username: usernameFromUrl,
          role: roleFromUrl
        };
        sessionStorage.setItem('bot_user', JSON.stringify(currentUser.value));
      }
      // Nettoyer l'URL sans recharger la page
      urlParams.delete('token');
      urlParams.delete('role');
      urlParams.delete('username');
      const cleanUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, document.title, cleanUrl);

      // Charger le profil complet
      fetchCurrentUser();
    } else if (authError) {
      console.error('Erreur Auth Discord:', authError);
      isAuthModalOpen.value = true;
    }
  }

  function getAccessToken(): string {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('bot_access_token') || accessToken.value;
    }
    return accessToken.value;
  }

  function setAccessToken(token: string) {
    accessToken.value = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bot_access_token', token);
    }
  }

  function getApiKey(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bot_api_key') || savedApiKey.value;
    }
    return savedApiKey.value;
  }

  function setApiKey(key: string) {
    savedApiKey.value = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bot_api_key', key);
    }
  }

  function clearAuth() {
    accessToken.value = '';
    currentUser.value = null;
    savedApiKey.value = '';
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bot_access_token');
      sessionStorage.removeItem('bot_user');
      localStorage.removeItem('bot_api_key');
    }
  }

  function openAuthModal() {
    isAuthModalOpen.value = true;
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false;
  }

  function loginWithDiscord() {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/discord/login';
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'x-api-key': getApiKey()
        }
      });
    } catch {}
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
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

  async function fetchCurrentUser(): Promise<AuthUser | null> {
    const token = getAccessToken();
    const apiKey = getApiKey();

    if (!token && !apiKey) return null;

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (apiKey) headers['x-api-key'] = apiKey;

      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          currentUser.value = data.user;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('bot_user', JSON.stringify(data.user));
          }
          return data.user;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement profil utilisateur:', e);
    }
    return null;
  }

  async function refreshAccessToken(): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          if (data.user) {
            currentUser.value = data.user;
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('bot_user', JSON.stringify(data.user));
            }
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('Échec rafraîchissement token:', e);
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
          currentUser.value = {
            userId: 'api_key_user',
            username: 'Clé API (Admin)',
            role: 'admin',
            isApiKey: true
          };
          isAuthModalOpen.value = false;
          return true;
        }
      }
    } catch (e) {
      console.error('Erreur validation clé API:', e);
    }
    return false;
  }

  /**
   * Vérifie si l'utilisateur possède l'un des rôles requis
   * Hiérarchie : admin > mod > viewer
   */
  function hasRole(roles: string | string[]): boolean {
    if (!currentUser.value) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    const userRole = currentUser.value.role;

    if (userRole === 'admin') return true;
    if (roleList.includes('viewer')) return true;
    if (roleList.includes('mod') && (userRole === 'mod' || userRole === 'admin')) return true;
    return roleList.includes(userRole);
  }

  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isMod = computed(() => currentUser.value?.role === 'mod' || currentUser.value?.role === 'admin');
  const isAuthenticated = computed(() => !!currentUser.value || !!accessToken.value || !!savedApiKey.value);

  return {
    isAuthModalOpen: readonly(isAuthModalOpen),
    authRequired: readonly(authRequired),
    currentUser: readonly(currentUser),
    isAdmin,
    isMod,
    isAuthenticated,
    getAccessToken,
    setAccessToken,
    getApiKey,
    setApiKey,
    clearAuth,
    openAuthModal,
    closeAuthModal,
    loginWithDiscord,
    logout,
    checkAuthStatus,
    fetchCurrentUser,
    refreshAccessToken,
    verifyKey,
    hasRole
  };
}
