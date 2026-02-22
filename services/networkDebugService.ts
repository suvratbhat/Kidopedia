import { Platform } from 'react-native';

export interface NetworkTestResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

class NetworkDebugService {
  private supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

  async runComprehensiveTest(): Promise<NetworkTestResult[]> {
    const results: NetworkTestResult[] = [];

    results.push(await this.testEnvironmentVariables());
    results.push(await this.testDNSResolution());
    results.push(await this.testHTTPSConnection());
    results.push(await this.testSupabaseEndpoint());
    results.push(await this.testWithDifferentHeaders());

    return results;
  }

  private testEnvironmentVariables(): NetworkTestResult {
    const hasUrl = !!this.supabaseUrl;
    const hasKey = !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    return {
      test: 'Environment Variables',
      success: hasUrl && hasKey,
      message: hasUrl && hasKey
        ? 'All environment variables present'
        : 'Missing environment variables',
      details: {
        url: hasUrl ? this.supabaseUrl : 'MISSING',
        key: hasKey ? 'Present' : 'MISSING',
        platform: Platform.OS,
      }
    };
  }

  private async testDNSResolution(): Promise<NetworkTestResult> {
    try {
      const testUrl = 'https://www.google.com';
      console.log('[NetworkDebug] Testing DNS with Google...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        test: 'DNS Resolution (google.com)',
        success: true,
        message: 'DNS resolution working',
        details: {
          status: response.status,
          reachable: true,
        }
      };
    } catch (error: any) {
      console.error('[NetworkDebug] DNS test failed:', error);
      return {
        test: 'DNS Resolution (google.com)',
        success: false,
        message: `DNS test failed: ${error.message}`,
        details: {
          error: error.message,
          name: error.name,
        }
      };
    }
  }

  private async testHTTPSConnection(): Promise<NetworkTestResult> {
    try {
      const baseUrl = this.supabaseUrl.replace('//', '//').split('/')[2];
      console.log('[NetworkDebug] Testing HTTPS to:', baseUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`https://${baseUrl}`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        test: 'HTTPS Connection to Supabase Domain',
        success: true,
        message: 'Can reach Supabase domain',
        details: {
          status: response.status,
          domain: baseUrl,
        }
      };
    } catch (error: any) {
      console.error('[NetworkDebug] HTTPS test failed:', error);
      return {
        test: 'HTTPS Connection to Supabase Domain',
        success: false,
        message: `Cannot reach Supabase: ${error.message}`,
        details: {
          error: error.message,
          name: error.name,
        }
      };
    }
  }

  private async testSupabaseEndpoint(): Promise<NetworkTestResult> {
    try {
      const testUrl = `${this.supabaseUrl}/rest/v1/`;
      console.log('[NetworkDebug] Testing Supabase REST endpoint:', testUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      const text = await response.text();

      return {
        test: 'Supabase REST API',
        success: response.ok || response.status === 404,
        message: response.ok ? 'Supabase API is reachable' : `Got response: ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          responsePreview: text.substring(0, 100),
        }
      };
    } catch (error: any) {
      console.error('[NetworkDebug] Supabase endpoint test failed:', error);
      return {
        test: 'Supabase REST API',
        success: false,
        message: `Cannot connect to Supabase API: ${error.message}`,
        details: {
          error: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3),
        }
      };
    }
  }

  private async testWithDifferentHeaders(): Promise<NetworkTestResult> {
    try {
      const testUrl = `${this.supabaseUrl}/rest/v1/`;
      console.log('[NetworkDebug] Testing with minimal headers...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });

      clearTimeout(timeoutId);

      return {
        test: 'Connection with Minimal Headers',
        success: true,
        message: 'Works with minimal headers',
        details: {
          status: response.status,
        }
      };
    } catch (error: any) {
      console.error('[NetworkDebug] Minimal headers test failed:', error);
      return {
        test: 'Connection with Minimal Headers',
        success: false,
        message: `Failed: ${error.message}`,
        details: {
          error: error.message,
        }
      };
    }
  }

  async testRawFetch(): Promise<NetworkTestResult> {
    try {
      console.log('[NetworkDebug] Testing raw fetch to Supabase...');

      const url = `${this.supabaseUrl}/rest/v1/`;
      console.log('[NetworkDebug] URL:', url);
      console.log('[NetworkDebug] Platform:', Platform.OS);

      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });
      const duration = Date.now() - startTime;

      console.log('[NetworkDebug] Raw fetch success in', duration, 'ms');

      return {
        test: 'Raw Fetch (No Timeout)',
        success: true,
        message: `Success in ${duration}ms`,
        details: {
          status: response.status,
          duration,
        }
      };
    } catch (error: any) {
      console.error('[NetworkDebug] Raw fetch failed:', error);
      return {
        test: 'Raw Fetch (No Timeout)',
        success: false,
        message: `Failed: ${error.message}`,
        details: {
          error: error.message,
          name: error.name,
          code: (error as any).code,
        }
      };
    }
  }
}

export const networkDebugService = new NetworkDebugService();
