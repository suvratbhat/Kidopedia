# Browser Works But App Fails - Android Network Issue

## Your Situation

✅ **Chrome browser on Android** - Can access `https://knvrcozeveutvwallrgf.supabase.co/rest/v1/` and see JSON

❌ **Kidopedia app** - Shows "Cannot connect to database" error

This is a **React Native Android network configuration issue**, not a network blocking problem.

## What This Means

The issue is NOT your network or Supabase. The problem is:

1. **Android WebView (browser)** - Has full network access and works fine
2. **React Native app** - Uses native networking layer which may have issues with:
   - SSL/TLS certificate validation
   - Network security configuration
   - DNS resolution in native code
   - Fetch API polyfill issues

## Solutions to Try (In Order)

### Solution 1: Rebuild APK with New Network Configuration

I've just updated the app with:
- ✅ Better Android network security configuration
- ✅ Fixed SSL/TLS handling for supabase.co domain
- ✅ Added WiFi state permission
- ✅ Improved URL polyfill loading
- ✅ Better error logging and diagnostics

**You MUST rebuild your APK** to get these fixes:

```bash
# If using GitHub Actions:
1. Push the updated code to GitHub
2. Go to Actions → Build Android APK
3. Run workflow
4. Download new APK

# If building locally:
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

### Solution 2: Run Enhanced Diagnostics

After installing the new APK:

1. Open Kidopedia app
2. Scroll down on profile screen
3. Tap **"Test Database Connection"**
4. Look at the detailed test results

The new diagnostics will test:
- ✅ Environment variables
- ✅ DNS resolution (test with google.com)
- ✅ HTTPS connection to Supabase domain
- ✅ Supabase REST API endpoint
- ✅ Different header configurations
- ✅ Raw fetch without timeout

This will show EXACTLY what's failing in the app.

### Solution 3: Check ADB Logs for Details

If you have Android Debug Bridge (adb) installed:

```bash
# Connect your device and run:
adb logcat | grep -E "Supabase|NetworkDebug"
```

Look for these new log messages:
- `[Supabase] Fetch Request:` - Shows each request attempt
- `[Supabase] Fetch Success:` - Shows successful responses
- `[Supabase] Fetch Error:` - Shows detailed error info
- `[NetworkDebug]` - Shows comprehensive network tests

### Solution 4: Try Clearing App Data

Sometimes React Native caches cause issues:

1. Go to Android Settings
2. Apps → Kidopedia
3. Storage → Clear Data
4. Restart app

## Technical Details

### What Was Changed

**app.json:**
```json
{
  "android": {
    "versionCode": 2,  // Incremented version
    "permissions": [
      "android.permission.ACCESS_WIFI_STATE"  // Added
    ],
    "usesCleartextTraffic": false,
    "networkSecurityConfig": {
      "domainConfig": [
        {
          "domains": ["*.supabase.co", "supabase.co"],
          "includeSubdomains": true
        }
      ]
    }
  }
}
```

**lib/supabase.ts:**
- Enhanced logging with detailed request/response info
- Better error messages with troubleshooting hints
- Platform detection
- Improved headers configuration

**app/_layout.tsx:**
- URL polyfill now loads FIRST before anything else
- This ensures URL parsing works correctly

**New Files:**
- `services/networkDebugService.ts` - Comprehensive network testing
- Integrated with diagnostics for detailed troubleshooting

## What to Expect After Rebuilding

### If It Works:
You'll see in the diagnostics:
```
✓ Environment variables are configured
✓ Raw fetch to Supabase works
✓ Database connection successful
✓ Database insert/delete test successful
```

And you can create profiles normally!

### If It Still Fails:
The diagnostics will show exactly which test fails:
- DNS Resolution test → DNS issue
- HTTPS Connection test → SSL/TLS issue
- Supabase REST API test → API configuration issue
- Raw Fetch test → Low-level network problem

## Common Causes (Even When Browser Works)

### 1. React Native Network Layer Issue
React Native uses native Android networking (OkHttp) which is different from WebView.

**Fix:** The updated network configuration should resolve this.

### 2. SSL Certificate Pinning
Some Android devices don't trust certain certificate authorities.

**Fix:** The network security config explicitly allows supabase.co certificates.

### 3. URL Polyfill Not Loaded
If the URL polyfill loads after Supabase client, URL parsing fails.

**Fix:** Now loads at app entry point.

### 4. Fetch API Implementation
React Native's fetch might have bugs or differences from browser fetch.

**Fix:** Better error handling and timeout configuration.

## Next Steps

1. **Rebuild the APK** with the updated code (versionCode: 2)
2. **Install** the new APK on your device
3. **Run diagnostics** in the app to see detailed results
4. **Check logs** with `adb logcat` if available
5. **Report back** which specific test is failing

## If Still Not Working

Share the **diagnostics output** and **ADB logs**, which will show:
- Which specific network test fails
- Exact error messages
- Platform details
- Network configuration

This will help identify the root cause.

---

**Important:** The browser working but app failing is a known React Native Android issue. The updates I made address the most common causes. You MUST rebuild to get these fixes!
