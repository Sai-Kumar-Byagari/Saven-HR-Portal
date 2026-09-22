type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  url: string;
  timestamp: string;
  userAgent: string;
}

const LOG_QUEUE: LogEntry[] = [];
const FLUSH_INTERVAL_MS = 10_000;
const MAX_QUEUE_SIZE = 50;

let flushTimer: ReturnType<typeof setInterval> | null = null;

function buildEntry(
  level: LogLevel,
  message: string,
  extra?: { context?: string; stack?: string; metadata?: Record<string, unknown> },
): LogEntry {
  return {
    level,
    message,
    context: extra?.context,
    stack: extra?.stack,
    metadata: extra?.metadata,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
}

function enqueue(entry: LogEntry): void {
  LOG_QUEUE.push(entry);

  if (LOG_QUEUE.length >= MAX_QUEUE_SIZE) {
    flush();
  }
}

function flush(): void {
  if (LOG_QUEUE.length === 0) return;

  const batch = LOG_QUEUE.splice(0);

  // TODO: POST to backend logging endpoint when it exists (see BACKEND_FINDINGS.md FINDING-002)
  // For now, structured output to console so logs are visible during development
  if (import.meta.env.DEV) {
    batch.forEach((entry) => {
      const method = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'info';
      console[method](`[logService:${entry.level}]`, entry.message, entry);
    });
  }
}

function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
}

function stopFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

export const logService = {
  info(message: string, extra?: { context?: string; metadata?: Record<string, unknown> }) {
    enqueue(buildEntry('info', message, extra));
  },

  warn(message: string, extra?: { context?: string; metadata?: Record<string, unknown> }) {
    enqueue(buildEntry('warn', message, extra));
  },

  error(
    message: string,
    extra?: { context?: string; stack?: string; metadata?: Record<string, unknown> },
  ) {
    enqueue(buildEntry('error', message, extra));
  },

  captureException(error: unknown, context?: string) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    enqueue(buildEntry('error', message, { context, stack }));
  },

  flush,
  startFlushTimer,
  stopFlushTimer,
};
