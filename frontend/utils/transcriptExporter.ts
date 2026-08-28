/**
 * Utilitaire d'export de transcripts Discord (HTML interactif ou JSON)
 */

export interface TranscriptMessage {
  id?: string;
  author_id?: string;
  author_tag?: string;
  author_avatar?: string;
  is_staff?: boolean;
  content?: string;
  embeds?: any[];
  created_at: number | string | Date;
}

export interface TranscriptMetadata {
  title: string;
  channelName?: string;
  category?: string;
  guildName?: string;
  exportedAt?: Date;
  totalMessages?: number;
  participants?: string[];
}

/**
 * Génère un fichier HTML complet et autonome reprenant le design Discord
 */
export function generateHtmlTranscript(
  metadata: TranscriptMetadata,
  messages: TranscriptMessage[]
): string {
  const exportDate = (metadata.exportedAt || new Date()).toLocaleString('fr-FR');
  const title = escapeHtml(metadata.title || 'Transcript Discord');

  const renderedMessages = messages.map(m => {
    const author = escapeHtml(m.author_tag || m.author_id || 'Utilisateur');
    const authorId = m.author_id ? escapeHtml(m.author_id) : '';
    const dateStr = new Date(m.created_at).toLocaleString('fr-FR');
    const content = escapeHtml(m.content || '').replace(/\n/g, '<br>');
    const avatar = m.author_avatar || `https://cdn.discordapp.com/embed/avatars/${(parseInt(m.author_id || '0', 10) % 5) || 0}.png`;
    const staffBadge = m.is_staff ? `<span class="badge staff">STAFF</span>` : '';

    return `
      <div class="message ${m.is_staff ? 'is-staff' : ''}">
        <img class="avatar" src="${avatar}" alt="${author}" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
        <div class="message-content">
          <div class="message-header">
            <span class="author">${author}</span>
            ${staffBadge}
            <span class="timestamp">${dateStr}</span>
            ${authorId ? `<span class="author-id">ID: ${authorId}</span>` : ''}
          </div>
          <div class="text">${content || '<em>(aucun contenu textuel)</em>'}</div>
        </div>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title} · Transcript</title>
  <style>
    :root {
      --bg-primary: #313338;
      --bg-secondary: #2b2d31;
      --bg-tertiary: #1e1f22;
      --text-normal: #dbdee1;
      --text-muted: #949ba4;
      --text-header: #f2f3f5;
      --accent: #5865f2;
      --border: #3f4147;
      --success: #57f287;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-normal);
      padding: 32px 16px;
      line-height: 1.4;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .header {
      background: var(--bg-tertiary);
      padding: 24px;
      border-bottom: 1px solid var(--border);
    }
    .header h1 {
      color: var(--text-header);
      font-size: 20px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header .meta {
      color: var(--text-muted);
      font-size: 13px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .messages {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message {
      display: flex;
      gap: 16px;
      padding: 6px 8px;
      border-radius: 4px;
      transition: background 0.1s ease;
    }
    .message:hover {
      background: rgba(255,255,255,0.02);
    }
    .message.is-staff {
      background: rgba(88, 101, 242, 0.05);
      border-left: 2px solid var(--accent);
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      flex-shrink: 0;
    }
    .message-content {
      flex: 1;
      min-width: 0;
    }
    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .author {
      color: var(--text-header);
      font-weight: 600;
      font-size: 15px;
    }
    .badge.staff {
      background: var(--accent);
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 1px 4px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .timestamp {
      color: var(--text-muted);
      font-size: 12px;
    }
    .author-id {
      color: var(--text-muted);
      font-size: 11px;
      font-family: monospace;
      opacity: 0.7;
    }
    .text {
      color: var(--text-normal);
      font-size: 14px;
      word-break: break-word;
    }
    .footer {
      background: var(--bg-tertiary);
      padding: 12px 24px;
      font-size: 12px;
      color: var(--text-muted);
      text-align: right;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 ${title}</h1>
      <div class="meta">
        ${metadata.category ? `<span>Catégorie: <strong>${escapeHtml(metadata.category)}</strong></span>` : ''}
        ${metadata.channelName ? `<span>Salon: <strong>#${escapeHtml(metadata.channelName)}</strong></span>` : ''}
        <span>Exporté le: <strong>${exportDate}</strong></span>
        <span>Total: <strong>${messages.length} message(s)</strong></span>
      </div>
    </div>
    <div class="messages">
      ${renderedMessages || '<div style="color: var(--text-muted); text-align: center;">Aucun message dans ce transcript.</div>'}
    </div>
    <div class="footer">
      Généré par Bot · Dashboard
    </div>
  </div>
</body>
</html>`;
}

/**
 * Télécharge un fichier dans le navigateur de l'utilisateur
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
