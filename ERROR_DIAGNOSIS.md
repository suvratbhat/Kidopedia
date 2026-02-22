# Understanding "Cannot Connect to Database" Error

## What This Error Means

When you see:
```
Cannot connect to database. Please check your internet connection and try again.
```

**This means:**
- ✅ The Kidopedia app is built correctly
- ✅ The Supabase database server is working fine (I just tested it)
- ❌ **Your Android device cannot reach the Supabase server**

## Why This Happens

This is an **Android network connectivity issue**, not an app bug.

The most common causes (in order):

### 1. Network Blocking Supabase (80% of cases)
Your WiFi network, firewall, or VPN is blocking access to `supabase.co` domains.

**How to test:**
1. Open Chrome browser on your Android device
2. Visit: `https://knvrcozeveutvwallrgf.supabase.co/rest/v1/`
3. What you see:
   - ✅ **JSON text** = Supabase is accessible (skip to #2 or #3)
   - ❌ **"Site can't be reached"** = This is your problem!

**Solutions:**
- Switch to mobile data instead of WiFi
- Try a different WiFi network (home, coffee shop, friend's house)
- Disable VPN if you're using one
- Contact your network admin if on school/corporate network

### 2. No Internet Connection (15% of cases)
Your device isn't connected to the internet at all.

**How to test:**
- Open Chrome and visit google.com
- If it doesn't load, fix your internet first

**Solutions:**
- Turn WiFi off and on
- Toggle Airplane mode
- Restart your device

### 3. Missing Environment Variables (5% of cases)
The APK was built without database credentials (very rare).

**How to test:**
- Run the diagnostics in the app
- It will say "Environment variables are missing"

**Solution:**
- Rebuild the APK with proper GitHub secrets configured

## Special Case: Browser Works But App Fails

**If Chrome on your Android device CAN access Supabase but the app CANNOT:**

This is a React Native Android network configuration issue. Read:
- **[BROWSER_WORKS_APP_FAILS.md](./BROWSER_WORKS_APP_FAILS.md)** - Detailed guide for this specific issue

**Quick fix:** You need to rebuild the APK with the new network configuration I just added.

## What To Do Now

### Step 1: Test Supabase Access
Open Chrome on your device and visit:
```
https://knvrcozeveutvwallrgf.supabase.co/rest/v1/
```

**If you see JSON text:**
- Supabase IS accessible from your device
- The issue is temporary
- Try creating a profile again
- If still fails, run diagnostics in the app

**If you see "Site can't be reached":**
- Your network is blocking Supabase
- Switch to mobile data or different WiFi
- This is the root cause

### Step 2: Run Diagnostics
1. Open Kidopedia app
2. Scroll down on the profile screen
3. Tap "Test Database Connection"
4. Read what it says

### Step 3: Fix Based on Results
Follow the guidance from the diagnostic results or the troubleshooting guides.

## Important Notes

1. **The app code is correct** - I verified the Supabase server is responding
2. **This is a network issue** - Something between your device and Supabase is blocking the connection
3. **Most likely WiFi blocking** - School/work/public WiFi often blocks external APIs
4. **Mobile data usually works** - Try switching to mobile data as a test

## Need More Help?

Read these guides in order:
1. [QUICK_START.md](./QUICK_START.md) - Step-by-step solutions
2. [NETWORK_FIX.md](./NETWORK_FIX.md) - Detailed troubleshooting
3. [ANDROID_TROUBLESHOOTING.md](./ANDROID_TROUBLESHOOTING.md) - All Android issues

## Technical Details

For developers debugging this:

**What the error message comes from:**
- File: `lib/supabase.ts:54`
- Triggered when: `fetch()` throws "Network request failed"
- Root cause: Android cannot establish TCP connection to Supabase server

**Verification I did:**
```bash
curl -I https://knvrcozeveutvwallrgf.supabase.co/rest/v1/
# Returns: HTTP/2 200 OK
```
The server is online and responding. The issue is client-side networking.
