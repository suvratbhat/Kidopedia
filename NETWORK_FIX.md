# Quick Fix: Network Request Failed Error

If you're seeing "Cannot connect to database" or "Network request failed" on Android, this means **your Android device cannot reach the Supabase server**.

## What This Error Means

✅ **GOOD NEWS:** The app is built correctly and Supabase server is working fine.

❌ **THE ISSUE:** Your Android device cannot connect to the internet or cannot reach supabase.co servers.

This is an **Android network connectivity problem**, not an app bug.

## Immediate Steps to Try

### 1. Run Built-in Diagnostics (FASTEST)
1. When you see the error, tap **"Test Connection"** button in the error dialog
2. OR open the app → Scroll down on profile screen → Tap **"Test Database Connection"**
3. Read the results to see exactly what's failing

### 2. Test if Supabase is Accessible
**This is the most important test!**

1. Open **Chrome browser** on your Android device
2. Visit this URL: `https://knvrcozeveutvwallrgf.supabase.co/rest/v1/`
3. **What you should see:**
   - ✅ **JSON response** (even if it says "error") = Supabase is accessible
   - ❌ **"Site can't be reached"** or **timeout** = Supabase is blocked

**If you see "Site can't be reached":**
- Your network is blocking Supabase servers
- Try switching to mobile data instead of WiFi
- Disable VPN if you're using one
- Contact network admin if on school/corporate WiFi

### 3. Check General Internet Connection
- Open Chrome or any browser
- Try visiting google.com
- If it doesn't load, fix your internet connection first
- Try switching between WiFi and mobile data

### 4. Restart Network
1. Turn WiFi OFF, wait 5 seconds, turn it back ON
2. OR turn Airplane Mode ON, wait 5 seconds, turn it OFF
3. Try creating a profile again

### 5. Check if Environment Variables are Missing

**This is RARE.** Most people have the right APK.

If the diagnostics show "Environment variables are missing", the APK was built without database credentials. You need to rebuild it:

**For GitHub Actions:**
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets if missing:
   - `EXPO_PUBLIC_SUPABASE_URL` = `https://knvrcozeveutvwallrgf.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = (get from your `.env` file)
4. Go to **Actions** tab
5. Select **Build Android APK** workflow
6. Click **Run workflow**
7. Download the new APK when build completes

## Why This Happens

The "Network request failed" error occurs when:

1. **No internet connection** - Device can't reach any servers
2. **Blocked by firewall/VPN** - Network security is blocking the connection
3. **DNS issues** - Device can't resolve the Supabase domain name
4. **Missing credentials** - APK was built without environment variables (less common)

## Advanced Troubleshooting

### Check Logs with ADB

If you have Android Debug Bridge (adb) installed:

```bash
adb logcat | grep -i supabase
```

Look for:
- `Supabase Configuration:` - Shows if credentials are loaded
- `Supabase Fetch:` - Shows network requests being made
- `Supabase Response:` - Shows server responses
- `Supabase Fetch Error:` - Shows network errors

### Test from Browser

Test if Supabase is accessible from your network:

1. Open Chrome on your Android device
2. Visit: `https://knvrcozeveutvwallrgf.supabase.co/rest/v1/`
3. You should see a JSON response (might be an error, but should load)
4. If you see "This site can't be reached", your network is blocking Supabase

### Rebuild APK Locally

If GitHub Actions isn't working:

```bash
# Clone the repository
git clone [your-repo-url]
cd kidopedia

# Create .env file
echo "EXPO_PUBLIC_SUPABASE_URL=https://knvrcozeveutvwallrgf.supabase.co" > .env
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here" >> .env

# Install dependencies
npm install

# Prebuild Android native code
npx expo prebuild --platform android --clean

# Build APK
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## Still Not Working?

If none of these steps work:

1. **Try a different network** - Connect to different WiFi or use mobile data
2. **Disable VPN** - Some VPNs block certain connections
3. **Check with network admin** - If on corporate/school network, they might be blocking external APIs
4. **Test on different device** - Rule out device-specific issues
5. **Check Supabase status** - Visit https://status.supabase.com/

## What Changed in This Update

This update includes:
- ✓ Better error messages showing exact network issue
- ✓ 30-second timeout instead of quick failure
- ✓ Built-in diagnostics tool in Settings
- ✓ Detailed logging for debugging
- ✓ Improved network configuration for Android

Rebuild your APK to get these improvements!
