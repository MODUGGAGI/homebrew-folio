# Folio 랜딩 페이지

`docs/`가 페이지 그 자체다. 빌드 단계가 없는 정적 페이지이고, GitHub Pages가 `main` 브랜치의 `/docs`를 그대로 서비스한다. 상대 경로만 쓰므로 `https://moduggagi.github.io/homebrew-folio/` 같은 하위 경로에서도 동작한다.

이 폴더(`landing/`)에는 배포하지 않는 도구만 둔다.

## 로컬에서 보기

```bash
python3 -m http.server 8765 --directory docs
```

브라우저로 `http://127.0.0.1:8765/`를 연다. `file://`로 열면 문서 메모(`notes.json`)를 못 읽어 코드 안의 기본값을 쓴다.

## 배포

`docs/`를 고쳐 `main`에 push하면 1~2분 뒤 `https://follio.page/`에 반영된다. release workflow가 cask와 appcast를 push하므로 push 전에 먼저 받는다.

```bash
git pull --rebase
```

CSS나 JS를 고치면 `docs/index.html`에서 그 파일 주소 끝의 `?v=` 값을 바꾼다. GitHub Pages가 10분 캐시를 걸어 두어서, 바꾸지 않으면 새 HTML이 예전 CSS와 함께 보일 수 있다.

## 구성

- `docs/index.html`, `docs/assets/css/style.css`, `docs/assets/js/main.js`: 히어로, 기능, AI 연결, 설치
- `docs/assets/js/app-demo.js`, `docs/assets/css/app-demo.css`: HTML로 다시 그린 Folio 창. 장면과 시간은 파일 맨 위 `SHOWCASE` 하나에서 바꾼다
- `docs/assets/docs/`: 쇼케이스에 뜨는 가상 인물(홍길동) 이력서, 포트폴리오, 공고용 이력서
- `docs/assets/app/`: 회사 파비콘과 네이버웹툰 공고 화면
- `docs/assets/shots/og.png`: 링크 공유 미리보기 이미지(1200x630). 히어로의 로고와 제목을 찍은 것이다
- `docs/assets/js/metal.js`: 복사 버튼의 메탈 링([metal-fx](https://www.npmjs.com/package/metal-fx), MIT). 빌드 결과물이다. 원본은 `landing/metal/`이고, WebGL2가 없으면 CSS 링이 대신 보인다
- `landing/capture/`: 실제 앱 화면을 찍을 때 쓰는 데모 라이브러리 생성기

## 메탈 링 다시 빌드

```bash
npm --prefix landing/metal install && npm --prefix landing/metal run build
```

## 실제 앱 화면 다시 찍기

실제 라이브러리를 건드리지 않도록 데모 홈 폴더로 앱을 띄운다. 앱은 folio 저장소에서 빌드한 `Folio.app`을 쓴다.

```bash
python3 -I landing/capture/make-demo-library.py /tmp/folio-demo-home
```

```bash
CFFIXED_USER_HOME=/tmp/folio-demo-home /path/to/Folio.app/Contents/MacOS/Folio
```

이미 쓰는 Folio가 켜져 있으면 번들 id가 같아 헷갈린다. 앱을 복사해 `CFBundleIdentifier`를 바꾸고 다시 서명한 사본으로 띄운다.

## 링크

설치 명령은 세 줄이다. Homebrew 7은 신뢰하지 않은 tap의 cask를 거부하므로 `brew trust`가 필요하다.

```bash
brew tap moduggagi/folio && brew trust moduggagi/folio && brew install --cask folio
```

다운로드 버튼은 항상 최신 Release의 `https://github.com/MODUGGAGI/homebrew-folio/releases/latest/download/Folio.dmg`를 가리킨다. `Folio.zip`은 Sparkle 자동 업데이트와 Homebrew cask가 쓴다.
