/** HTTP client for the duck robot FastAPI service (port 9527).
 *  Aligned with assets/app.js — all endpoints mirror the web UI exactly. */

import type {
  RobotStatus,
  RobotMode,
  CommandPayload,
  ModeResponse,
  RollerResponse,
  HeadingHoldResponse,
  FilterResponse,
  ImuFilterResponse,
  ActionScaleResponse,
  PickResponse,
  SitstandResponse,
  KickResponse,
  ImuCalibrationResponse,
  ImuCalibAction,
  SitstandAction,
} from '../types/robot';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createClient(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, '');

  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    timeoutMs = 4000,
  ): Promise<T> {
    const url = `${base}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const options: RequestInit = {
        method,
        headers: {},
        signal: controller.signal,
      };
      if (body !== undefined) {
        (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          (json as Record<string, unknown>).detail || 'request failed';
        throw new ApiError(String(detail));
      }
      if ((json as Record<string, unknown>).preparing) {
        // The web UI checks this flag for action preparation.
        // We return the full object so callers can inspect it.
      }
      return json as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    baseUrl: base,

    status: (timeoutMs = 4000) =>
      request<RobotStatus>('GET', '/api/status', undefined, timeoutMs),

    command: (payload: CommandPayload) =>
      request<unknown>('POST', '/api/command', payload, 2000),

    setMode: (mode: RobotMode | 'off') =>
      request<ModeResponse>('POST', '/api/mode', { mode }),

    setRoller: (enabled: boolean) =>
      request<RollerResponse>('POST', '/api/roller', { enabled }),

    setHeadingHold: (enabled: boolean) =>
      request<HeadingHoldResponse>('POST', '/api/heading-hold', { enabled }),

    setFilter: (leg: number, head: number) =>
      request<FilterResponse>('POST', '/api/filter', { leg, head }),

    setImuFilter: (gyro_alpha: number, gravity_tau_s: number) =>
      request<ImuFilterResponse>('POST', '/api/imu-filter', {
        gyro_alpha,
        gravity_tau_s,
      }),

    setActionScale: (scale: number) =>
      request<ActionScaleResponse>('POST', '/api/action-scale', { scale }),

    pick: () => request<PickResponse>('POST', '/api/pick', {}),

    roulade: () => request<PickResponse>('POST', '/api/roulade', {}),

    sitstand: (action: SitstandAction) =>
      request<SitstandResponse>('POST', '/api/sitstand', { action }),

    leftKick: () => request<KickResponse>('POST', '/api/left_kick', {}),

    rightKick: () => request<KickResponse>('POST', '/api/right_kick', {}),

    imuCalibration: (action: ImuCalibAction) =>
      request<ImuCalibrationResponse>('POST', '/api/imu-calibration', { action }),
  };
}

export type ApiClient = ReturnType<typeof createClient>;

/** Build base URL from host and port. */
export function buildBaseUrl(host: string, port: number): string {
  return `http://${host}:${port}`;
}
