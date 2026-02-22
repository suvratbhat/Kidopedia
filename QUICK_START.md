# Quick Start Guide for Fixing "Network Request Failed"

## The Problem

You're seeing this error when creating a profile:
```
Cannot connect to database. Please check your internet connection and try again.
```

## What This Actually Means

✅ **GOOD NEWS:** The app is built correctly and the Supabase server is working.

❌ **THE ISSUE:** Your Android device cannot reach the Supabase server on the internet.

This is a **network connectivity problem**, NOT an app bug.

**Most Likely Causes:**
1. 🚫 Your WiFi/network is blocking supabase.co (MOST COMMON)
2. 📡 No internet connection on your device
3. 🔒 VPN or firewall blocking the connection
4. 🏢 School/corporate network blocking external APIs

## The Solution (Pick One)

### Option 1: Test Supabase Access (MOST IMPORTANT)

**First, check if your network can reach Supabase:**

1. Open **Chrome browser** on your Android device
2. Visit: `https://knvrcozeveutvwallrgf.supabase.co/rest/v1/`
3. **What you see:**
   - ✅ **JSON text appears** (even if it says "error") = Supabase is reachable!
   - ❌ **"Site can't be reached"** = Your network is blocking Supabase

**If you see "Site can't be reached":**
- Try switching to **mobile data** instead of WiFi
- Disable any **VPN** you're using
- Try a **different WiFi network** (coffee shop, home, etc.)
- Contact your network admin if on school/work WiFi

### Option 2: Run Built-in Diagnostics

**When you see the error:**
1. The error dialog will have a "Test Connection" button
2. Tap **Test Connection**
3. Read the results

**Or from the profile screen:**
1. Open Kidopedia app (you'll be on the profile selection screen)
2. Scroll down and tap **Test Database Connection**
3. Read the results

The diagnostics will show exactly what's failing.

### Option 3: Check General Internet

1. Open Chrome browser on your Android device
2. Try visiting google.com
3. If it doesn't load, your internet is not working
4. Fix internet connection first, then try again

**Quick fixes for internet:**
- Turn WiFi off and on
- Switch to mobile data
- Toggle Airplane mode on/off
- Restart your device

### Option 3: Rebuild APK (If env vars missing)

If diagnostics show "Environment variables are missing":

**Using GitHub Actions:**

1. Go to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - Name: `EXPO_PUBLIC_SUPABASE_URL`
   - Value: `https://knvrcozeveutvwallrgf.supabase.co`
4. Click **New repository secret** again and add:
   - Name: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Value: (copy from your `.env` file - starts with `eyJ...`)
5. Go to **Actions** tab
6. Select **Build Kidopedia APK** workflow
7. Click **Run workflow** → **Run workflow**
8. Wait 10-15 minutes for build to complete
9. Download the new APK from artifacts
10. Uninstall old app, install new APK

**Or build locally:**

```bash
# Clone repo
git clone [your-repo-url]
cd kidopedia

# Create .env file
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=https://knvrcozeveutvwallrgf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EOF

# Install and build
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease

# APK at: android/app/build/outputs/apk/release/app-release.apk
```

## What This Update Fixed

This code update includes:

✅ **Better error messages** - Shows exact problem instead of generic error
✅ **30-second timeout** - Gives network more time to respond
✅ **Diagnostics tool** - Built into Settings to test connection
✅ **Detailed logging** - Easier to debug issues
✅ **Network config** - Better Android network permissions

## Still Having Issues?

Read the detailed guides:
- [NETWORK_FIX.md](./NETWORK_FIX.md) - Complete network troubleshooting
- [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md) - All Android issues

## Why This Happens

Common causes:
1. **No internet** - Device is offline or has poor connectivity
2. **Firewall blocking** - School/work network blocking Supabase
3. **Missing credentials** - APK built without environment variables
4. **DNS issues** - Device can't resolve Supabase domain

The diagnostics tool will identify which one it is.

## Need Help?

If none of this works:
1. Run diagnostics and screenshot the results
2. Check `adb logcat` if you have Android Studio
3. Try on a different network (mobile data vs WiFi)
4. Open an issue with the error details

---

**TL;DR:**
1. Run diagnostics in Settings
2. Check your internet
3. Rebuild APK if needed
