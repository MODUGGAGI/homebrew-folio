cask "folio" do
  version "1.2.1"
  sha256 "4bed3aea31bec2e17c6080218f27fac6a63aa40185b900e5477cb972b46a37cf"

  url "https://github.com/MODUGGAGI/homebrew-folio/releases/download/v#{version}/Folio.zip"
  name "Folio"
  desc "Local library for resumes, portfolios and job applications"
  homepage "https://github.com/MODUGGAGI/homebrew-folio"

  auto_updates true
  depends_on macos: ">= :tahoe"

  app "Folio.app"
  binary "#{appdir}/Folio.app/Contents/MacOS/folio-mcp"
end
