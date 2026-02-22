# Android App Troubleshooting Guide

This guide helps you troubleshoot common issues with the Kidopedia Android app.

## "Create Profile Failed" Error

If you're getting a "create profile failed" error when trying to create a new profile, follow these steps:

### Step 1: Check App Logs

When the app starts, it should log Supabase configuration. Look for:

```
Supabase Configuration: {
  url: 'https://knvrcozeve...',
  keyPresent: true,
  keyLength: 220
}
```

If you see `CRITICAL: Supabase URL or Anon Key is missing!`, the environment variables are not configured properly in the APK.

### Step 2: Verify Internet Connection

1. Make sure your device has an active internet connection
2. Try opening a browser and visiting a website
3. Check if other apps can access the internet

### Step 3: Check for Detailed Error Messages

After the update, the error message should now include more details:
- Look for the specific error from Supabase
- Check if it's a network error or a database error
- Check the console logs for more information

### Step 4: Rebuild the APK with Environment Variables

If the environment variables are missing:

1. **For local builds:**
   ```bash
   # Make sure .env file exists in the project root
   cat .env

   # Should show:
   # EXPO_PUBLIC_SUPABASE_URL=https://...
   # EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

   # Rebuild
   npm install
   npx expo prebuild --platform android --clean
   cd android && ./gradlew assembleRelease
   ```

2. **For GitHub Actions builds:**
   - Verify the GitHub Secrets are set correctly
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Check that these exist:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Test Database Connection

You can test if the database is accessible by:

1. Opening the app
2. Looking at the console logs
3. You should see: `ProfileService: Creating profile` when you try to create a profile
4. If you see `ProfileService: Create profile error`, the detailed error will help identify the issue

## Common Error Messages

### "Failed to create profile: Network request failed"

**Cause**: The Android app cannot establish a network connection to Supabase servers. This is the most common error on Android.

**Solutions**:

1. **Check Internet Connection**
   - Open a browser and try loading a website
   - Make sure WiFi or mobile data is enabled and working
   - Try switching between WiFi and mobile data

2. **Verify Environment Variables in APK**
   - The APK must be built with Supabase credentials embedded
   - Run the Diagnostics test in Settings to check if credentials are present
   - If missing, rebuild the APK with proper environment variables

3. **Check Android Network Permissions**
   - Verify `app.json` has `usesCleartextTraffic: true`
   - Verify Android permissions in `app.json`:
     ```json
     "permissions": [
       "android.permission.INTERNET",
       "android.permission.ACCESS_NETWORK_STATE"
     ]
     ```

4. **DNS/Firewall Issues**
   - Try using a different WiFi network
   - Disable VPN if active
   - Check if corporate firewall is blocking Supabase domains
   - Try using mobile data instead of WiFi

5. **Rebuild APK with Latest Code**
   - This update includes better error handling and timeout configuration
   - Rebuild via GitHub Actions or locally
   - The new build has a 30-second timeout instead of default

### "Failed to create profile: Failed to fetch"

**Cause**: Network connection issue or the app can't reach Supabase servers

**Solutions**:
1. Check internet connection
2. Try disabling and re-enabling WiFi/mobile data
3. Check if a firewall or VPN is blocking the connection
4. Verify the Supabase URL is correct and accessible

### "Failed to create profile: Invalid API key"

**Cause**: The Supabase anonymous key is incorrect or expired

**Solutions**:
1. Get a new anonymous key from your Supabase dashboard
2. Update the `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` or GitHub Secrets
3. Rebuild the APK

### "Failed to create profile: Row Level Security policy violation"

**Cause**: Database RLS policies are blocking the insert

**Solutions**:
1. Check that the RLS policy "Public can create profiles" exists
2. Run this SQL in your Supabase SQL Editor:
   ```sql
   -- Check existing policies
   SELECT * FROM pg_policies WHERE tablename = 'kid_profiles';

   -- If missing, create the policy
   CREATE POLICY "Public can create profiles"
   ON kid_profiles FOR INSERT
   TO anon
   WITH CHECK (true);
   ```

### "Failed to create profile: Please enter a name"

**Cause**: Form validation failed

**Solutions**:
1. Make sure you entered a name
2. Name cannot be empty or just spaces

