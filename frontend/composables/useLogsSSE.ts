import { ref, computed, readonly } from 'vue';
import { useAuth } from './useAuth.ts';

export interface LogEntry {
  id: number;
  time: string;
  level: string;
  module?: string;
  caller?: {
    file?: string;
    path?: string;
    method?: string;
  };
  message: string;
}

const logs = ref<LogEntry[]>([]);
const isConnected = ref(false);
const autoScroll = ref(true);
const levelFilter = ref('ALL');
const moduleFilter = ref('ALL');
const searchQuery = ref('');
let eventSource: EventSource | null = null;
let logIdCounter = 1;

export function useLogsSSE() {
  const { getApiKey } = useAuth();

  async function fetchInitialLogs() {
    try {
      const apiKey = getApiKey();
      const headers: Record<string, string> = {};
      if (apiKey) headers['x-api-key'] = apiKey;
      const res = await fetch('/api/logs?limit=100', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          json.data.forEach((item: any) => addLog(item));
        }
      }
    } catch (e) {
      console.warn('Impossible de charger le buffer initial des logs:', e);
    }
  }

  function startStream() {
    if (eventSource) {
      eventSource.close();
    }

    fetchInitialLogs();

    const apiKey = getApiKey();
    const url = apiKey ? `/api/logs/stream?api_key=${encodeURIComponent(apiKey)}` : '/api/logs/stream';

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        isConnected.value = true;
      };

      const handleLogData = (rawData: string) => {
        try {
          const data = JSON.parse(rawData);
          if (Array.isArray(data)) {
            data.forEach(item => addLog(item));
          } else if (data && typeof data === 'object') {
            addLog(data);
          }
        } catch {
          addLog({
            time: new Date().toLocaleTimeString('fr-FR'),
            level: 'INFO',
            message: rawData
          });
        }
      };

      // Écouteur standard
      eventSource.onmessage = (event) => {
        handleLogData(event.data);
      };

      // Écouteurs pour événements SSE nommés envoyés par le backend
      eventSource.addEventListener('log', (event: any) => {
        handleLogData(event.data);
      });

      eventSource.addEventListener('connected', (event: any) => {
        isConnected.value = true;
      });

      eventSource.addEventListener('clear', () => {
        clearLogs();
      });

      eventSource.onerror = () => {
        isConnected.value = false;
      };
    } catch (err) {
      console.error('Erreur démarrage EventSource logs:', err);
    }
  }

  function stopStream() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    isConnected.value = false;
  }

  function addLog(item: any) {
    const rawTime = item.time || item.timestamp;
    const { parseDateSafe, formatLocalDate } = useDateFormatter();
    const d = parseDateSafe(rawTime) || new Date();
    const timeStr = formatLocalDate(d, { showDate: false, showTime: true, showSeconds: true });

    const entry: LogEntry = {
      id: logIdCounter++,
      time: timeStr,
      level: (item.level || 'INFO').toUpperCase(),
      module: item.module || item.category || 'SYSTEM',
      caller: item.caller || (item.file ? { file: item.file } : undefined),
      message: item.message || (typeof item === 'string' ? item : JSON.stringify(item))
    };

    // Éviter les doublons stricts consécutifs
    const last = logs.value[logs.value.length - 1];
    if (last && last.message === entry.message && last.time === entry.time) {
      return;
    }

    logs.value.push(entry);
    if (logs.value.length > 2000) {
      logs.value.shift();
    }
  }

  function clearLogs() {
    logs.value = [];
  }

  function exportLogs() {
    const text = logs.value
      .map(l => `[${l.time}] [${l.level}] [${l.module || 'SYSTEM'}]${l.caller?.file ? ` [${l.caller.file}]` : ''} ${l.message}`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredLogs = computed(() => {
    const lvl = levelFilter.value;
    const mod = moduleFilter.value;
    const query = searchQuery.value.toLowerCase().trim();

    return logs.value.filter(l => {
      const matchLevel = lvl === 'ALL' || l.level === lvl;
      
      let matchModule = true;
      if (mod !== 'ALL') {
        const logMod = (l.module || '').toUpperCase();
        if (mod === 'CAPTCHA') matchModule = logMod === 'CAPTCHA' || logMod === 'SECURITY_QUESTION' || logMod === 'SECURITYQUESTION';
        else if (mod === 'BUMP') matchModule = logMod === 'BUMP' || logMod === 'BUMP_REMINDER';
        else if (mod === 'DAILY') matchModule = logMod === 'DAILY' || logMod === 'DAILY_MESSAGE' || logMod === 'AI';
        else if (mod === 'XP') matchModule = logMod === 'XP' || logMod === 'XP_LEVEL' || logMod === 'LEVEL';
        else if (mod === 'COUNTDOWN') matchModule = logMod === 'COUNTDOWN';
        else if (mod === 'INFINITE') matchModule = logMod === 'INFINITE' || logMod === 'ROAD_TO_INFINITE' || logMod === 'COUNTER';
        else if (mod === 'WELCOME') matchModule = logMod === 'WELCOME';
        else if (mod === 'STARTUP') matchModule = logMod === 'STARTUP' || logMod === 'STARTUP_NOTIFIER';
        else if (mod === 'DISCORD') matchModule = logMod === 'DISCORD' || logMod === 'DISCORD_CACHE';
        else if (mod === 'API') matchModule = logMod === 'API' || logMod === 'WEB' || logMod === 'WEB_API';
        else if (mod === 'DATABASE') matchModule = logMod === 'DATABASE' || logMod === 'DB' || logMod === 'DRIZZLE';
        else if (mod === 'SCHEDULER') matchModule = logMod === 'SCHEDULER' || logMod === 'CRON';
        else if (mod === 'EVENT') matchModule = logMod === 'EVENT' || logMod === 'EVENT_BUS';
        else if (mod === 'CONFIG') matchModule = logMod === 'CONFIG';
        else matchModule = logMod === mod;
      }

      const matchQuery = !query || 
        l.message.toLowerCase().includes(query) || 
        (l.module && l.module.toLowerCase().includes(query)) ||
        l.level.toLowerCase().includes(query);

      return matchLevel && matchModule && matchQuery;
    });
  });

  return {
    logs: readonly(logs),
    filteredLogs,
    isConnected: readonly(isConnected),
    autoScroll,
    levelFilter,
    moduleFilter,
    searchQuery,
    startStream,
    stopStream,
    clearLogs,
    exportLogs
  };
}
