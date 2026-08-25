import { useAppState } from './useAppState.ts';

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

    // Étape 1 : Protection et extraction des blocs de code
    const codeBlocks: string[] = [];
    let content = rawContent.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (_match, lang, code) => {
      const index = codeBlocks.length;
      const safeCode = escapeHtml(code);
      const safeLang = escapeHtml(lang || '');
      codeBlocks.push(
        `<pre class="discord-code-block">${safeLang ? `<span class="code-lang-tag">${safeLang}</span>` : ''}<code>${safeCode}</code></pre>`
      );
      return `___CODE_BLOCK_${index}___`;
    });

    // Étape 2 : Protection et extraction du code inline
    const inlineCodes: string[] = [];
    content = content.replace(/`([^`]+)`/g, (_match, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(`<code class="discord-inline-code">${escapeHtml(code)}</code>`);
      return `___INLINE_CODE_${index}___`;
    });

    // Étape 3 : Échappement HTML général du texte restant
    content = escapeHtml(content);

    // Étape 4 : Citations Discord (>>> Multiligne et > Simple ligne)
    content = content.replace(/^&gt;&gt;&gt;\s*([\s\S]*)$/gm, '<blockquote class="discord-quote multiline">$1</blockquote>');
    content = content.replace(/^&gt;\s*(.*)$/gm, '<blockquote class="discord-quote">$1</blockquote>');

    // Étape 5 : Emojis Discord Personnalisés (<:name:id> et <a:name:id>)
    content = content.replace(
      /(?:&lt;|<)(a?):([a-zA-Z0-9_]+):(\d+)(?:&gt;|>)/g,
      (_match, animated, name, id) => {
        const ext = animated ? 'gif' : 'png';
        return `<img class="discord-custom-emoji" src="https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless" alt=":${name}:" title=":${name}:" referrerpolicy="no-referrer" loading="lazy" />`;
      }
    );

    // Étape 6 : Emojis Personnalisés nommés textuellement (ex: :Obsydemoncouverture:, :Obsybigarrowblue:)
    content = content.replace(/:([a-zA-Z0-9_]{2,32}):/g, (fullMatch, name) => {
      if (Array.isArray(guildEmojis.value) && guildEmojis.value.length > 0) {
        const lowerName = name.toLowerCase();
        const found = guildEmojis.value.find(
          (e: any) => e.name && e.name.toLowerCase() === lowerName
        );
        if (found) {
          const ext = found.animated ? 'gif' : 'png';
          const url = found.url || `https://cdn.discordapp.com/emojis/${found.id}.${ext}?size=48&quality=lossless`;
          return `<img class="discord-custom-emoji" src="${url}" alt=":${found.name}:" title=":${found.name}:" referrerpolicy="no-referrer" loading="lazy" />`;
        }
      }
      return fullMatch;
    });

    // Étape 7 : Mentions de Rôles (<@&1513890607959904422> et &lt;@&amp;id&gt;)
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
        return `<span class="discord-mention discord-mention-role" style="background-color: ${bg}; color: ${col};" title="Rôle ID: ${id}">@${escapeHtml(roleName)}</span>`;
      }
    );

    // Étape 8 : Mentions d'Utilisateurs (<@123456789> ou <@!123456789>)
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

        return `<span class="discord-mention discord-mention-user" title="Utilisateur ID: ${id}">@${escapeHtml(userName)}</span>`;
      }
    );

    // Étape 9 : Mentions de Salons (<#123456789>)
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

        return `<span class="discord-mention discord-mention-channel" title="Salon ID: ${id}">#${escapeHtml(channelName)}</span>`;
      }
    );

    // Étape 10 : Mentions spéciales et génériques (@everyone, @here, @Utilisateur, #salon)
    content = content.replace(/@(everyone|here)\b/gi, '<span class="discord-mention discord-mention-everyone">@$1</span>');
    content = content.replace(/@(Utilisateur)\b/g, '<span class="discord-mention discord-mention-user">@$1</span>');
    content = content.replace(/#([a-zA-Z0-9_\-\u00C0-\u017F]{2,32})\b/g, (fullMatch, chName) => {
      // Vérifier si c'est un nom de salon connu ou le placeholder #salon
      if (chName.toLowerCase() === 'salon' || (Array.isArray(discordChannels.value) && discordChannels.value.some((c: any) => c.name.toLowerCase() === chName.toLowerCase()))) {
        return `<span class="discord-mention discord-mention-channel">#${escapeHtml(chName)}</span>`;
      }
      return fullMatch;
    });

    // Étape 11 : Mise en forme Markdown (Gras, Italique, Souligné, Barré, Spoilers)
    content = content.replace(/\|\|(.*?)\|\|/g, '<span class="discord-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
    content = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    content = content.replace(/__(.*?)__/g, '<u>$1</u>');
    content = content.replace(/~~(.*?)~~/g, '<s>$1</s>');

    // Étape 12 : Liens automatiques HTTP / HTTPS
    content = content.replace(
      /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="discord-link">$1</a>'
    );

    // Étape 13 : Sauts de ligne
    content = content.replace(/\n/g, '<br/>');

    // Étape 14 : Réinjection du code inline et des blocs de code
    inlineCodes.forEach((code, index) => {
      content = content.replace(`___INLINE_CODE_${index}___`, code);
    });

    codeBlocks.forEach((code, index) => {
      content = content.replace(`___CODE_BLOCK_${index}___`, code);
    });

    return content;
  }

  return {
    escapeHtml,
    formatDiscordContent
  };
}
