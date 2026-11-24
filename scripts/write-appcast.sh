#!/bin/bash
# Prints the Sparkle appcast for one release. Usage: scripts/write-appcast.sh <version> '<sign_update output>'
# sign_update prints: sparkle:edSignature="..." length="..."
set -euo pipefail
version="${1:?usage: $0 <version> <sign_update output>}"
attrs="${2:?usage: $0 <version> <sign_update output>}"
[[ "$attrs" =~ ^sparkle:edSignature=\"[A-Za-z0-9+/=]+\"\ length=\"[0-9]+\"$ ]] || { echo "Bad sign_update output: $attrs" >&2; exit 1; }

cat <<XML
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle">
  <channel>
    <title>Folio</title>
    <item>
      <title>Folio $version</title>
      <pubDate>$(LC_ALL=C date -u '+%a, %d %b %Y %H:%M:%S +0000')</pubDate>
      <sparkle:version>$version</sparkle:version>
      <sparkle:shortVersionString>$version</sparkle:shortVersionString>
      <sparkle:minimumSystemVersion>15.0</sparkle:minimumSystemVersion>
      <enclosure url="https://github.com/MODUGGAGI/homebrew-folio/releases/download/v$version/Folio.zip" $attrs type="application/octet-stream"/>
    </item>
  </channel>
</rss>
XML
