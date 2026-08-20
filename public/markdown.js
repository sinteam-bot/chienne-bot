/**
 * Parseur Markdown léger pour Discord
 * Gère le gras, l'italique, le barré, le code, les blocs de code, les spoilers, les mentions et les liens.
 */

const DiscordMarkdown = {
    // Fonction principale d'échappement HTML pour éviter les failles XSS
    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Convertir les mentions et le markdown en HTML
    render(text, options = {}) {
        if (!text) return '';

        let html = this.escapeHtml(text);

        // Blocs de code ```lang ... ```
        html = html.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            const cleanLang = lang ? `<span class="code-lang-tag">${lang}</span>` : '';
            return `<pre class="discord-code-block">${cleanLang}<code>${code.trim()}</code></pre>`;
        });

        // Code inline `code`
        html = html.replace(/`([^`]+)`/g, '<code class="discord-inline-code">$1</code>');

        // Spoilers ||spoiler||
        html = html.replace(/\|\|(.*?)\|\|/g, '<span class="discord-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');

        // Gras & Italique ***text***
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');

        // Gras **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italique *text* ou _text_
        html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Barré ~~text~~
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Citations > text
        html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="discord-quote">$1</blockquote>');

        // Mentions d'utilisateurs <@userId> ou <@!userId>
        html = html.replace(/&lt;@!?(\d+)&gt;/g, (match, userId) => {
            const userName = options.usersMap && options.usersMap[userId] ? options.usersMap[userId] : `@${userId}`;
            return `<span class="discord-mention user-mention" data-user-id="${userId}">${userName}</span>`;
        });

        // Mentions de rôles <@&roleId>
        html = html.replace(/&lt;@&amp;(\d+)&gt;/g, (match, roleId) => {
            const roleName = options.rolesMap && options.rolesMap[roleId] ? options.rolesMap[roleId] : `@rôle`;
            return `<span class="discord-mention role-mention" data-role-id="${roleId}">${roleName}</span>`;
        });

        // Mentions de salons <#channelId>
        html = html.replace(/&lt;#(\d+)&gt;/g, (match, channelId) => {
            const chanName = options.channelsMap && options.channelsMap[channelId] ? options.channelsMap[channelId] : `#${channelId}`;
            return `<span class="discord-mention channel-mention" data-channel-id="${channelId}">#${chanName}</span>`;
        });

        // Emojis personnalisés <:name:id> ou <a:name:id>
        html = html.replace(/&lt;(a)?:([a-zA-Z0-9_]+):(\d+)&gt;/g, (match, animated, name, id) => {
            const ext = animated ? 'gif' : 'png';
            const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`;
            return `<img class="discord-custom-emoji" src="${url}" alt=":${name}:" title=":${name}:">`;
        });

        // Liens URL
        html = html.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="discord-link">$1</a>');

        // Retours à la ligne
        html = html.replace(/\n/g, '<br>');

        return html;
    }
};

window.DiscordMarkdown = DiscordMarkdown;
