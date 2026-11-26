cask "folio" do
  version "1.5.3"
  sha256 "d77798cde4f99e2be2089aaa147964b843d05e21fad6b3667c1ce8bb24036e75"

  url "https://github.com/MODUGGAGI/homebrew-folio/releases/download/v#{version}/Folio.zip"
  name "Folio"
  desc "Local library for resumes, portfolios and job applications"
  homepage "https://github.com/MODUGGAGI/homebrew-folio"

  auto_updates true
  depends_on macos: ">= :sequoia"

  app "Folio.app"
  binary "#{appdir}/Folio.app/Contents/MacOS/folio-mcp"
end
