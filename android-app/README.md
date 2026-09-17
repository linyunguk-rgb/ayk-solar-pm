# AYK Solar — Android APK Build Guide

## Quick Start (3 Steps)

### Step 1: Install Prerequisites
Install these on your computer (if not already installed):
- **Node.js**: Download from https://nodejs.org (choose LTS version)
- **Java JDK**: Download from https://adoptium.net (choose JDK 17+)

### Step 2: Download These Files
Save these 2 files to a new folder on your computer (e.g., `Desktop/ayk-build/`):
1. `build-apk.sh` — the build script
2. `android.keystore` — the signing key

### Step 3: Run the Build
1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to the folder:
   ```
   cd Desktop/ayk-build
   ```
3. Run the build script:
   ```
   bash build-apk.sh
   ```
4. Wait 5-10 minutes (it downloads the Android SDK on first run)
5. Your APK and AAB files will be ready in the folder!

---

## What You Get

| File | Purpose | How to Use |
|------|---------|------------|
| `app-release-signed.apk` | Android app installer | Send to phones — they install directly |
| `app-release-bundle.aab` | Play Store package | Upload to Google Play Console |

---

## Giving the APK to Enterprise Customers

### Option A: Direct Install
1. Send the `.apk` file to your customer (email, WhatsApp, USB, etc.)
2. They save it to their Android phone
3. They open the file → allow "Install from unknown sources" → Install
4. They open the app → see the landing page → enter their access code

### Option B: Play Store
1. Upload the `.aab` file to https://play.google.com/console
2. Fill in the app listing
3. Set Privacy Policy URL: `https://ayk-solar-pm.vercel.app/legal/privacy`
4. Submit for review (takes 1-3 days)
5. Once approved, anyone can download from the Play Store

---

## Signing Information

If you need to update the app later, use the SAME keystore:

| Field | Value |
|-------|-------|
| Keystore file | `android.keystore` |
| Keystore password | `ayk2025solar` |
| Key alias | `android` |
| Key password | `ayk2025solar` |

**⚠️ IMPORTANT:** Keep the `android.keystore` file safe. If you lose it, you cannot update the app on the Play Store. You would need to create a new app listing.

---

## Troubleshooting

### "node: command not found"
→ Install Node.js from https://nodejs.org

### "java: command not found"
→ Install Java JDK from https://adoptium.net

### "bubblewrap: command not found"
→ Run: `npm install -g @bubblewrap/cli`

### Build takes forever
→ The first build downloads the Android SDK (~500MB). Subsequent builds are faster.

### "Could not download Android SDK"
→ Check your internet connection. The SDK download is large. Try again.

---

## App Details

| Field | Value |
|-------|-------|
| Package name | `sg.ayk.solarpm` |
| App name | AYK Solar Project Management |
| Version | 1.0.0 |
| Min Android version | 5.0 (API 21) |
| Target Android version | 14 (API 34) |
| App URL | https://ayk-solar-pm.vercel.app |

---

## Alternative: PWABuilder (No Terminal Needed)

If you don't want to run terminal commands, use PWABuilder:

1. Go to https://www.pwabuilder.com
2. Enter: `https://ayk-solar-pm.vercel.app`
3. Click "Start"
4. Click "Package for Stores" → Android
5. Download the ZIP file
6. The ZIP contains the APK and AAB files

---

© 2025 AYK PTE LTD. Solar Energy • Build a Brighter Future.
