/**
 * Expo config plugin: withAndroidNetworkFix
 *
 * Fixes "Network request failed" in production Android APK builds by:
 *  1. Copying network_security_config.xml into the APK's res/xml/ directory.
 *  2. Adding android:networkSecurityConfig="@xml/network_security_config" to
 *     the <application> element in AndroidManifest.xml.
 *  3. Appending ProGuard/R8 rules that keep OkHttp's TLS-detection classes,
 *     which are otherwise stripped by R8 minification in release builds.
 *
 * Why this plugin is needed:
 *  Expo SDK 54 does NOT recognise "android.networkSecurityConfig" in app.json
 *  — the field is silently ignored during prebuild. Without this plugin the
 *  production APK has no explicit network security config, and OkHttp TLS
 *  classes are partially removed by R8, which can prevent HTTPS connections
 *  to certain hosts (e.g. Supabase) while leaving simpler hosts (e.g. Google)
 *  working.
 */

const {
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ── 1. Copy network_security_config.xml into res/xml/ ────────────────────────

function withNetworkSecurityConfig(config) {
  // withDangerousMod runs after the android project skeleton is created, so
  // the res/ tree already exists (or we create it here).
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const { platformProjectRoot, projectRoot } = config.modRequest;

      const srcFile = path.join(projectRoot, 'network_security_config.xml');
      const destDir = path.join(
        platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      const destFile = path.join(destDir, 'network_security_config.xml');

      if (!fs.existsSync(srcFile)) {
        console.warn(
          '[withAndroidNetworkFix] WARNING: network_security_config.xml not ' +
            'found at ' +
            srcFile +
            '. Skipping copy.',
        );
        return config;
      }

      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      console.log(
        '[withAndroidNetworkFix] Copied network_security_config.xml → ' +
          destFile,
      );

      return config;
    },
  ]);
}

// ── 2. Add android:networkSecurityConfig to <application> ────────────────────

function withNetworkSecurityManifest(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];

    if (!application.$) {
      application.$ = {};
    }

    // Only set if not already present (avoid duplicate from manual edits).
    if (!application.$['android:networkSecurityConfig']) {
      application.$['android:networkSecurityConfig'] =
        '@xml/network_security_config';
      console.log(
        '[withAndroidNetworkFix] Added android:networkSecurityConfig to ' +
          'AndroidManifest.xml',
      );
    }

    return config;
  });
}

// ── 3. Append OkHttp / TLS ProGuard rules ────────────────────────────────────

const OKHTTP_PROGUARD_RULES = `
# ── OkHttp / TLS rules added by plugins/withAndroidNetworkFix.js ─────────────
# OkHttp uses reflection to detect the platform TLS provider at runtime.
# Without these rules, R8 strips the classes and all HTTPS connections fail.

# Keep all OkHttp public API classes.
-keep class okhttp3.** { *; }
-keepnames class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Keep Okio (I/O layer used by OkHttp).
-keep class okio.** { *; }
-dontwarn okio.**

# OkHttp platform / TLS provider detection (loaded via reflection).
-keepnames class okhttp3.internal.platform.** { *; }
-keep class okhttp3.internal.platform.** { *; }
-keep class okhttp3.internal.platform.android.** { *; }

# Keep certificate handling classes.
-keepclassmembers class okhttp3.CertificatePinner { *; }
-keepclassmembers class okhttp3.internal.tls.** { *; }

# Conscrypt — Android's built-in modern TLS provider (loaded via reflection).
-keep class org.conscrypt.** { *; }
-dontwarn org.conscrypt.**
-keep class com.android.org.conscrypt.** { *; }
-dontwarn com.android.org.conscrypt.**

# Suppress warnings for optional alternative TLS providers that OkHttp
# checks for at runtime but are not present on Android.
-dontwarn org.bouncycastle.jsse.BCSSLParameters
-dontwarn org.bouncycastle.jsse.BCSSLSocket
-dontwarn org.bouncycastle.jsse.provider.BouncyCastleJsseProvider
-dontwarn org.openjsse.javax.net.ssl.SSLParameters
-dontwarn org.openjsse.javax.net.ssl.SSLSocket
-dontwarn org.openjsse.net.ssl.OpenJSSE
# ─────────────────────────────────────────────────────────────────────────────
`;

function withOkHttpProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const { platformProjectRoot } = config.modRequest;
      const proguardFile = path.join(
        platformProjectRoot,
        'app',
        'proguard-rules.pro',
      );

      if (!fs.existsSync(proguardFile)) {
        console.warn(
          '[withAndroidNetworkFix] proguard-rules.pro not found at ' +
            proguardFile +
            '. Skipping ProGuard rules.',
        );
        return config;
      }

      const existing = fs.readFileSync(proguardFile, 'utf8');
      if (existing.includes('withAndroidNetworkFix')) {
        // Already applied (e.g. prebuild run multiple times without --clean).
        return config;
      }

      fs.appendFileSync(proguardFile, OKHTTP_PROGUARD_RULES);
      console.log(
        '[withAndroidNetworkFix] Appended OkHttp ProGuard rules to ' +
          proguardFile,
      );

      return config;
    },
  ]);
}

// ── 4. Force HTTP/1.1 in OkHttp via MainApplication.kt patch ─────────────────
//
// OkHttp negotiates HTTP/2 via ALPN during TLS handshake. In some React
// Native production builds the HTTP/2 SETTINGS frame exchange is rejected
// by Cloudflare (which backs Supabase), causing "Network request failed"
// at the TCP level.  Forcing HTTP/1.1 avoids the negotiation entirely.
// (httpbin.org works in the failing build because it doesn't share Cloudflare's
// strict HTTP/2 enforcement — this is the classic symptom.)

const HTTP1_FACTORY_KOTLIN = `
    // ── Force HTTP/1.1 (plugins/withAndroidNetworkFix.js) ───────────────
    // OkHttp's HTTP/2 SETTINGS frame is rejected by Cloudflare in some RN
    // production builds, causing all Supabase fetches to fail at the TCP
    // level even though generic HTTPS works fine. HTTP/1.1 avoids this.
    com.facebook.react.modules.network.OkHttpClientProvider.setOkHttpClientFactory(
      object : com.facebook.react.modules.network.OkHttpClientFactory {
        override fun createNewNetworkModuleClient(): okhttp3.OkHttpClient =
          com.facebook.react.modules.network.OkHttpClientProvider
            .createClientBuilder()
            .protocols(listOf(okhttp3.Protocol.HTTP_1_1))
            .build()
      }
    )
    // ────────────────────────────────────────────────────────────────────`;

function withForceHttp1(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const { platformProjectRoot } = config.modRequest;

      // Derive the java source path from the android package name.
      const pkg = (config.android && config.android.package) || 'com.kidopedia.app';
      const pkgPath = pkg.replace(/\./g, path.sep);
      const mainAppFile = path.join(
        platformProjectRoot,
        'app', 'src', 'main', 'java', pkgPath, 'MainApplication.kt',
      );

      if (!fs.existsSync(mainAppFile)) {
        console.warn(
          '[withAndroidNetworkFix] MainApplication.kt not found at ' +
            mainAppFile + '. Skipping HTTP/1.1 patch.',
        );
        return config;
      }

      let content = fs.readFileSync(mainAppFile, 'utf8');

      // Already patched — idempotent.
      if (content.includes('Force HTTP/1.1 (plugins/withAndroidNetworkFix')) {
        return config;
      }

      // Insert the factory call right after `super.onCreate()`.  This is the
      // first statement inside MainApplication.onCreate() in every Expo-
      // generated template, so the replacement is unambiguous.
      const INSERTION_POINT = 'super.onCreate()';
      if (!content.includes(INSERTION_POINT)) {
        console.warn(
          '[withAndroidNetworkFix] Could not find "super.onCreate()" in ' +
            mainAppFile + '. Skipping HTTP/1.1 patch.',
        );
        return config;
      }

      content = content.replace(
        INSERTION_POINT,
        INSERTION_POINT + HTTP1_FACTORY_KOTLIN,
      );

      fs.writeFileSync(mainAppFile, content, 'utf8');
      console.log(
        '[withAndroidNetworkFix] Patched MainApplication.kt to force HTTP/1.1',
      );

      return config;
    },
  ]);
}

// ── Compose ───────────────────────────────────────────────────────────────────

module.exports = function withAndroidNetworkFix(config) {
  config = withNetworkSecurityConfig(config);
  config = withNetworkSecurityManifest(config);
  config = withOkHttpProguardRules(config);
  config = withForceHttp1(config);
  return config;
};
