/**
 * Composable et utilitaire global de proxy d'images Discord
 * 
 * Évite les avertissements de cookies tiers (Cookie __cf_bm, __dcfduid, __sdcfduid rejetés)
 * et accélère le chargement en passant par le cache mémoire backend /api/proxy/image
 */

export function getProxiedImageUrl(url?: string | null, fallback?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback || '/api/proxy/image?url=' + encodeURIComponent('https://cdn.discordapp.com/embed/avatars/0.png');
  }

  const trimmed = url.trim();

  // Déjà proxifié ou format local (base64 / blob)
  if (
    trimmed.startsWith('/api/proxy/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // URL Discord CDN ou média externe
  if (
    trimmed.startsWith('https://cdn.discordapp.com/') ||
    trimmed.startsWith('https://media.discordapp.net/') ||
    trimmed.startsWith('https://images-ext-1.discordapp.net/') ||
    trimmed.startsWith('https://images-ext-2.discordapp.net/') ||
    trimmed.startsWith('https://avatars.githubusercontent.com/') ||
    trimmed.startsWith('https://raw.githubusercontent.com/')
  ) {
    return `/api/proxy/image?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

export function getProxiedEmojiUrl(emojiId: string, animated = false): string {
  if (!emojiId) return '';
  const ext = animated ? 'gif' : 'png';
  const rawUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}?size=48&quality=lossless`;
  return getProxiedImageUrl(rawUrl);
}

export function useDiscordImageProxy() {
  return {
    getProxiedImageUrl,
    getProxiedEmojiUrl
  };
}
