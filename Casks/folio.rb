cask "folio" do
  version "1.3.1"
  sha256 "c85d65818bd6c233df46956f0ad00bc173bc7dc784c123389809a567bdb12081"

  url "https://github.com/MODUGGAGI/homebrew-folio/releases/download/v#{version}/Folio.zip"
  name "Folio"
  desc "Local library for resumes, portfolios and job applications"
  homepage "https://github.com/MODUGGAGI/homebrew-folio"

  auto_updates true
  depends_on macos: ">= :tahoe"

  app "Folio.app"
  binary "#{appdir}/Folio.app/Contents/MacOS/folio-mcp"
end
