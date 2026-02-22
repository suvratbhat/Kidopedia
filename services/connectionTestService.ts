import { supabase } from '@/lib/supabase';
import { networkDebugService } from './networkDebugService';

export const connectionTestService = {
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('Testing Supabase connection...');

      const { data, error } = await supabase
        .from('kid_profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Connection test failed:', error);
        return {
          success: false,
          message: `Connection failed: ${error.message}`,
          details: error,
        };
      }

      console.log('Connection test successful');
      return {
        success: true,
        message: 'Successfully connected to database',
        details: data,
      };
    } catch (error: any) {
      console.error('Connection test error:', error);
      return {
        success: false,
        message: `Network error: ${error.message || 'Unknown error'}`,
        details: error,
      };
    }
  },

  async testInsert(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('Testing database insert...');

      const testProfile = {
        name: 'Connection Test',
        age: 5,
        gender: 'other' as const,
        avatar_color: '#000000',
        avatar_url: '',
      };

      const { data, error } = await supabase
        .from('kid_profiles')
        .insert([testProfile])
        .select()
        .single();

      if (error) {
        console.error('Insert test failed:', error);
        return {
          success: false,
          message: `Insert failed: ${error.message}`,
          details: error,
        };
      }

      await supabase
        .from('kid_profiles')
        .delete()
        .eq('id', data.id);

      console.log('Insert test successful');
      return {
        success: true,
        message: 'Successfully inserted and deleted test data',
        details: data,
      };
    } catch (error: any) {
      console.error('Insert test error:', error);
      return {
        success: false,
        message: `Insert error: ${error.message || 'Unknown error'}`,
        details: error,
      };
    }
  },

  async runFullDiagnostics(): Promise<{
    environmentCheck: boolean;
    connectionCheck: boolean;
    insertCheck: boolean;
    messages: string[];
  }> {
    const messages: string[] = [];
    let environmentCheck = false;
    let connectionCheck = false;
    let insertCheck = false;

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    console.log('=== Running Full Diagnostics ===');

    if (supabaseUrl && supabaseKey) {
      environmentCheck = true;
      messages.push('✓ Environment variables are configured');
    } else {
      messages.push('✗ Environment variables are missing');
      if (!supabaseUrl) messages.push('  - EXPO_PUBLIC_SUPABASE_URL is missing');
      if (!supabaseKey) messages.push('  - EXPO_PUBLIC_SUPABASE_ANON_KEY is missing');
    }

    if (environmentCheck) {
      messages.push('\n🔍 Running network tests...');

      const rawFetchTest = await networkDebugService.testRawFetch();
      if (rawFetchTest.success) {
        messages.push('✓ Raw fetch to Supabase works');
      } else {
        messages.push(`✗ Raw fetch failed: ${rawFetchTest.message}`);
        messages.push('  This indicates a low-level network issue');
      }

      const connectionResult = await this.testConnection();
      if (connectionResult.success) {
        connectionCheck = true;
        messages.push('✓ Database connection successful');
      } else {
        messages.push(`✗ Connection failed: ${connectionResult.message}`);

        console.log('\n🔍 Running comprehensive network debug...');
        messages.push('\n🔍 Detailed network tests:');
        const debugResults = await networkDebugService.runComprehensiveTest();
        for (const result of debugResults) {
          const icon = result.success ? '✓' : '✗';
          messages.push(`  ${icon} ${result.test}: ${result.message}`);
          if (!result.success && result.details) {
            messages.push(`    Details: ${JSON.stringify(result.details).substring(0, 100)}`);
          }
        }
      }

      if (connectionCheck) {
        const insertResult = await this.testInsert();
        if (insertResult.success) {
          insertCheck = true;
          messages.push('✓ Database insert/delete test successful');
        } else {
          messages.push(`✗ Insert test failed: ${insertResult.message}`);
        }
      }
    }

    console.log('=== Diagnostics Complete ===');
    messages.forEach(msg => console.log(msg));

    return {
      environmentCheck,
      connectionCheck,
      insertCheck,
      messages,
    };
  },
};
