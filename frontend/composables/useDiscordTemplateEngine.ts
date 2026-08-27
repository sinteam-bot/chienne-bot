import { ref, computed } from 'vue';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedAuthor {
  name?: string;
  icon_url?: string;
  iconUrl?: string;
  url?: string;
}

export interface DiscordEmbedFooter {
  text?: string;
  icon_url?: string;
  iconUrl?: string;
}

export interface DiscordEmbedTemplate {
  title?: string;
  description?: string;
  url?: string;
  color?: string | number;
  timestamp?: boolean | string;
  thumbnail?: string | { url: string };
  image?: string | { url: string };
  author?: DiscordEmbedAuthor;
  footer?: DiscordEmbedFooter;
  fields?: DiscordEmbedField[];
}

export interface DiscordMessageTemplate {
  content?: string;
  embed?: DiscordEmbedTemplate;
  embeds?: DiscordEmbedTemplate[];
}

export interface CompiledDiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  thumbnail?: { url: string };
  image?: { url: string };
  author?: DiscordEmbedAuthor;
  footer?: DiscordEmbedFooter;
  fields?: DiscordEmbedField[];
}

export interface CompiledDiscordMessage {
  content: string;
  embeds: CompiledDiscordEmbed[];
}

export function useDiscordTemplateEngine() {
  const defaultFilters: Record<string, Function> = {
    upper: (val: any) => String(val ?? '').toUpperCase(),
    uppercase: (val: any) => String(val ?? '').toUpperCase(),
    lower: (val: any) => String(val ?? '').toLowerCase(),
    lowercase: (val: any) => String(val ?? '').toLowerCase(),
    capitalize: (val: any) => {
      const str = String(val ?? '');
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    trim: (val: any) => String(val ?? '').trim(),
    default: (val: any, fallback = '') => (val !== undefined && val !== null && val !== '') ? val : fallback,
    truncate: (val: any, length = 30, suffix = '...') => {
      const str = String(val ?? '');
      return str.length > length ? str.slice(0, length) + suffix : str;
    },
    replace: (val: any, search = '', replacement = '') => {
      return String(val ?? '').split(search).join(replacement);
    },

    // Styles Discord
    bold: (val: any) => val ? `**${val}**` : '',
    italic: (val: any) => val ? `*${val}*` : '',
    underline: (val: any) => val ? `__${val}__` : '',
    strikethrough: (val: any) => val ? `~~${val}~~` : '',
    spoiler: (val: any) => val ? `||${val}||` : '',
    code: (val: any) => val ? `\`${val}\`` : '',
    codeblock: (val: any, lang = '') => val ? `\`\`\`${lang}\n${val}\n\`\`\`` : '',
    quote: (val: any) => val ? String(val).split('\n').map(l => `> ${l}`).join('\n') : '',

    // Mentions Discord
    usermention: (val: any) => val ? `<@${String(val).replace(/[^0-9]/g, '')}>` : '',
    channelmention: (val: any) => val ? `<#${String(val).replace(/[^0-9]/g, '')}>` : '',
    rolemention: (val: any) => val ? `<@&${String(val).replace(/[^0-9]/g, '')}>` : '',
    emoji: (nameOrId: any, id?: any) => {
      if (!nameOrId) return '';
      if (id) return `<:${nameOrId}:${id}>`;
      if (typeof nameOrId === 'string' && nameOrId.startsWith('<:') && nameOrId.endsWith('>')) return nameOrId;
      return nameOrId;
    },

    // Nombres
    number: (val: any, decimals = 0, sep = ' ') => {
      const num = Number(val);
      if (isNaN(num)) return val;
      const parts = num.toFixed(decimals).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
      return parts.join(',');
    },
    round: (val: any, precision = 0) => {
      const num = Number(val);
      if (isNaN(num)) return val;
      const factor = Math.pow(10, precision);
      return Math.round(num * factor) / factor;
    },
    abs: (val: any) => Math.abs(Number(val) || 0),

    // Tableaux
    join: (val: any, sep = ', ') => Array.isArray(val) ? val.join(sep) : String(val ?? ''),
    first: (val: any) => Array.isArray(val) ? val[0] : (typeof val === 'string' ? val[0] : val),
    last: (val: any) => Array.isArray(val) ? val[val.length - 1] : (typeof val === 'string' ? val[val.length - 1] : val),
    length: (val: any) => Array.isArray(val) || typeof val === 'string' ? val.length : (val && typeof val === 'object' ? Object.keys(val).length : 0),
    slice: (val: any, start = 0, end?: number) => Array.isArray(val) || typeof val === 'string' ? val.slice(start, end) : val,
    reverse: (val: any) => Array.isArray(val) ? [...val].reverse() : val,

    // Dates
    date: (val: any, format = 'DD/MM/YYYY HH:mm') => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const pad = (n: number) => String(n).padStart(2, '0');
      const map: Record<string, string | number> = {
        'YYYY': d.getFullYear(),
        'YY': String(d.getFullYear()).slice(-2),
        'MM': pad(d.getMonth() + 1),
        'DD': pad(d.getDate()),
        'HH': pad(d.getHours()),
        'mm': pad(d.getMinutes()),
        'ss': pad(d.getSeconds())
      };

      let res = format;
      for (const [key, v] of Object.entries(map)) {
        res = res.replace(new RegExp(key, 'g'), String(v));
      }
      return res;
    },
    discordtimestamp: (val: any, style = 'R') => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const unix = Math.floor(d.getTime() / 1000);
      return `<t:${unix}:${style}>`;
    },
    timeago: (val: any) => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const now = Date.now();
      const diffSec = Math.floor((now - d.getTime()) / 1000);

      if (diffSec < 0) {
        const absSec = Math.abs(diffSec);
        if (absSec < 60) return `dans ${absSec}s`;
        if (absSec < 3600) return `dans ${Math.floor(absSec / 60)} min`;
        if (absSec < 86400) return `dans ${Math.floor(absSec / 3600)}h`;
        return `dans ${Math.floor(absSec / 86400)}j`;
      }

      if (diffSec < 60) return "à l'instant";
      if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `il y a ${Math.floor(diffSec / 3600)}h`;
      if (diffSec < 2592000) return `il y a ${Math.floor(diffSec / 86400)}j`;
      return `il y a ${Math.floor(diffSec / 2592000)} mois`;
    }
  };

  function resolvePath(path: string, context: any): any {
    if (!path || context === undefined || context === null) return undefined;
    const cleanPath = path.trim();

    if (cleanPath === 'true') return true;
    if (cleanPath === 'false') return false;
    if (cleanPath === 'null') return null;
    if (cleanPath === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(cleanPath)) return Number(cleanPath);
    if ((cleanPath.startsWith('"') && cleanPath.endsWith('"')) || (cleanPath.startsWith("'") && cleanPath.endsWith("'"))) {
      return cleanPath.slice(1, -1);
    }

    const parts = cleanPath
      .replace(/\[(\w+)\]/g, '.$1')
      .replace(/\["([^"]+)"\]/g, '.$1')
      .replace(/\['([^']+)'\]/g, '.$1')
      .split('.');

    let current = context;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  function evaluateCondition(expr: string, context: any): boolean {
    if (!expr) return false;
    const cleanExpr = expr.trim();

    if (cleanExpr.startsWith('!') || cleanExpr.toLowerCase().startsWith('not ')) {
      const sub = cleanExpr.startsWith('!') ? cleanExpr.slice(1) : cleanExpr.slice(4);
      return !evaluateCondition(sub, context);
    }

    if (cleanExpr.includes('&&') || /\band\b/i.test(cleanExpr)) {
      const subParts = cleanExpr.split(/&&|\band\b/i);
      return subParts.every(p => evaluateCondition(p, context));
    }

    if (cleanExpr.includes('||') || /\bor\b/i.test(cleanExpr)) {
      const subParts = cleanExpr.split(/\|\||\bor\b/i);
      return subParts.some(p => evaluateCondition(p, context));
    }

    const compRegex = /^(.+?)\s*(===|==|!==|!=|>=|<=|>|<|\bin\b)\s*(.+)$/;
    const match = cleanExpr.match(compRegex);

    if (match) {
      const left = resolvePath(match[1], context);
      const op = match[2].trim().toLowerCase();
      const right = resolvePath(match[3], context);

      switch (op) {
        case '==':
        case '===':
          return left == right;
        case '!=':
        case '!==':
          return left != right;
        case '>':
          return Number(left) > Number(right);
        case '<':
          return Number(left) < Number(right);
        case '>=':
          return Number(left) >= Number(right);
        case '<=':
          return Number(left) <= Number(right);
        case 'in':
          if (Array.isArray(right)) return right.includes(left);
          if (typeof right === 'string') return right.includes(String(left));
          if (right && typeof right === 'object') return left in right;
          return false;
      }
    }

    const val = resolvePath(cleanExpr, context);
    return Boolean(val && (!Array.isArray(val) || val.length > 0));
  }

  function parseArgs(argsStr: string, context: any): any[] {
    const args: any[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      if ((char === '"' || char === "'") && (i === 0 || argsStr[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        }
        current += char;
      } else if (char === ',' && !inQuotes) {
        args.push(resolvePath(current.trim(), context));
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(resolvePath(current.trim(), context));
    }

    return args;
  }

  function evaluateExpression(expr: string, context: any): any {
    if (!expr) return '';
    const parts = expr.split('|').map(p => p.trim());
    const varPath = parts[0];
    let value = resolvePath(varPath, context);

    for (let i = 1; i < parts.length; i++) {
      const filterCall = parts[i];
      const callMatch = filterCall.match(/^([a-zA-Z0-9_-]+)(?:\((.*)\))?$/);
      if (!callMatch) continue;

      const filterName = callMatch[1].toLowerCase();
      const filterFn = defaultFilters[filterName];

      if (typeof filterFn === 'function') {
        const rawArgs = callMatch[2] ? parseArgs(callMatch[2], context) : [];
        value = filterFn(value, ...rawArgs);
      }
    }

    return value !== undefined && value !== null ? value : '';
  }

  function normalizeTemplate(template: string): string {
    if (!template || typeof template !== 'string') return '';

    let res = template;
    res = res.replace(/\{\{#if\s+([^}]+)\}\}/g, '{% if $1 %}');
    res = res.replace(/\{\{else\}\}/g, '{% else %}');
    res = res.replace(/\{\{\/if\}\}/g, '{% endif %}');

    res = res.replace(/\{\{#each\s+([^\s}]+)(?:\s+as\s+([^\s}]+))?\}\}/g, (match, list, item) => {
      const itemName = item || 'this';
      return `{% for ${itemName} in ${list} %}`;
    });
    res = res.replace(/\{\{\/each\}\}/g, '{% endfor %}');

    return res;
  }

  function renderBlock(content: string, context: any): string {
    let output = content;

    // Boucles
    const forLoopRegex = /\{%\s*for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_.[\]]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g;
    output = output.replace(forLoopRegex, (match, itemVar, listPath, body) => {
      const list = resolvePath(listPath, context);
      if (!Array.isArray(list) || list.length === 0) return '';

      return list.map((item, index) => {
        const itemContext = {
          ...context,
          [itemVar]: item,
          this: item,
          loop: {
            index: index + 1,
            index0: index,
            first: index === 0,
            last: index === list.length - 1,
            length: list.length,
            even: index % 2 === 0,
            odd: index % 2 !== 0
          }
        };
        return renderBlock(body, itemContext);
      }).join('');
    });

    // Conditions
    const ifBlockRegex = /\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g;
    output = output.replace(ifBlockRegex, (match, initialCond, fullBody) => {
      const branches: { cond: string; body: string }[] = [];
      const parts = fullBody.split(/\{%\s*(elif|else)\s*([^%]*)\s*%\}/);

      branches.push({ cond: initialCond, body: parts[0] });

      for (let i = 1; i < parts.length; i += 3) {
        const type = parts[i];
        const cond = type === 'elif' ? parts[i + 1] : 'true';
        const body = parts[i + 2] || '';
        branches.push({ cond, body });
      }

      for (const branch of branches) {
        if (evaluateCondition(branch.cond, context)) {
          return renderBlock(branch.body, context);
        }
      }

      return '';
    });

    // Interpolation
    const varRegex = /\{\{\s*([^}]+)\s*\}\}/g;
    output = output.replace(varRegex, (match, expr) => {
      const res = evaluateExpression(expr, context);
      return res !== undefined && res !== null ? String(res) : '';
    });

    return output;
  }

  function render(template: string, context: any = {}): string {
    if (!template || typeof template !== 'string') return '';
    const normalized = normalizeTemplate(template);
    return renderBlock(normalized, context);
  }

  function resolveColor(color: any): number | null {
    if (!color) return null;
    if (typeof color === 'number') return color;

    const colorStr = String(color).trim();
    const namedColors: Record<string, number> = {
      'BLURPLE': 0x5865F2,
      'GREEN': 0x57F287,
      'YELLOW': 0xFEE75C,
      'FUCHSIA': 0xEB459E,
      'RED': 0xED4245,
      'WHITE': 0xFFFFFF,
      'BLACK': 0x000000,
      'NAVY': 0x34495E,
      'GOLD': 0xF1C40F,
      'ORANGE': 0xE67E22,
      'PURPLE': 0x9B59B6,
      'AQUA': 0x1ABC9C,
      'DARK_BUT_NOT_BLACK': 0x2C2F33
    };

    const upperName = colorStr.toUpperCase();
    if (namedColors[upperName]) return namedColors[upperName];

    const cleanHex = colorStr.replace(/^#|^0x/, '');
    if (/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
      return parseInt(cleanHex, 16);
    }

    return null;
  }

  function renderDiscordMessage(templateConfig: any, context: any = {}): CompiledDiscordMessage {
    if (!templateConfig) return { content: '', embeds: [] };

    if (typeof templateConfig === 'string') {
      return {
        content: render(templateConfig, context),
        embeds: []
      };
    }

    const result: CompiledDiscordMessage = {
      content: render(templateConfig.content || '', context).trim(),
      embeds: []
    };

    const rawEmbeds = templateConfig.embeds || (templateConfig.embed ? [templateConfig.embed] : []);

    for (const rawEmbed of rawEmbeds) {
      if (!rawEmbed || typeof rawEmbed !== 'object') continue;

      const embed: CompiledDiscordEmbed = {};

      if (rawEmbed.title) embed.title = render(rawEmbed.title, context).trim();
      if (rawEmbed.url) embed.url = render(rawEmbed.url, context).trim();
      if (rawEmbed.description) embed.description = render(rawEmbed.description, context).trim();

      if (rawEmbed.color) {
        const evaluatedColor = render(String(rawEmbed.color), context).trim();
        const resolvedColor = resolveColor(evaluatedColor);
        if (resolvedColor !== null) embed.color = resolvedColor;
      }

      if (rawEmbed.timestamp) {
        if (rawEmbed.timestamp === true || rawEmbed.timestamp === 'now' || rawEmbed.timestamp === '{{ now }}') {
          embed.timestamp = new Date().toISOString();
        } else {
          const parsedTs = render(String(rawEmbed.timestamp), context).trim();
          const d = new Date(parsedTs);
          embed.timestamp = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        }
      }

      if (rawEmbed.author) {
        const author: DiscordEmbedAuthor = {};
        if (rawEmbed.author.name) author.name = render(rawEmbed.author.name, context).trim();
        if (rawEmbed.author.icon_url || rawEmbed.author.iconUrl) {
          author.icon_url = render(rawEmbed.author.icon_url || rawEmbed.author.iconUrl, context).trim();
        }
        if (rawEmbed.author.url) author.url = render(rawEmbed.author.url, context).trim();
        if (author.name) embed.author = author;
      }

      if (rawEmbed.footer) {
        const footer: DiscordEmbedFooter = {};
        if (rawEmbed.footer.text) footer.text = render(rawEmbed.footer.text, context).trim();
        if (rawEmbed.footer.icon_url || rawEmbed.footer.iconUrl) {
          footer.icon_url = render(rawEmbed.footer.icon_url || rawEmbed.footer.iconUrl, context).trim();
        }
        if (footer.text) embed.footer = footer;
      }

      if (rawEmbed.image) {
        const imgUrl = typeof rawEmbed.image === 'string' ? rawEmbed.image : (rawEmbed.image.url || '');
        const renderedUrl = render(imgUrl, context).trim();
        if (renderedUrl) embed.image = { url: renderedUrl };
      }

      if (rawEmbed.thumbnail) {
        const thumbUrl = typeof rawEmbed.thumbnail === 'string' ? rawEmbed.thumbnail : (rawEmbed.thumbnail.url || '');
        const renderedUrl = render(thumbUrl, context).trim();
        if (renderedUrl) embed.thumbnail = { url: renderedUrl };
      }

      if (Array.isArray(rawEmbed.fields) && rawEmbed.fields.length > 0) {
        embed.fields = [];
        for (const field of rawEmbed.fields) {
          const name = render(field.name || '', context).trim();
          const value = render(field.value || '', context).trim();
          if (name && value) {
            embed.fields.push({
              name,
              value,
              inline: Boolean(field.inline)
            });
          }
        }
      }

      if (
        embed.title ||
        embed.description ||
        (embed.fields && embed.fields.length > 0) ||
        embed.image ||
        embed.thumbnail ||
        embed.author ||
        embed.footer
      ) {
        result.embeds.push(embed);
      }
    }

    return result;
  }

  return {
    render,
    renderDiscordMessage,
    resolveColor
  };
}
