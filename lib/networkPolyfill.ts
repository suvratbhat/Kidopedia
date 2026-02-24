import { Platform } from 'react-native';

/**
 * Network polyfill for React Native Android.
 *
 * Fixes "Network request failed" errors by:
 *  1. Sanitising headers that cause issues with Android's OkHttp stack
 *  2. Forcing credentials:omit (Supabase uses Bearer tokens, not cookies)
 *  3. Adding a 30-second default timeout so hung requests surface as errors
 *     instead of waiting forever
 *  4. Providing a proper XMLHttpRequest shim for libraries that need XHR
 *
 * Import this file at the very top of app/_layout.tsx (before any network
 * code) so it is applied before the Supabase client is created.
 */

const ANDROID_FETCH_TIMEOUT_MS = 30_000;

if (Platform.OS === 'android') {
  // Capture the native fetch before we replace it.
  // Bind it so it keeps its native 'this' context.
  const nativeFetch = (globalThis.fetch as typeof fetch).bind(globalThis);

  globalThis.fetch = async (
    url: RequestInfo | URL,
    options?: RequestInit,
  ): Promise<Response> => {
    const urlString = url.toString();

    // ── Headers ──────────────────────────────────────────────────────────────
    // Initialise from whatever the caller passed (string, Headers, or plain
    // object) so we don't lose any auth headers.
    const headers = new Headers(options?.headers);

    if (!headers.has('Accept')) {
      headers.set('Accept', '*/*');
    }
    // These headers cause problems with Android's OkHttp client.
    headers.delete('Connection');
    headers.delete('Keep-Alive');

    // ── Timeout ───────────────────────────────────────────────────────────────
    // Use the caller's AbortSignal if one was provided; otherwise create our
    // own so hung requests eventually fail instead of blocking the app.
    let ownController: AbortController | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let signal = options?.signal;

    if (!signal) {
      ownController = new AbortController();
      signal = ownController.signal;
      timeoutId = setTimeout(
        () => ownController!.abort(),
        ANDROID_FETCH_TIMEOUT_MS,
      );
    }

    const modifiedOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'omit',
      signal,
    };

    console.log('[NetworkPolyfill] Android fetch →', {
      url: urlString,
      method: modifiedOptions.method ?? 'GET',
      headerCount: Array.from(headers.keys()).length,
    });

    try {
      const response = await nativeFetch(url, modifiedOptions);

      console.log('[NetworkPolyfill] Android fetch ←', {
        status: response.status,
        ok: response.ok,
      });

      return response;
    } catch (error: any) {
      const message: string = error?.message ?? '';
      const name: string = error?.name ?? '';
      // Capture every available diagnostic field before rethrowing.
      const code: string | undefined = error?.code;
      const cause: string | undefined = error?.cause?.message ?? error?.cause?.toString();

      console.error('[NetworkPolyfill] Android fetch error:', {
        message,
        name,
        code,
        cause,
        url: urlString,
      });

      if (error?.name === 'AbortError' && ownController?.signal.aborted) {
        throw new Error(
          `Request timed out after ${ANDROID_FETCH_TIMEOUT_MS / 1000}s. ` +
            'Please check your connection and try again.',
        );
      }

      // Re-throw with all diagnostic info preserved so the connection test
      // screen can surface the real OkHttp error (e.g. SSL handshake failure,
      // certificate error, connection refused) instead of just a generic label.
      if (
        message === 'Network request failed' ||
        message === 'Failed to fetch'
      ) {
        const detail = [
          code ? `code=${code}` : null,
          cause ? `cause="${cause}"` : null,
        ]
          .filter(Boolean)
          .join(', ');
        throw new Error(
          `Network connection failed${detail ? ` (${detail})` : ''}. ` +
            'Check internet connection or see console logs for the full error.',
        );
      }

      throw error;
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
  };

  console.log('[NetworkPolyfill] Android fetch polyfill installed');
}

// ── XMLHttpRequest shim ─────────────────────────────────────────────────────
// Some libraries (older versions of the Supabase realtime client, etc.) still
// use XHR.  Provide a minimal implementation backed by fetch.
if (Platform.OS === 'android' && typeof (globalThis as any).XMLHttpRequest === 'undefined') {
  (globalThis as any).XMLHttpRequest = class XMLHttpRequest {
    private _method: string = 'GET';
    private _url: string = '';
    private _requestHeaders: Map<string, string> = new Map();
    private _responseText: string = '';
    private _response: any = null;
    private _status: number = 0;
    private _statusText: string = '';
    private _readyState: number = 0;
    private _responseType: string = '';

    onreadystatechange: (() => void) | null = null;

    static readonly UNSENT = 0;
    static readonly OPENED = 1;
    static readonly HEADERS_RECEIVED = 2;
    static readonly LOADING = 3;
    static readonly DONE = 4;

    get readyState() { return this._readyState; }
    get status() { return this._status; }
    get statusText() { return this._statusText; }
    get responseText() { return this._responseText; }
    get responseType() { return this._responseType; }
    set responseType(value: string) { this._responseType = value; }
    get response() {
      if (this._responseType === 'json') {
        try { return JSON.parse(this._responseText); } catch { return null; }
      }
      return this._response ?? this._responseText;
    }

    open(method: string, url: string): void {
      this._method = method;
      this._url = url;
      this._readyState = (XMLHttpRequest as any).OPENED;
      this._notify();
    }

    setRequestHeader(name: string, value: string): void {
      this._requestHeaders.set(name, value);
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
      const headers: Record<string, string> = {};
      this._requestHeaders.forEach((v, k) => { headers[k] = v; });

      fetch(this._url, {
        method: this._method,
        headers,
        body: body as BodyInit | null,
        credentials: 'omit',
      })
        .then(async (res) => {
          this._status = res.status;
          this._statusText = res.statusText;
          this._readyState = (XMLHttpRequest as any).HEADERS_RECEIVED;
          this._notify();

          this._responseText = await res.text();
          this._readyState = (XMLHttpRequest as any).DONE;
          this._notify();
        })
        .catch((err: Error) => {
          this._status = 0;
          this._statusText = err.message;
          this._readyState = (XMLHttpRequest as any).DONE;
          this._notify();
        });
    }

    private _notify(): void {
      this.onreadystatechange?.();
    }
  };

  console.log('[NetworkPolyfill] XMLHttpRequest shim installed');
}

export {};
