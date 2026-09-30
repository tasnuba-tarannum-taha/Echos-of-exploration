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
  try {
    const res = await fetch('/api/echo/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        history: history.slice(-6),
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data: EchoApiResponse = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[Echo Service] Request failed:', err);
    return {
      success: false,
      isTemporaryError: true,
      data: {
        simple: 'Echo is temporarily unavailable. You can continue exploring the museum exhibits uninterrupted.',
        source: 'Echoes of Exploration Museum Telemetry',
        sourceUrl: 'https://images.nasa.gov',
        quickActions: ['Continue Exploring', 'View Missions', 'Open NEO Radar'],
      },
    };
  }
}
