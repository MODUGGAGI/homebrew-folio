cask "folio" do
  version "1.3.0"
  sha256 "d8d900612b717b12a6133042f1fb531728af3cf876b147d48917bb349ee6f308"

  url "https://github.com/MODUGGAGI/homebrew-folio/releases/download/v#{version}/Folio.zip"
  name "Folio"
  desc "Local library for resumes, portfolios and job applications"
  homepage "https://github.com/MODUGGAGI/homebrew-folio"

  auto_updates true
  depends_on macos: ">= :tahoe"

  app "Folio.app"
  binary "#{appdir}/Folio.app/Contents/MacOS/folio-mcp"
end
