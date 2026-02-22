import { Platform } from 'react-native';

/**
 * Network polyfill for React Native Android
 * Fixes "Network request failed" errors by properly configuring fetch
 */

if (Platform.OS === 'android') {
  // Store original fetch
  const originalFetch = global.fetch;

  // Override global fetch with Android-compatible version
  global.fetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    try {
      const urlString = url.toString();

      // Ensure proper headers for Android
      const headers = new Headers(options?.headers);

      // Add required headers for Android if not present
      if (!headers.has('Accept')) {
        headers.set('Accept', '*/*');
      }

      // Remove problematic headers that cause issues on Android
      headers.delete('Connection');
      headers.delete('Keep-Alive');

      const modifiedOptions: RequestInit = {
        ...options,
        headers,
        // Disable credentials for Android
        credentials: 'omit',
      };

      console.log('[NetworkPolyfill] Android fetch:', {
        url: urlString,
        method: modifiedOptions.method || 'GET',
        headersCount: Array.from(headers.keys()).length,
      });

      const response = await originalFetch(url, modifiedOptions);

      console.log('[NetworkPolyfill] Android fetch success:', {
        status: response.status,
        ok: response.ok,
      });

      return response;
    } catch (error: any) {
      console.error('[NetworkPolyfill] Android fetch failed:', {
        message: error.message,
        name: error.name,
        url: url.toString(),
      });

      // Provide more helpful error message
      if (error.message === 'Network request failed') {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }

      throw error;
    }
  };

  console.log('[NetworkPolyfill] Android fetch polyfill installed');
}

// XMLHttpRequest polyfill for Android
if (Platform.OS === 'android' && typeof global.XMLHttpRequest === 'undefined') {
  // Use a proper XMLHttpRequest polyfill implementation
  global.XMLHttpRequest = class XMLHttpRequest {
    private method: string = 'GET';
    private url: string = '';
    private headers: Map<string, string> = new Map();
    private responseText: string = '';
    private status: number = 0;
    private statusText: string = '';
    private readyState: number = 0;
    private onreadystatechange: (() => void) | null = null;
    private responseType: string = '';

    static readonly UNSENT = 0;
    static readonly OPENED = 1;
    static readonly HEADERS_RECEIVED = 2;
    static readonly LOADING = 3;
    static readonly DONE = 4;

    open(method: string, url: string): void {
      this.method = method;
      this.url = url;
      this.readyState = XMLHttpRequest.OPENED;
      this.triggerReadyStateChange();
    }

    setRequestHeader(header: string, value: string): void {
      this.headers.set(header, value);
    }

    send(body?: Document | XMLHttpRequestBodyInit | null): void {
      const headers: Record<string, string> = {};
      this.headers.forEach((value, key) => {
        headers[key] = value;
      });

      fetch(this.url, {
        method: this.method,
        headers,
        body: body as any,
        credentials: 'omit',
      })
        .then(async (response) => {
          this.status = response.status;
          this.statusText = response.statusText;
          this.readyState = XMLHttpRequest.HEADERS_RECEIVED;
          this.triggerReadyStateChange();

          this.responseText = await response.text();
          this.readyState = XMLHttpRequest.DONE;
          this.triggerReadyStateChange();
        })
        .catch((error) => {
          this.readyState = XMLHttpRequest.DONE;
          this.status = 0;
          this.statusText = error.message;
          this.triggerReadyStateChange();
        });
    }

    private triggerReadyStateChange(): void {
      if (this.onreadystatechange) {
        this.onreadystatechange();
      }
    }

    get response(): any {
      if (this.responseType === 'json') {
        try {
          return JSON.parse(this.responseText);
        } catch {
          return null;
        }
      }
      return this.responseText;
    }
  } as any;

  console.log('[NetworkPolyfill] XMLHttpRequest polyfill installed');
}

export {};
