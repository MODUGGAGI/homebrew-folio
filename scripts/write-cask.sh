#!/bin/bash
# Prints Casks/folio.rb for one release. Usage: scripts/write-cask.sh <version> <sha256>
set -euo pipefail
version="${1:?usage: $0 <version> <sha256>}"
sha="${2:?usage: $0 <version> <sha256>}"
[[ "$sha" =~ ^[0-9a-f]{64}$ ]] || { echo "Bad sha256: $sha" >&2; exit 1; }

cat <<CASK
cask "folio" do
  version "$version"
  sha256 "$sha"

  url "https://github.com/MODUGGAGI/homebrew-folio/releases/download/v#{version}/Folio.zip"
  name "Folio"
  desc "Local library for resumes, portfolios and job applications"
  homepage "https://github.com/MODUGGAGI/homebrew-folio"

  auto_updates true
  depends_on macos: ">= :sequoia"

  app "Folio.app"
  binary "#{appdir}/Folio.app/Contents/MacOS/folio-mcp"
end
CASK
