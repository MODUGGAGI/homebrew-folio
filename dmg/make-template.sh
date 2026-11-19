#!/bin/bash
# Remakes dmg/template.dmg, an empty disk image that already has the window size, icon positions
# and background. scripts/make-dmg.sh copies the app into it, so the release workflow needs no Finder.
# Finder stores the background as a link to this exact volume, which is why the layout cannot be
# copied onto a new image as a loose .DS_Store file.
# Finder writes the layout, so this needs a Mac with a logged-in desktop and no other volume named Folio.
# Run it after changing the layout below or background.tiff, and commit the new template.dmg.
# Usage: dmg/make-template.sh
set -euo pipefail
cd "$(dirname "$0")"
[[ ! -e /Volumes/Folio ]] || { echo "Eject the mounted Folio volume first" >&2; exit 1; }
tmp="$(mktemp -d)"
# Room for the app; empty space costs nothing once the image is compressed.
hdiutil create -quiet -size 300m -fs HFS+ -volname Folio "$tmp/layout.dmg"
hdiutil attach -quiet "$tmp/layout.dmg"
vol=/Volumes/Folio
# Stand-ins with the final names, so Finder can record their positions.
mkdir "$vol/Folio.app" "$vol/.background"
ln -s /Applications "$vol/Applications"
cp background.tiff "$vol/.background/background.tiff"

# The window is 660x440 plus Finder's 28pt title bar; icon positions are the icons' centers.
osascript <<'APPLESCRIPT'
tell application "Finder"
    tell disk "Folio"
        open
        set w to container window
        set current view of w to icon view
        set toolbar visible of w to false
        set statusbar visible of w to false
        set pathbar visible of w to false
        set bounds of w to {200, 120, 860, 588}
        set o to icon view options of w
        set arrangement of o to not arranged
        set icon size of o to 128
        set text size of o to 13
        set background picture of o to file ".background:background.tiff"
        set position of item "Folio.app" to {180, 190}
        set position of item "Applications" to {480, 190}
        update without registering applications
        delay 2
        close
    end tell
end tell
APPLESCRIPT

sync
hdiutil detach -quiet "$vol"
rm -f template.dmg
hdiutil convert -quiet "$tmp/layout.dmg" -format UDZO -imagekey zlib-level=9 -o template.dmg
rm -rf "$tmp"
echo "Wrote $(pwd)/template.dmg"
