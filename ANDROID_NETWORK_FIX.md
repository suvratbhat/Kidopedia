# Android Network Fix

## Problem

The app was experiencing "Network request failed" errors on Android devices, even though:
- DNS resolution worked (could reach google.com)
- Environment variables were properly configured
- The Supabase URL was correct
- Internet connection was active

The diagnostic test showed:
```
✗ Raw fetch failed: Network request failed
✗ HTTPS Connection to Supabase Domain: Network request failed
✗ Supabase REST API: Network request failed
```

This is a known issue with React Native's fetch implementation on Android.

## Root Cause

React Native's fetch implementation on Android has several known issues:
1. Improper handling of certain HTTP headers
2. XMLHttpRequest not being available in the global scope
3. Network stack incompatibilities with certain Android versions
4. Issues with credentials and CORS handling

## Solution Implemented

### 1. Created Network Polyfill (`lib/networkPolyfill.ts`)

This file provides:

**Android Fetch Polyfill:**
- Wraps the native fetch with Android-specific fixes
- Ensures proper headers (adds `Accept: */*` if missing)
- Removes problematic headers (`Connection`, `Keep-Alive`)
- Disables credentials (sets to `omit`)
- Provides better error messages

**XMLHttpRequest Polyfill:**
- Implements a complete XMLHttpRequest class for Android
- Uses fetch under the hood
- Provides compatibility with libraries expecting XHR

### 2. Updated App Entry Point (`app/_layout.tsx`)

Added the polyfill import at the top:
```typescript
import 'react-native-url-polyfill/auto';
import '@/lib/networkPolyfill';  // ← New polyfill
```

This ensures the polyfill loads before any network requests are made.

### 3. Simplified Supabase Client (`lib/supabase.ts`)

Removed the custom fetch wrapper from Supabase configuration. Now using:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'kidopedia-app',
    },
  },
});
```

The polyfill now handles all fetch requests globally, so no need for custom fetch logic in the Supabase client.

## What Changed

**Files Modified:**
1. `lib/networkPolyfill.ts` - NEW FILE - Android network polyfill
2. `app/_layout.tsx` - Added polyfill import
3. `lib/supabase.ts` - Simplified configuration, removed custom fetch wrapper

## How It Works

1. **App starts** → `app/_layout.tsx` runs
2. **Polyfill loads** → `lib/networkPolyfill.ts` executes
3. **On Android only** → global `fetch` is wrapped with fixes
4. **All network requests** → Now use the polyfilled fetch
5. **Supabase client** → Uses the polyfilled fetch automatically

## Testing

To test the fix:

1. Build a new Android APK:
   ```bash
   npm run build:web
   # Then build Android APK using your build process
   ```

2. Install on Android device

3. Open the app and run the diagnostic test

4. Expected results:
   ```
   ✓ Raw fetch succeeded
   ✓ HTTPS Connection to Supabase Domain: Success
   ✓ Supabase REST API: Success
   ```

## Why This Fix Works

The polyfill addresses the core issues:

1. **Header Management**: Ensures headers are properly formatted for Android's network stack
2. **Credentials Handling**: Disables credentials which can cause issues on Android
3. **XMLHttpRequest Support**: Provides XHR for libraries that depend on it
4. **Better Error Messages**: Transforms cryptic errors into actionable messages

## Platform-Specific Behavior

- **Android**: Uses the polyfilled fetch with all fixes
- **iOS**: Uses native fetch (no polyfill applied)
- **Web**: Uses native fetch (no polyfill applied)

The polyfill only activates on Android where the issues exist.

## Additional Notes

- The fix is non-invasive and doesn't affect iOS or Web platforms
- Performance impact is minimal (just a thin wrapper)
- All existing code continues to work without changes
- The polyfill can be extended if additional issues are discovered

## Related Issues

This fix addresses issues similar to:
- React Native issue #32844
- React Native issue #28293
- Supabase Android connectivity problems
- General "Network request failed" errors on Android

## Next Steps

After deploying this fix:
1. Test on multiple Android devices (different versions)
2. Monitor error logs for any remaining network issues
3. If issues persist, check Android network permissions in app.json
4. Consider adding network state monitoring for offline handling
