import { ref, computed, readonly } from 'vue';
import { useAuth } from './useAuth.ts';

export interface LogEntry {
  id: number;
  time: string;
  level: string;
  module?: string;
  message: string;
}

const logs = ref<LogEntry[]>([]);
const isConnected = ref(false);
const autoScroll = ref(true);
const levelFilter = ref('ALL');
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
    let timeStr = item.time || item.timestamp;
    if (!timeStr) {
      timeStr = new Date().toLocaleTimeString('fr-FR');
    } else if (timeStr.includes('T') || timeStr.includes('-')) {
      try {
        timeStr = new Date(timeStr).toLocaleTimeString('fr-FR');
      } catch {
        // garder timeStr
      }
    }

    const entry: LogEntry = {
      id: logIdCounter++,
      time: timeStr,
      level: (item.level || 'INFO').toUpperCase(),
      module: item.module || item.category || '',
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
      .map(l => `[${l.time}] [${l.level}] ${l.module ? `[${l.module}] ` : ''}${l.message}`)
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
    const filter = levelFilter.value;
    const query = searchQuery.value.toLowerCase().trim();

    return logs.value.filter(l => {
      const matchLevel = filter === 'ALL' || l.level === filter || l.module === filter;
      const matchQuery = !query || l.message.toLowerCase().includes(query) || (l.module && l.module.toLowerCase().includes(query));
      return matchLevel && matchQuery;
    });
  });

  return {
    logs: readonly(logs),
    filteredLogs,
    isConnected: readonly(isConnected),
    autoScroll,
    levelFilter,
    searchQuery,
    startStream,
    stopStream,
    clearLogs,
    exportLogs
  };
}
