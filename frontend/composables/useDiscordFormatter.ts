import { useAppState } from './useAppState.ts';
import { getProxiedImageUrl } from './useDiscordImageProxy.ts';

export function useDiscordFormatter() {
  const { users, roles, discordChannels, guildEmojis } = useAppState();

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDiscordContent(rawContent: string, messageContext?: any): string {
    if (!rawContent) return '';

    // Tokens protégés pour éviter tout remplacement récursif ou imbriqué
    const tokens: string[] = [];
    function pushToken(html: string): string {
      const idx = tokens.length;
      tokens.push(html);
      return `\x01TOKEN_${idx}\x01`;
    }

    let content = rawContent;

    // 1. Blocs de code ```lang\ncode\n```
    content = content.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (_match, lang, code) => {
      const safeCode = escapeHtml(code);
      const safeLang = escapeHtml(lang || '');
      return pushToken(
        `<pre class="discord-code-block">${safeLang ? `<span class="code-lang-tag">${safeLang}</span>` : ''}<code>${safeCode}</code></pre>`
      );
    });

    // 2. Code inline `code`
    content = content.replace(/`([^`]+)`/g, (_match, code) => {
      return pushToken(`<code class="discord-inline-code">${escapeHtml(code)}</code>`);
    });

    // 3. Spoilers ||texte||
    content = content.replace(/\|\|(.*?)\|\|/g, (_match, text) => {
      return pushToken(`<span class="discord-spoiler" onclick="this.classList.toggle('revealed')">${escapeHtml(text)}</span>`);
    });

    // 4. Échappement HTML général pour sécuriser le texte restant
    content = escapeHtml(content);

    // 5. Emojis Discord Personnalisés (<:name:id> et <a:name:id>)
    // Gère la syntaxe brute <:name:id> ou déjà échappée &lt;:name:id&gt;
    content = content.replace(
      /(?:&lt;|<)(a?):([a-zA-Z0-9_]+):(\d+)(?:&gt;|>)/g,
      (_match, animated, name, id) => {
        const ext = animated ? 'gif' : 'png';
        const rawUrl = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`;
        const proxiedUrl = getProxiedImageUrl(rawUrl);
        return pushToken(
          `<img class="discord-custom-emoji" src="${proxiedUrl}" alt=":${name}:" title=":${name}:" referrerpolicy="no-referrer" loading="lazy" />`
        );
      }
    );

    // 6. Emojis du serveur mentionnés par leur nom textuel (:NomEmoji:)
    content = content.replace(/:([a-zA-Z0-9_]{2,32}):/g, (fullMatch, name) => {
      if (Array.isArray(guildEmojis.value) && guildEmojis.value.length > 0) {
        const lowerName = name.toLowerCase();
        const found = guildEmojis.value.find(
          (e: any) => e.name && e.name.toLowerCase() === lowerName
        );
        if (found) {
          const ext = found.animated ? 'gif' : 'png';
          const rawUrl = found.url || `https://cdn.discordapp.com/emojis/${found.id}.${ext}?size=48&quality=lossless`;
          const proxiedUrl = getProxiedImageUrl(rawUrl);
          return pushToken(
            `<img class="discord-custom-emoji" src="${proxiedUrl}" alt=":${found.name}:" title=":${found.name}:" referrerpolicy="no-referrer" loading="lazy" />`
          );
        }
      }
      return fullMatch;
    });

    // 7. Mentions de Rôles (<@&1513890607959904422> et &lt;@&amp;id&gt;)
    content = content.replace(
      /(?:&lt;|<)@&(?:amp;)?(\d+)(?:&gt;|>)/g,
      (_match, id) => {
        let roleName = `Rôle (${id})`;
        let roleColor: string | null = null;

        if (Array.isArray(roles.value)) {
          const found = roles.value.find((r: any) => r.id === id);
          if (found) {
            roleName = found.name;
            roleColor = found.color;
          }
        }

        const bg = roleColor ? `${roleColor}26` : 'rgba(88, 101, 242, 0.18)';
        const col = roleColor || '#c9cdfb';
        return pushToken(
          `<span class="discord-mention discord-mention-role" style="background-color: ${bg}; color: ${col};" title="Rôle ID: ${id}">@${escapeHtml(roleName)}</span>`
        );
      }
    );

    // 8. Mentions d'Utilisateurs (<@123456789> ou <@!123456789>)
    content = content.replace(
      /(?:&lt;|<)@!?(?:amp;)?(\d+)(?:&gt;|>)/g,
      (_match, id) => {
        let userName = `Utilisateur`;

        if (Array.isArray(users.value)) {
          const found = users.value.find((u: any) => u.id === id || u.userId === id || u.user_id === id);
          if (found) {
            userName = found.displayName || found.username || found.globalName || found.name;
          }
        }

        if (userName === 'Utilisateur' && messageContext?.mentions?.users) {
          const foundCtx = messageContext.mentions.users.find((u: any) => u.id === id);
          if (foundCtx) {
            userName = foundCtx.displayName || foundCtx.username;
          }
        }

        return pushToken(
          `<span class="discord-mention discord-mention-user" title="Utilisateur ID: ${id}">@${escapeHtml(userName)}</span>`
        );
      }
    );

    // 9. Mentions de Salons (<#123456789>)
    content = content.replace(
      /(?:&lt;|<)#(\d+)(?:&gt;|>)/g,
      (_match, id) => {
        let channelName = id;

        if (Array.isArray(discordChannels.value)) {
          const found = discordChannels.value.find((c: any) => c.id === id);
          if (found) {
            channelName = found.name;
          }
        }

        return pushToken(
          `<span class="discord-mention discord-mention-channel" title="Salon ID: ${id}">#${escapeHtml(channelName)}</span>`
        );
      }
    );

    // 10. Mentions textuelles prédéfinies (@everyone, @here, @Utilisateur, #salon)
    content = content.replace(/@(everyone|here)\b/gi, (_match, name) => {
      return pushToken(`<span class="discord-mention discord-mention-everyone">@${escapeHtml(name)}</span>`);
    });
    content = content.replace(/@(Utilisateur)\b/g, (_match, name) => {
      return pushToken(`<span class="discord-mention discord-mention-user">@${escapeHtml(name)}</span>`);
    });
    content = content.replace(/#([a-zA-Z0-9_\-\u00C0-\u017F]{2,32})\b/g, (fullMatch, chName) => {
      if (chName.toLowerCase() === 'salon' || (Array.isArray(discordChannels.value) && discordChannels.value.some((c: any) => c.name.toLowerCase() === chName.toLowerCase()))) {
        return pushToken(`<span class="discord-mention discord-mention-channel">#${escapeHtml(chName)}</span>`);
      }
      return fullMatch;
    });

    // 11. Citations Discord (>>> Multiligne et > Simple ligne)
    content = content.replace(/^&gt;&gt;&gt;\s*([\s\S]*)$/gm, '<blockquote class="discord-quote multiline">$1</blockquote>');
    content = content.replace(/^&gt;\s*(.*)$/gm, '<blockquote class="discord-quote">$1</blockquote>');

    // 12. Formatage Markdown (Gras, Italique, Souligné, Barré)
    content = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    content = content.replace(/__(.*?)__/g, '<u>$1</u>');
    content = content.replace(/~~(.*?)~~/g, '<s>$1</s>');

    // 13. Liens automatiques HTTP / HTTPS
    content = content.replace(
      /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
      (_match, url) => pushToken(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="discord-link">${escapeHtml(url)}</a>`)
    );

    // 14. Sauts de ligne
    content = content.replace(/\n/g, '<br/>');

    // 15. Restauration de tous les tokens protégés
    content = content.replace(/\x01TOKEN_(\d+)\x01/g, (_match, idxStr) => {
      const idx = parseInt(idxStr, 10);
      return tokens[idx] !== undefined ? tokens[idx] : '';
    });

    return content;
  }

  return {
    escapeHtml,
    formatDiscordContent
  };
}
