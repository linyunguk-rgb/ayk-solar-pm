#!/bin/bash
# ════════════════════════════════════════════════════════════════
# AYK PTE LTD — Solar Project Management
# APK & AAB Build Script
# ════════════════════════════════════════════════════════════════
#
# This script builds the Android APK and AAB files for the Play Store.
#
# PREREQUISITES:
#   1. Node.js installed (https://nodejs.org)
#   2. Java JDK installed (https://adoptium.net)
#
# HOW TO RUN:
#   1. Save this file and the android.keystore file to a folder on your computer
#   2. Open Terminal (Mac) or Command Prompt (Windows)
#   3. Navigate to the folder: cd /path/to/folder
#   4. Run: bash build-apk.sh
#   5. Wait 5-10 minutes for the build to complete
#   6. The APK and AAB files will be in the "app-release" folder
#
# ════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════"
echo "  AYK Solar — Android APK/AAB Builder"
echo "═══════════════════════════════════════════════════"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from: https://nodejs.org"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Install from: https://adoptium.net"
    exit 1
fi
echo "✓ Java found: $(java -version 2>&1 | head -1)"

# Install bubblewrap if not installed
if ! command -v bubblewrap &> /dev/null; then
    echo "Installing Bubblewrap CLI..."
    npm install -g @bubblewrap/cli
fi
echo "✓ Bubblewrap found: $(bubblewrap --version 2>&1 | head -1)"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Step 1: Initialize Android project"
echo "═══════════════════════════════════════════════════"
echo ""

# Initialize the TWA project from the live manifest
bubblewrap init --manifest=https://ayk-solar-pm.vercel.app/manifest.json

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Step 2: Build APK and AAB"
echo "═══════════════════════════════════════════════════"
echo ""

# Build the release APK and AAB
bubblewrap build

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ BUILD COMPLETE!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  Your files are ready:"
echo ""
echo "  📱 APK file (for testing/direct install):"
echo "     app-release-signed.apk"
echo ""
echo "  📦 AAB file (for Play Store upload):"
echo "     app-release-bundle.aab"
echo ""
echo "  ─────────────────────────────────────────"
echo "  Play Store Upload Instructions:"
echo "  ─────────────────────────────────────────"
echo "  1. Go to: https://play.google.com/console"
echo "  2. Create a new app"
echo "  3. Upload the .aab file"
echo "  4. Set Privacy Policy URL:"
echo "     https://ayk-solar-pm.vercel.app/legal/privacy"
echo "  5. Submit for review (1-3 days)"
echo ""
echo "  ─────────────────────────────────────────"
echo "  Direct Install (APK):"
echo "  ─────────────────────────────────────────"
echo "  1. Transfer the .apk file to an Android phone"
echo "  2. Open the file on the phone"
echo "  3. Allow installation from unknown sources"
echo "  4. Install and open"
echo ""
echo "═══════════════════════════════════════════════════"
