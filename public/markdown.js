/**
 * Parseur Markdown léger pour Discord
 * Gère le gras, l'italique, le barré, le code, les blocs de code, les spoilers, les mentions, les emojis personnalisés et les liens.
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

    // Convertir les mentions, emojis et markdown en HTML de façon sécurisée (approche par jetons)
    render(text, options = {}) {
        if (!text) return '';

        let html = this.escapeHtml(text);
        const tokens = [];
        const createToken = (htmlReplacement) => {
            const token = `\uFFF0${tokens.length}\uFFF1`;
            tokens.push(htmlReplacement);
            return token;
        };

        // 1. Extraire les blocs de code ```lang ... ```
        html = html.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            const cleanLang = lang ? `<span class="code-lang-tag">${lang}</span>` : '';
            return createToken(`<pre class="discord-code-block">${cleanLang}<code>${code.trim()}</code></pre>`);
        });

        // 2. Extraire le code inline `code`
        html = html.replace(/`([^`]+)`/g, (match, code) => {
            return createToken(`<code class="discord-inline-code">${code}</code>`);
        });

        // 3. Extraire les Emojis personnalisés <:name:id> ou <a:name:id>
        html = html.replace(/&lt;(a)?:([a-zA-Z0-9_]+):(\d+)&gt;/g, (match, animated, name, id) => {
            const ext = animated ? 'gif' : 'png';
            const url = `https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`;
            return createToken(`<img class="discord-custom-emoji" src="${url}" alt=":${name}:" title=":${name}:" loading="lazy">`);
        });

        // 4. Extraire les Mentions d'utilisateurs <@userId> ou <@!userId>
        html = html.replace(/&lt;@!?(\d+)&gt;/g, (match, userId) => {
            const userName = options.usersMap && options.usersMap[userId] ? options.usersMap[userId] : `@${userId}`;
            return createToken(`<span class="discord-mention user-mention" data-user-id="${userId}">${userName}</span>`);
        });

        // 5. Extraire les Mentions de rôles <@&roleId>
        html = html.replace(/&lt;@&amp;(\d+)&gt;/g, (match, roleId) => {
            const roleName = options.rolesMap && options.rolesMap[roleId] ? options.rolesMap[roleId] : `@rôle`;
            return createToken(`<span class="discord-mention role-mention" data-role-id="${roleId}">${roleName}</span>`);
        });

        // 6. Extraire les Mentions de salons <#channelId>
        html = html.replace(/&lt;#(\d+)&gt;/g, (match, channelId) => {
            const chanName = options.channelsMap && options.channelsMap[channelId] ? options.channelsMap[channelId] : `#${channelId}`;
            return createToken(`<span class="discord-mention channel-mention" data-channel-id="${channelId}">#${chanName}</span>`);
        });

        // 7. Spoilers ||spoiler||
        html = html.replace(/\|\|(.*?)\|\|/g, '<span class="discord-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');

        // 8. Gras & Italique ***text***
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');

        // 9. Gras **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 10. Italique *text* ou _text_
        html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // 11. Barré ~~text~~
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // 12. Citations > text
        html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="discord-quote">$1</blockquote>');

        // 13. Liens URL (ne touchera aucun token car les balises <img> / <a> n'ont pas encore été injectées)
        html = html.replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="discord-link">$1</a>');

        // 14. Retours à la ligne
        html = html.replace(/\n/g, '<br>');

        // 15. Réinjecter les jetons HTML
        for (let i = 0; i < tokens.length; i++) {
            html = html.replace(`\uFFF0${i}\uFFF1`, tokens[i]);
        }

        return html;
    }
};

if (typeof window !== 'undefined') {
    window.DiscordMarkdown = DiscordMarkdown;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiscordMarkdown;
}
