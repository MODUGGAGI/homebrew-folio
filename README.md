# homebrew-folio

Folio 설치용 Homebrew tap입니다.

```bash
brew tap moduggagi/folio
brew trust moduggagi/folio
brew install --cask folio
```

직접 받기: [Folio.zip](https://github.com/MODUGGAGI/homebrew-folio/releases/latest/download/Folio.zip)

## 릴리스

`MODUGGAGI/folio`의 `main`에 새 `VERSION`이 합쳐지면 그 저장소의 workflow가 태그를 만들고 이 저장소의 `release` workflow를 시작합니다. 손으로는 `MODUGGAGI/folio`에서 `scripts/release.sh 1.2.0`을 실행합니다. 전체 흐름은 `MODUGGAGI/folio`의 `RELEASING.md`에 있습니다. 이 저장소의 `release` workflow가 빌드, Developer ID 서명, 공증, staple, Release 업로드, `Casks/folio.rb` 갱신을 합니다.

PR을 올리면 `check` workflow가 릴리스 스크립트의 문법과 appcast, cask 형식을 검사합니다.

`build` job만 folio 코드를 실행하고 서명 비밀값을 받지 않습니다. `sign` job은 이 저장소의 스크립트만 실행합니다.

`Folio.dmg`를 열었을 때의 창 모양(배경, 아이콘 위치, 창 크기)은 `dmg/`에 있습니다. 배경은 `dmg/background.svg`를 고친 뒤 `swift render-background.swift`로, 그다음 `dmg/make-template.sh`로 `dmg/template.dmg`를 다시 만들고 결과 파일을 커밋합니다. 아이콘 위치와 창 크기도 `dmg/make-template.sh`에서 고칩니다.

서명 스크립트는 접미사 없는 정식 릴리스에서만 사용 기록의 시험 표시(`FolioTelemetryTestMode`)를 끕니다. 랜딩 페이지의 방문 측정(GoatCounter)을 포함한 구조와 시험 방법은 `MODUGGAGI/folio`의 `TELEMETRY.md`에 있습니다.

비밀값: `FOLIO_DEPLOY_KEY`, `DEVELOPER_ID_P12`, `DEVELOPER_ID_P12_PASSWORD`, `ASC_KEY_P8`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `SPARKLE_ED_PRIVATE_KEY`.

## 랜딩 페이지

`docs/`를 GitHub Pages로 서비스합니다: https://moduggagi.github.io/homebrew-folio/

고치는 방법과 도구는 [`landing/README.md`](landing/README.md)에 있습니다.
