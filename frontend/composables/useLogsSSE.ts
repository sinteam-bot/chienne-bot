import { useAuth } from './useAuth';

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

  function startStream() {
    if (eventSource) {
      eventSource.close();
    }

    const apiKey = getApiKey();
    const url = apiKey ? `/api/logs/stream?api_key=${encodeURIComponent(apiKey)}` : '/api/logs/stream';

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        isConnected.value = true;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            // Buffer initial
            data.forEach(item => addLog(item));
          } else if (data && typeof data === 'object') {
            addLog(data);
          }
        } catch {
          addLog({
            time: new Date().toLocaleTimeString('fr-FR'),
            level: 'INFO',
            message: event.data
          });
        }
      };

      eventSource.onerror = () => {
        isConnected.value = false;
        // EventSource tente automatiquement la reconnexion
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
    const entry: LogEntry = {
      id: logIdCounter++,
      time: item.time || new Date().toLocaleTimeString('fr-FR'),
      level: (item.level || 'INFO').toUpperCase(),
      module: item.module || '',
      message: item.message || JSON.stringify(item)
    };

    logs.value.push(entry);
    if (logs.value.length > 2000) {
      logs.value.shift();
    }
  }

  function clearLogs() {
    logs.value = [];
  }

  const filteredLogs = computed(() => {
    const filter = levelFilter.value;
    const query = searchQuery.value.toLowerCase().trim();

    return logs.value.filter(l => {
      const matchLevel = filter === 'ALL' || l.level === filter;
      const matchQuery = !query || l.message.toLowerCase().includes(query) || (l.module && l.module.toLowerCase().includes(query));
      return matchLevel && matchQuery;
    });
  });

  function exportLogs() {
    const text = logs.value.map(l => `[${l.time}] [${l.level}] ${l.module ? `[${l.module}] ` : ''}${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
