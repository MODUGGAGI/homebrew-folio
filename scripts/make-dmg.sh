#!/bin/bash
# Builds the drag-to-install disk image: Folio.app and an Applications alias inside dmg/template.dmg,
# which already has the window size, icon positions and background (dmg/make-template.sh remakes it).
# Usage: scripts/make-dmg.sh <Folio.app> <Folio.dmg>
set -euo pipefail
app="${1:?usage: $0 <Folio.app> <Folio.dmg>}"
dmg="${2:?usage: $0 <Folio.app> <Folio.dmg>}"
assets="$(cd "$(dirname "$0")/../dmg" && pwd)"
tmp="$(mktemp -d)"

hdiutil convert -quiet "$assets/template.dmg" -format UDRW -o "$tmp/rw.dmg"
# -nobrowse keeps Finder away, so it cannot rewrite the layout while the image is open.
mkdir "$tmp/mount"
hdiutil attach -quiet -nobrowse -mountpoint "$tmp/mount" "$tmp/rw.dmg"
ditto "$app" "$tmp/mount/Folio.app"
# The alias only improves the icon; the template's symlink installs just as well if it cannot be made.
swift "$assets/make-applications-alias.swift" "$tmp/mount/Applications" || ln -sfn /Applications "$tmp/mount/Applications"
hdiutil detach -quiet "$tmp/mount"

rm -f "$dmg"
hdiutil convert -quiet "$tmp/rw.dmg" -format UDZO -imagekey zlib-level=9 -o "$dmg"
rm -rf "$tmp"
