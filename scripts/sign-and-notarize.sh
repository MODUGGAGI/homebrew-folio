#!/bin/bash
# Signs Folio.app with Developer ID, notarizes it, staples the ticket and writes Folio.zip.
# Usage: scripts/sign-and-notarize.sh <Folio.app> <version>
#
# Env (from repository secrets):
#   DEVELOPER_ID_P12           base64 of the Developer ID Application .p12
#   DEVELOPER_ID_P12_PASSWORD  password of that .p12
#   ASC_KEY_P8                 App Store Connect team API key (.p8 text)
#   ASC_KEY_ID, ASC_ISSUER_ID  that key's id and issuer id
#   (the workflow signs the update for Sparkle separately with SPARKLE_ED_PRIVATE_KEY)
# SIGN_IDENTITY=- signs ad hoc and skips the keychain and notarization (local dry run).
set -euo pipefail
app="${1:?usage: $0 <Folio.app> <version>}"
version="${2:?usage: $0 <Folio.app> <version>}"
bundle_id=io.github.moduggagi.folio
# Sparkle reads updates from the latest release; the public key checks they were signed with SPARKLE_ED_PRIVATE_KEY.
feed=https://github.com/MODUGGAGI/homebrew-folio/releases/latest/download/appcast.xml
ed_public_key=4pTKp7+0XM6oULgZ9evC19nlYVt+BvMKqPXcjQJ8+KU=
# TelemetryDeck app ids for anonymous usage events (not secrets: they only name where events go).
# "Folio" counts real use and "Folio Dev" takes everything else. folio's mac/scripts/bundle.sh builds with the
# Dev id; only a real release (no suffix in the version) gets the Folio id here, so a trial release
# (1.2.0-test1) and a local build never count as real use.
telemetry_app_id=81368791-0473-4E77-9403-10931CF07C3B
[[ "$version" == *-* ]] && telemetry_app_id=CA439BA5-E092-4C7B-B4C8-5AF41116A662
tmp="${RUNNER_TEMP:-$(mktemp -d)}"

plist="$app/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $bundle_id" \
    -c "Set :CFBundleShortVersionString $version" \
    -c "Set :CFBundleVersion $version" \
    -c "Add :SUFeedURL string $feed" \
    -c "Add :SUPublicEDKey string $ed_public_key" \
    -c "Add :SUEnableAutomaticChecks bool true" \
    -c "Add :SUAutomaticallyUpdate bool true" "$plist"
# Delete first: a tag from before bundle.sh wrote the id has none. FolioTelemetryTestMode is from the
# first version of this, which told test events apart by a flag instead of by app.
/usr/libexec/PlistBuddy -c "Delete :FolioTelemetryAppID" "$plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Delete :FolioTelemetryTestMode" "$plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :FolioTelemetryAppID string $telemetry_app_id" "$plist"

identity="${SIGN_IDENTITY:-}"
if [[ -z "$identity" ]]; then
    kc="$tmp/signing.keychain-db"
    kc_pw="$(uuidgen)"
    security create-keychain -p "$kc_pw" "$kc"
    security set-keychain-settings -lut 3600 "$kc"
    security unlock-keychain -p "$kc_pw" "$kc"
    printf '%s' "$DEVELOPER_ID_P12" | base64 --decode > "$tmp/cert.p12"
    security import "$tmp/cert.p12" -k "$kc" -P "$DEVELOPER_ID_P12_PASSWORD" -T /usr/bin/codesign >/dev/null
    rm -f "$tmp/cert.p12"
    # codesign needs the intermediate CA to build the chain; a fresh keychain lacks it.
    curl -fsSL https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer -o "$tmp/DeveloperIDG2CA.cer"
    security import "$tmp/DeveloperIDG2CA.cer" -k "$kc" >/dev/null
    security set-key-partition-list -S apple-tool:,apple: -s -k "$kc_pw" "$kc" >/dev/null
    # codesign looks up identities through the search list, so add ours in front.
    security list-keychains -d user -s "$kc" $(security list-keychains -d user | tr -d '"')
    identity="$(security find-identity -v -p codesigning "$kc" | awk '/Developer ID Application/ { print $2; exit }')"
    [[ -n "$identity" ]] || { echo "No Developer ID Application identity in the .p12" >&2; exit 1; }
fi

# Nested code first, the app last. Signing never runs the code it signs.
# Hardened runtime only loads libraries from the same team; ad hoc has none, so the dry run leaves it off.
flags=(--options runtime --timestamp)
[[ "$identity" == - ]] && flags=()
# bash 3.2 treats an empty array as unbound under set -u, hence the + form.
sign() { codesign --force ${flags[@]+"${flags[@]}"} --sign "$identity" "$@"; }
sparkle="$app/Contents/Frameworks/Sparkle.framework"
if [[ -d "$sparkle" ]]; then
    # Order from Sparkle's documentation; Downloader.xpc keeps its entitlements.
    sign "$sparkle/Versions/B/XPCServices/Installer.xpc"
    sign --preserve-metadata=entitlements "$sparkle/Versions/B/XPCServices/Downloader.xpc"
    sign "$sparkle/Versions/B/Autoupdate"
    sign "$sparkle/Versions/B/Updater.app"
    sign "$sparkle"
fi
for bin in "$app"/Contents/MacOS/*; do
    [[ "$(basename "$bin")" == Folio ]] && continue
    sign "$bin"
done
sign "$app"
codesign --verify --strict --deep --verbose=2 "$app"

zip=Folio.zip
rm -f "$zip"
ditto -c -k --keepParent "$app" "$zip"

notarize() {
    [[ "$identity" == - ]] && return
    printf '%s' "$ASC_KEY_P8" > "$tmp/AuthKey.p8"
    local auth=(--key "$tmp/AuthKey.p8" --key-id "$ASC_KEY_ID" --issuer "$ASC_ISSUER_ID") result
    result="$(xcrun notarytool submit "$1" "${auth[@]}" --wait --timeout 30m --output-format json)"
    echo "$result"
    if [[ "$(jq -r .status <<<"$result")" != Accepted ]]; then
        xcrun notarytool log "$(jq -r .id <<<"$result")" "${auth[@]}" || true
        rm -f "$tmp/AuthKey.p8"
        exit 1
    fi
    rm -f "$tmp/AuthKey.p8"
}

notarize "$zip"
if [[ "$identity" != - ]]; then
    xcrun stapler staple "$app"
    spctl --assess --type execute --verbose=2 "$app"
    # Re-zip so the download carries the stapled ticket.
    rm -f "$zip"
    ditto -c -k --keepParent "$app" "$zip"
fi
echo "Wrote $zip"

# Drag-to-install disk image for the website's download button; Sparkle and the cask keep using the zip.
dmg=Folio.dmg
"$(dirname "$0")/make-dmg.sh" "$app" "$dmg"
codesign --force --timestamp --sign "$identity" "$dmg"
notarize "$dmg"
if [[ "$identity" != - ]]; then
    xcrun stapler staple "$dmg"
    spctl --assess --type open --context context:primary-signature --verbose=2 "$dmg"
fi
echo "Wrote $dmg"
