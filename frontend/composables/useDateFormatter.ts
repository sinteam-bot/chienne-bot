/**
 * Composable de formatage et parsing universel des dates Discord / Bot
 * - Convertit de manière fiable les chaînes UTC (SQLite, PostgreSQL, ISO) en heure locale du navigateur.
 * - Fournit un formatage relatif en français ("il y a 5 min", "il y a 2 heures", "il y a 3 jours", etc.).
 * - Gère les timestamps numériques (secondes Discord vs millisecondes JS).
 */

export function useDateFormatter() {
  /**
   * Parse une valeur de date de manière sécurisée en objet Date JS.
   * Gère les formats SQLite "YYYY-MM-DD HH:MM:SS" stockés en UTC sans 'Z'.
   */
  function parseDateSafe(val: any): Date | null {
    if (val === null || val === undefined || val === '') {
      return null;
    }

    if (val instanceof Date) {
      return !isNaN(val.getTime()) ? val : null;
    }

    // Timestamp numérique (en secondes ou ms)
    if (typeof val === 'number') {
      if (isNaN(val) || val <= 0) return null;
      // Timestamp unix en secondes (10 chiffres)
      const ms = val < 10000000000 ? val * 1000 : val;
      const d = new Date(ms);
      return !isNaN(d.getTime()) ? d : null;
    }

    if (typeof val === 'string') {
      let str = val.trim();
      if (!str) return null;

      // Si chaîne numérique pure (ex: "1724765936" ou "1724765936000")
      if (/^\d{10,13}$/.test(str)) {
        const num = parseInt(str, 10);
        const ms = num < 10000000000 ? num * 1000 : num;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d;
      }

      // Format standard SQLite / DB "YYYY-MM-DD HH:MM:SS" (sans fuseau, stocké en UTC)
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
        str = str.replace(' ', 'T') + 'Z';
      }
      // Format ISO sans fuseau horaire explicite "YYYY-MM-DDTHH:MM:SS"
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
        str = str + 'Z';
      }
      // Format date française "DD/MM/YYYY HH:MM:SS"
      else if (/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/.test(str)) {
        const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?$/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1;
          const year = parseInt(match[3], 10);
          const hour = match[4] ? parseInt(match[4], 10) : 0;
          const minute = match[5] ? parseInt(match[5], 10) : 0;
          const second = match[6] ? parseInt(match[6], 10) : 0;
          const d = new Date(year, month, day, hour, minute, second);
          if (!isNaN(d.getTime())) return d;
        }
      }

      const d = new Date(str);
      return !isNaN(d.getTime()) ? d : null;
    }

    return null;
  }

  /**
   * Formate la date en chaîne locale du navigateur (ex: "27/08/2026 17:18:56")
   */
  function formatLocalDate(
    val: any,
    options: {
      showSeconds?: boolean;
      showDate?: boolean;
      showTime?: boolean;
      fallback?: string;
    } = {}
  ): string {
    const d = parseDateSafe(val);
    if (!d) return options.fallback ?? '—';

    const {
      showSeconds = true,
      showDate = true,
      showTime = true
    } = options;

    const dtOptions: Intl.DateTimeFormatOptions = {};

    if (showDate) {
      dtOptions.day = '2-digit';
      dtOptions.month = '2-digit';
      dtOptions.year = 'numeric';
    }

    if (showTime) {
      dtOptions.hour = '2-digit';
      dtOptions.minute = '2-digit';
      if (showSeconds) {
        dtOptions.second = '2-digit';
      }
    }

    try {
      return d.toLocaleString(undefined, dtOptions);
    } catch {
      return d.toLocaleString('fr-FR', dtOptions);
    }
  }

  /**
   * Formate en date complète rédigée en français : "Jeudi 27 août 2026 à 17:18:56"
   */
  function getFullLocalizedDateTime(val: any, fallback = '—'): string {
    const d = parseDateSafe(val);
    if (!d) return fallback;

    try {
      const datePart = d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const timePart = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      // Capitalize first letter of weekday
      const capDate = datePart.charAt(0).toUpperCase() + datePart.slice(1);
      return `${capDate} à ${timePart}`;
    } catch {
      return formatLocalDate(d);
    }
  }

  /**
   * Formate la date en temps relatif ("il y a X minutes", "il y a 2 heures", etc.)
   */
  function formatTimeAgo(val: any, options: { fallback?: string; detailed?: boolean } = {}): string {
    const d = parseDateSafe(val);
    if (!d) return options.fallback ?? '—';

    const now = Date.now();
    const diffMs = now - d.getTime();
    const isFuture = diffMs < 0;
    const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);

    if (absDiffSec < 10) {
      return isFuture ? "dans un instant" : "à l'instant";
    }

    if (absDiffSec < 60) {
      const unit = absDiffSec === 1 ? 'seconde' : 'secondes';
      return isFuture ? `dans ${absDiffSec} ${unit}` : `il y a ${absDiffSec} ${unit}`;
    }

    const absDiffMin = Math.floor(absDiffSec / 60);
    if (absDiffMin < 60) {
      const unit = absDiffMin === 1 ? 'minute' : 'minutes';
      const short = options.detailed ? `${absDiffMin} ${unit}` : `${absDiffMin} min`;
      return isFuture ? `dans ${short}` : `il y a ${short}`;
    }

    const absDiffHours = Math.floor(absDiffMin / 60);
    if (absDiffHours < 24) {
      const unit = absDiffHours === 1 ? 'heure' : 'heures';
      const short = options.detailed ? `${absDiffHours} ${unit}` : `${absDiffHours} h`;
      return isFuture ? `dans ${short}` : `il y a ${short}`;
    }

    const absDiffDays = Math.floor(absDiffHours / 24);
    if (absDiffDays < 30) {
      const unit = absDiffDays === 1 ? 'jour' : 'jours';
      const short = options.detailed ? `${absDiffDays} ${unit}` : `${absDiffDays} j`;
      return isFuture ? `dans ${short}` : `il y a ${short}`;
    }

    const absDiffMonths = Math.floor(absDiffDays / 30);
    if (absDiffMonths < 12) {
      const unit = 'mois';
      const short = `${absDiffMonths} ${unit}`;
      return isFuture ? `dans ${short}` : `il y a ${short}`;
    }

    const absDiffYears = Math.floor(absDiffDays / 365);
    const unit = absDiffYears === 1 ? 'an' : 'ans';
    const short = `${absDiffYears} ${unit}`;
    return isFuture ? `dans ${short}` : `il y a ${short}`;
  }

  /**
   * Retourne la date complète avec le temps relatif :
   * "27/08/2026 17:18:56 (il y a 5 min)"
   */
  function formatDateWithRelative(val: any, options: { showSeconds?: boolean } = {}): string {
    const d = parseDateSafe(val);
    if (!d) return '—';

    const localStr = formatLocalDate(d, options);
    const agoStr = formatTimeAgo(d);
    return `${localStr} (${agoStr})`;
  }

  /**
   * Retourne le nom du fuseau horaire du navigateur
   */
  function getBrowserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  }

  /**
   * Retourne un tooltip complet avec l'heure locale et l'heure UTC
   */
  function getDateTooltip(val: any): string {
    const d = parseDateSafe(val);
    if (!d) return '';

    const fullLocal = getFullLocalizedDateTime(d);
    const agoStr = formatTimeAgo(d, { detailed: true });
    const utcStr = d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
    const tz = getBrowserTimezone();

    return `📅 ${fullLocal} (${tz})\n⏳ ${agoStr}\n🌐 ${utcStr}`;
  }

  return {
    parseDateSafe,
    formatLocalDate,
    getFullLocalizedDateTime,
    formatTimeAgo,
    formatDateWithRelative,
    getBrowserTimezone,
    getDateTooltip
  };
}