### "Failed to create profile: Please enter a valid age (2-18)"

**Cause**: Age validation failed

**Solutions**:
1. Enter an age between 2 and 18
2. Make sure it's a valid number

## Network Configuration Issues

### Android Network Security

Since Android 9+, cleartext (HTTP) traffic is blocked by default. Kidopedia uses HTTPS (Supabase), but if you're having network issues:

1. **Check the app.json configuration:**
   ```json
   "android": {
     "usesCleartextTraffic": true
   }
   ```

2. **Rebuild after making changes:**
   ```bash
   npx expo prebuild --platform android --clean
   ```

### SSL Certificate Issues

If you see SSL certificate errors:

1. Make sure your device's date and time are correct
2. Update your device's system certificates
3. Try on a different network

## Database Issues

### Check Database Tables Exist

Run this in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('kid_profiles', 'word_progress', 'daily_streak', 'achievements');
```

You should see all four tables listed.

### Check RLS Policies

Run this in Supabase SQL Editor:

```sql
-- Check RLS policies for kid_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'kid_profiles';
```

You should see policies for:
- Public can create profiles (INSERT)
- Public can view profiles (SELECT)
- Public can update profiles (UPDATE)
- Public can delete profiles (DELETE)

### Test Database Insert

Run this in Supabase SQL Editor to test if inserts work:

```sql
-- Test insert
INSERT INTO kid_profiles (name, age, gender, avatar_color)
VALUES ('Test Kid', 8, 'boy', '#3B82F6')
RETURNING *;

-- Clean up test data
DELETE FROM kid_profiles WHERE name = 'Test Kid';
```

If this fails, there's a database configuration issue.

## APK Build Issues

### Missing Environment Variables in APK

Environment variables must be embedded during build time:

1. **For local builds:**
   - `.env` file must exist in project root
   - Run `expo prebuild` to regenerate native code
   - Then build with `./gradlew assembleRelease`

2. **For GitHub Actions:**
   - Secrets must be set in GitHub repository
   - Workflow creates `.env` file automatically
   - If secrets are updated, rebuild the APK

### Verify Environment Variables in Build

To check if environment variables are in the APK:

1. Decompile the APK (using apktool or similar)
2. Look for the environment variables in the JavaScript bundle
3. Or add logging to the app to print configuration on startup

## Testing Checklist

Before reporting an issue, verify:

- [ ] Device has internet connection
- [ ] Supabase URL and key are configured
- [ ] App logs show Supabase configuration on startup
- [ ] Database tables exist in Supabase
- [ ] RLS policies are configured correctly
- [ ] Can insert data directly in Supabase SQL Editor
- [ ] APK was built with latest code and environment variables
- [ ] Device date and time are correct

## Getting More Help

If you're still stuck:

1. **Check the console logs:**
   - For Android: Use `adb logcat` or Android Studio's Logcat
   - Look for errors from `ProfileService` or `Supabase`

2. **Test with Expo Go first:**
   ```bash
   npm run dev
   # Scan QR code with Expo Go app
   ```
   If it works in Expo Go but not in APK, it's a build configuration issue.

3. **Check Supabase Status:**
   - Visit [Supabase Status](https://status.supabase.com/)
   - Check if there are any ongoing issues

4. **Create an Issue:**
   - Include the full error message
   - Include relevant console logs
   - Mention your Android version
   - Describe steps to reproduce

## Useful Commands

### Check APK Info
```bash
# Get APK info
aapt dump badging app-release.apk

# Check permissions
aapt dump permissions app-release.apk
```

### Android Debugging
```bash
# View real-time logs
adb logcat | grep -i kidopedia

# View React Native logs
adb logcat | grep -i ReactNative

# Clear app data
adb shell pm clear com.kidopedia.app

# Reinstall APK
adb install -r app-release.apk
```

### Supabase Testing
```bash
# Test connection from command line
curl https://knvrcozeveutvwallrgf.supabase.co/rest/v1/kid_profiles \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

**Remember**: Most "create profile failed" errors are due to:
1. Missing or incorrect environment variables in the APK
2. Network connectivity issues
3. Missing database tables or RLS policies

Follow the steps above systematically to identify and fix the issue!
