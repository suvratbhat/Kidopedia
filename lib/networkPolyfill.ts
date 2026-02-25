import { Platform } from 'react-native';

/**
 * Network polyfill for React Native Android.
 *
 * ROOT CAUSE (RN 0.81 + New Architecture):
 *  In New Architecture builds, globalThis.fetch is Hermes's built-in C++ HTTP
 *  client rather than React Native's OkHttp-backed XHR fetch.  Hermes's fetch
 *  fails for Cloudflare-protected endpoints (Supabase) while working for other
 *  hosts — the Android browser (Chrome/Chromium) reaches the same endpoints
 *  fine, confirming the issue is Hermes fetch, NOT the device's network.
 *
 *  React Native's XMLHttpRequest always routes through NetworkingModule.java →
 *  OkHttp, which has no Cloudflare compatibility issues.
 *
 * FIX: Replace globalThis.fetch with an XMLHttpRequest-backed implementation
 *  so all network calls (including Supabase) go through OkHttp.
 *
 * Also provides:
 *  - Header sanitisation (removes Connection/Keep-Alive which break OkHttp)
 *  - 30-second default timeout (hung requests surface quickly)
 *  - Richer error logging for post-mortem diagnostics
 */

const ANDROID_FETCH_TIMEOUT_MS = 30_000;

// ── XHR-backed fetch (routes through OkHttp via NetworkingModule.java) ───────

function xhrBackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    const urlStr =
      input instanceof URL
        ? input.href
        : typeof input === 'string'
        ? input
        : (input as Request).url;

    const method =
      typeof input !== 'string' && !(input instanceof URL)
        ? ((input as Request).method ?? 'GET')
        : (init?.method ?? 'GET');

    const reqHeaders = new Headers(
      typeof input !== 'string' && !(input instanceof URL)
        ? (input as Request).headers
        : init?.headers,
    );

    const body: BodyInit | null | undefined =
      typeof input !== 'string' && !(input instanceof URL)
        ? null  // don't attempt to stream from Request object
        : init?.body;

    const xhr = new XMLHttpRequest();
    xhr.open(method, urlStr, /* async */ true);

    reqHeaders.forEach((value, name) => {
      try {
        xhr.setRequestHeader(name, value);
      } catch {
        // Forbidden headers (Content-Length etc.) are silently ignored.
      }
    });

    // Wire AbortSignal so our timeout wrapper can cancel the XHR.
    const signal = init?.signal;
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        reject(new DOMException('The operation was aborted.', 'AbortError'));
        return;
      }
      const onAbort = () => {
        xhr.abort();
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort);
    }

    xhr.responseType = 'arraybuffer';

    xhr.onload = () => {
      const respHeaders = new Headers();
      xhr.getAllResponseHeaders()
        .trim()
        .split(/\r?\n/)
        .forEach((line) => {
          const idx = line.indexOf(':');
          if (idx > 0) {
            respHeaders.append(
              line.slice(0, idx).trim(),
              line.slice(idx + 1).trim(),
            );
          }
        });

      resolve(
        new Response(xhr.response as ArrayBuffer, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: respHeaders,
        }),
      );
    };

    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.onabort = () =>
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    xhr.ontimeout = () =>
      reject(new TypeError('Network request timed out'));

    xhr.send((body ?? null) as XMLHttpRequestBodyInit | null);
  });
}

// ── Install polyfill on Android ───────────────────────────────────────────────

if (Platform.OS === 'android') {
  globalThis.fetch = async (
    url: RequestInfo | URL,
    options?: RequestInit,
  ): Promise<Response> => {
    const urlString =
      url instanceof URL ? url.href
      : typeof url === 'string' ? url
      : (url as Request).url;

    // ── Headers ──────────────────────────────────────────────────────────────
    const headers = new Headers(
      typeof url !== 'string' && !(url instanceof URL)
        ? (url as Request).headers
        : options?.headers,
    );

    if (!headers.has('Accept')) {
      headers.set('Accept', '*/*');
    }
    // These headers cause problems with OkHttp — strip them.
    headers.delete('Connection');
    headers.delete('Keep-Alive');

    // ── Timeout ───────────────────────────────────────────────────────────────
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

    console.log('[NetworkPolyfill] fetch →', {
      url: urlString,
      method: options?.method ?? 'GET',
    });

    try {
      // Route through XHR → OkHttp (avoids Hermes C++ fetch / Cloudflare issue)
      const response = await xhrBackedFetch(url, {
        ...options,
        headers,
        signal,
      });

      console.log('[NetworkPolyfill] fetch ←', {
        status: response.status,
        ok: response.ok,
      });

      return response;
    } catch (error: any) {
      const message: string = error?.message ?? '';
      const name: string = error?.name ?? '';

      console.error('[NetworkPolyfill] fetch error:', {
        message,
        name,
        url: urlString,
      });

      if (error?.name === 'AbortError' && ownController?.signal.aborted) {
        throw new Error(
          `Request timed out after ${ANDROID_FETCH_TIMEOUT_MS / 1000}s. ` +
            'Please check your connection and try again.',
        );
      }

      throw error;
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
  };

  console.log('[NetworkPolyfill] XHR-backed fetch installed (OkHttp route)');
}

export {};
