# YIRA Android app (Trusted Web Activity)

The Android app is a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity)
around the **deployed mobile PWA** (`apps/mobile`). It opens the site full-screen with no browser UI and
reuses its cookie login, service worker and offline cache. A new web deploy updates the app without
publishing a new APK.

## 1. Deploy the PWA (HTTPS required)
1. Create a Vercel project with **Root Directory** `frontend/apps/mobile`, framework "Vite", and
   install command `pnpm install` (Vercel detects the workspace).
2. `vercel.json` proxies `/api`, `/_allauth` and `/admin` to the Django backend
   (`https://yira.onrender.com`), so the app and API share one origin and the session cookie works.
3. Open `https://<host>/manifest.webmanifest`. It must load, and Chrome DevTools → Application →
   Manifest should report the app as installable.

## 2. Configure
Replace every `REPLACE_WITH_MOBILE_HOST` in `twa-manifest.json` with the host from step 1, for example:

```bash
sed -i 's/REPLACE_WITH_MOBILE_HOST/yira-mobile.vercel.app/g' twa-manifest.json
```

## 3. Build the APK / AAB
This needs Node, **JDK 17** and the **Android SDK**. Bubblewrap offers to download both on first run.

```bash
cd frontend/apps/mobile/twa
npx @bubblewrap/cli doctor              # checks the JDK and SDK
npx @bubblewrap/cli update              # generates the Android project from twa-manifest.json
npx @bubblewrap/cli build               # creates android.keystore on first run, then signs
```

The output is `app-release-signed.apk`, to install or sideload, and `app-release-bundle.aab`, for Google Play.
**Keep `android.keystore` and its passwords safe.** Updates must be signed with the same key. The
keystore is git-ignored.

## 4. Verify the domain (removes the browser address bar)
1. Get the SHA-256 fingerprint of the signing key:
   `keytool -list -v -keystore android.keystore -alias yira`. If you use Play App Signing, take the
   fingerprint from Play Console → App integrity instead.
2. Put it in `apps/mobile/public/.well-known/assetlinks.json` (replace
   `REPLACE_WITH_SIGNING_KEY_SHA256_FINGERPRINT`) and redeploy.
3. Check `https://<host>/.well-known/assetlinks.json`, or use Google's
   [Statement List tester](https://developers.google.com/digital-asset-links/tools/generator).

Until the fingerprint matches, Android shows the app with a small URL bar (Custom Tab fallback).

## No-install alternative
[PWABuilder](https://www.pwabuilder.com) → enter the deployed URL → *Package for stores* → Android.
It generates the same TWA package plus a signing key and `assetlinks.json` content.
