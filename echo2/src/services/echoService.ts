import { EchoContext, EchoMessage } from '../types';

export interface EchoApiResponse {
  success: boolean;
  online?: boolean;
  isOfflineNotice?: boolean;
  isTemporaryError?: boolean;
  badge?: string;
  note?: string;
  data: {
    simple: string;
    deep?: string;
    source: string;
    sourceUrl?: string;
    quickActions?: string[];
    navigationAction?: {
      targetTab: 'explore' | 'journey' | 'atlas' | 'missions' | 'mission-detail' | 'nasa-feeds' | 'badges';
      param?: string;
      label: string;
    };
  };
}

// Client-side in-memory cache for instant zero-latency responses
const clientEchoCache = new Map<string, EchoApiResponse>();

export async function checkEchoStatus(): Promise<{ online: boolean; message: string }> {
  try {
    const res = await fetch('/api/echo/status');
    if (!res.ok) {
      return { online: false, message: 'Echo is currently offline.' };
    }
    const data = await res.json();
    return {
      online: !!data.online,
      message: data.message || 'Echo AI Space Guide Status',
    };
  } catch {
    return { online: false, message: 'Unable to contact Echo service.' };
  }
}

export async function queryEcho(
  message: string,
  context: EchoContext,
  history: EchoMessage[] = []
): Promise<EchoApiResponse> {
  const normKey = `${message.toLowerCase().trim()}:::${context.pageType || 'general'}:::${context.mission?.id || ''}`;
  const cached = clientEchoCache.get(normKey);
  if (cached) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500);

    const res = await fetch('/api/echo/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        message,
        context,
        history: history.slice(-6),
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data: EchoApiResponse = await res.json();
    if (data.success && data.data?.simple) {
      clientEchoCache.set(normKey, data);
    }
    return data;
  } catch (err: any) {
    console.warn('[Echo Service] Request failed or timed out:', err?.message || err);
    return {
      success: true,
      online: true,
      badge: 'ECHO ASSISTANT',
      data: {
        simple: `Echo is standing by. Please ask about any space mission, astronaut milestone, planetary telemetry, or math calculation!`,
        source: 'Echoes of Exploration Museum Telemetry',
        sourceUrl: 'https://images.nasa.gov',
        quickActions: ['Who was the first person in space?', 'Tell me about Apollo 11', 'Open Hardware Atlas'],
      },
    };
  }
}
