'use strict';

/*
 * SHOWCASE: the app demo's script and timing, all in one place (milliseconds).
 * A scene plays only when its tab is clicked (scene one also plays once when the window first comes into view), always
 * from the state the scenes before it leave. Its `steps` are things the pointer clicks, in order; a click does
 * exactly what that control does in the app (see `act`). A step can carry its own `hold`; `type` types that text
 * into the clicked field; `scroll` moves the pointer there without pressing.
 *   lead:  pause after a scene starts, before the pointer moves
 *   move:  pointer travel time to the next target
 *   press: pointer down before the click lands
 *   loop:  pause after a scene's last step before it plays again from the start
 *   hold:  wait after a click before the next step
 *   key:   time per typed letter
 *   load:  how long 공고를 불러오는 중… shows before the page is loaded
 */
const POSTING_URL = 'https://recruit.webtoonscorp.com/rcrt/view.do?annoId=30005648';
// The sentence the last scene types at the end of the second answer, so the character count moves.
const CL_TYPED = ' k6로 초당 500건의 조회 부하를 걸어 커넥션 풀 크기를 맞추고 오류율 0%를 확인했습니다.';
const SHOWCASE = {
  lead: 350,
  move: 600,
  press: 130,
  loop: 1600,
  hold: 900,
  key: 26,
  load: 1200,
  scenes: [
    { tab: '버전 관리', title: '고칠 때마다 버전으로', text: '고칠 때마다 버전이 쌓이고 최신 버전과 이전 버전들을 비교해요.', note: '※ 수정된 부분을 직접 짚어 주는 비교는 HTML 이력서에서만 지원해요.',
      steps: [
        { at: 'row:resume', hold: 500 },
        { at: 'ver:resume:1', hold: 1000 },
        { at: 'ver:resume:2', hold: 1000 },
        { at: 'ver:resume:3', hold: 1000 },
        { at: 'ver:resume:4', hold: 800 },
        { at: 'tb:compare', hold: 2200 },
        { at: 'tb:compare' },
      ] },
    { tab: '공고 추가', title: '공고 추가', text: '공고 주소만 붙여 넣으면 본문까지 저장돼요.',
      steps: [
        { at: 'sb:addApp', hold: 500 },
        { at: 'sheet:url', type: POSTING_URL, hold: 400 },
        { at: 'sheet:load', hold: 2000 },
        { at: 'sheet:add', hold: 1050 },
        { at: 'post:scroll:560', scroll: true, hold: 1300 },
      ] },
    { tab: '공고별 이력서 / 자기소개서', title: '공고마다 따로 두는 이력서와 자기소개서', text: '공고마다 이력서를 따로 다듬고 자기소개서도 그 공고 안에 함께 보관해요.',
      steps: [
        { at: 'row:daangn', hold: 1400 },
        { at: 'row:webtoon', hold: 1600 },
        { at: 'app:cl', hold: 900 },
        { at: 'cl:answer:2', type: CL_TYPED, hold: 2200 },
      ] },
  ],
};

(() => {
  const frame = document.getElementById('app-demo');
  if (!frame) return;

  /* Data: the demo library. Notes come from assets/docs/<doc>/notes.json; these are the fallback (file://). */
  const DOCS = 'assets/docs/';
  const NOTES = {
    resume: ['첫 초안', '경력과 프로젝트 내용 채우기', '강조 디자인으로 새 단장', '차분하게 정리하고 성과 보충'],
    portfolio: ['사례 두 개로 첫 구성', '모아장 사례와 숫자 추가', '제목 바꾸고 위젯 지표 추가'],
    tailored: ['이력서 v4에서 서버 경험 중심으로 맞춤', '캐시 수치와 부하 테스트 추가'],
    daangn: ['이력서 v4에서 당근 공고에 맞춤'],
  };
  const DATES = {
    resume: [[10, 2], [10, 19], [11, 3], [11, 12]],
    portfolio: [[10, 5], [10, 28], [11, 10]],
    tailored: [[11, 16], [11, 17]],
    daangn: [[10, 27]],
  };
  const MASTERS = { resume: { title: '이력서', icon: 'person' }, portfolio: { title: '포트폴리오', icon: 'stack' } };
  const APPS = [
    ['webtoon', 'NAVER WEBTOON', 'preparing'], ['naver', 'NAVER', 'preparing'], ['kakao', '카카오', 'preparing'],
    ['line', 'LINE', 'preparing'], ['baemin', '배달의민족', 'submitted'], ['daangn', '당근', 'submitted'], ['toss', '토스', 'submitted'],
  ];
  // Applications a click can open. `doc` is the folder under assets/docs/ holding that application's resume.
  const APPINFO = {
    webtoon: { name: 'NAVER WEBTOON', role: '[2027 상반기 채용연계형 인턴십] 네이버웹툰 백엔드 서버 개발', host: 'recruit.webtoonscorp.com', doc: 'tailored', cover: true },
    // No saved posting page for this one, so opening it shows its resume instead of the posting.
    daangn: { name: '당근', role: '백엔드 엔지니어', host: 'about.daangn.com', doc: 'daangn', noPosting: true },
  };
  // The NAVER WEBTOON application's cover letter (CoverLetterView): a card per question.
  const COVER = [
    ['네이버웹툰 백엔드 인턴십에 지원한 이유와 입사 후 이루고 싶은 목표를 적어 주세요.',
      '포근랩에서 iOS 앱을 만들며 앱이 느린 순간의 절반은 서버 응답이라는 것을 배웠습니다. 화면 뒤에서 수많은 요청을 받아 내는 쪽의 일을 직접 해 보고 싶어 개인 프로젝트로 모아장 API를 만들어 운영하고 있습니다. 네이버웹툰은 새 회차가 열리는 순간 많은 독자가 한꺼번에 몰리는 서비스입니다. 그 순간에도 첫 화면이 빠르게 뜨도록 캐시와 API 구조를 다듬는 개발자가 되고 싶습니다.'],
    ['가장 어려웠던 기술적 문제와 해결 과정을 구체적으로 적어 주세요.',
      '모아장 API에서 가족이 같은 장보기 목록을 동시에 고치면 한 사람의 변경이 사라지는 문제가 있었습니다. 목록마다 버전 번호를 두고, 저장할 때 버전이 다르면 충돌로 돌려보내 클라이언트에서 병합하게 바꿨습니다. 이어서 자주 읽는 목록 조회를 Redis에 캐시하고 쓰기가 일어난 키만 지우도록 해 조회 p95를 140ms에서 12ms로 줄였습니다.'],
    ['팀에서 의견이 달랐던 경험과 그때 어떻게 했는지 적어 주세요.',
      '홈 화면 API를 하나로 합치자고 제안했을 때 서버 팀은 응답이 커져 캐시가 어려워진다고 걱정했습니다. 화면별 호출 기록을 모아 어떤 값이 함께 바뀌는지 보여 드렸고, 자주 바뀌는 부분만 따로 떼어 내는 안으로 합의했습니다. 그 결과 첫 화면 호출이 6회에서 2회로 줄었습니다.'],
  ];
  const STATUS = { preparing: '준비 중', submitted: '제출 완료' };
  // The application the 공고 추가 scene adds; the sidebar starts without it.
  const NEW_APP = 'webtoon';
  const PAGE = { title: `${APPINFO.webtoon.role} | NAVER WEBTOON`, chars: '4,812' };
  const SUBMITTED_ON = '11월 18일';
  // What each comparable document compares: the previous version on the left, the marked-up diff on the right.
  const COMPARE = {
    resume: { doc: 'resume', from: 3, to: 4, old: 'resume/v3/index.html', diff: 'resume/diff-4.html', ins: 6, del: 1 },
    webtoon: { doc: 'tailored', from: 1, to: 2, old: 'tailored/v1/index.html', diff: 'tailored/diff.html', ins: 4, del: 1 },
  };
  const diffCount = { ins: 5, del: 3 };
  // Like AppModel.canCompare: a previous version, or for an application's resume the 내 문서 version it started from.
  const canCompare = (s) => (MASTERS[s.sel] ? s.ver[s.sel] > 1 : !!APPINFO[s.sel]);
  const compareKey = (s) => (s.sel === 'resume' && s.ver.resume === 4 ? 'resume' : s.sel === 'webtoon' && s.item === 2 ? 'webtoon' : null);

  const day = ([m, d]) => `${m}월 ${d}일`;
  const stamp = (md) => `${day(md)} 오후 7:00`;
  const fullDay = ([m, d]) => `2026. ${m}. ${d}.`;

  const I = {
    person: '<rect x="1.5" y="3" width="13" height="10" rx="2"/><circle cx="5.5" cy="6.8" r="1.4"/><path d="M3.4 11c.4-1.1 1.2-1.7 2.1-1.7s1.7.6 2.1 1.7M9.6 6.5h3M9.6 9h3"/>',
    stack: '<rect x="2" y="5.5" width="12" height="8" rx="1.6"/><path d="M3.6 3.6h8.8M5.2 1.8h5.6"/>',
    plus: '<path d="M8 3v10M3 8h10"/>',
    trash: '<path d="M2.8 4.4h10.4M6.3 4.4V2.8h3.4v1.6M4.3 4.4l.7 8.8h6l.7-8.8"/>',
    sidebar: '<rect x="1.5" y="2.5" width="13" height="11" rx="2.5"/><path d="M6 2.5v11M3.2 5h1.2M3.2 7h1.2M3.2 9h1.2"/>',
    pencil: '<path d="M10.6 2.6l2.8 2.8-7.6 7.6H3v-2.8z"/>',
    plane: '<path class="solid-ic" d="M14.2 1.8 1.6 7.1l5.1 2.1 2.1 5.1z"/>',
    page: '<path d="M4 1.8h5.4l3 3v9.4H4z"/><path d="M6 7.2h4.4M6 9.6h4.4M6 12h2.8"/>',
    branch: '<path d="M4 2.2v3c0 2.4 4 2.4 4 4.8v3.8M12 2.2v3c0 2.4-4 2.4-4 4.8"/>',
    more: '<path d="M3.5 8h.01M8 8h.01M12.5 8h.01"/>',
    chevron: '<path d="M4 6l4 4 4-4"/>',
    split: '<rect x="1.5" y="2.5" width="13" height="11" rx="2"/><path d="M8 2.5v11"/>',
    pdf: '<path d="M4 1.8h5.4l3 3v9.4H4z"/><path d="M8.2 12.2V7.4M6.3 9.2l1.9-1.9 1.9 1.9"/>',
    open: '<rect x="2" y="2" width="12" height="12" rx="2.6"/><path d="M6.3 9.7l4-4M7 5.6h3.4V9"/>',
    quote: '<path d="M2.5 3.5h11M2.5 6.5h11M2.5 9.5h6.5"/><path class="solid-ic" d="M11 9.2h2.6v2.4c0 1.4-.8 2.3-2.1 2.6l-.3-.8c.7-.2 1-.7 1-1.4H11z"/>',
    folder: '<path d="M1.8 4.2c0-.8.6-1.4 1.4-1.4h3l1.4 1.6h5.2c.8 0 1.4.6 1.4 1.4v6.3c0 .8-.6 1.4-1.4 1.4H3.2c-.8 0-1.4-.6-1.4-1.4z"/><path d="M1.8 6.6h12.4"/>',
    grip: '<path d="M3 4.5h10M3 8h10M3 11.5h10"/>',
    sort: '<path d="M5 13V3M2.6 5.4 5 3l2.4 2.4M11 3v10M8.6 10.6 11 13l2.4-2.4"/>',
    link: '<path d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.1-2.1a2.6 2.6 0 0 0-3.7-3.7l-.7.7"/><path d="M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.4 8.9a2.6 2.6 0 0 0 3.7 3.7l.7-.7"/>',
  };
  const ic = (name) => `<svg viewBox="0 0 16 16" aria-hidden="true">${I[name]}</svg>`;

  /* Markup */
  const vrow = (doc, n, latest) => `
    <div class="vrow" data-at="ver:${doc}:${n}" data-item="${doc}:${n}">
      <div class="vsum"><span class="vn">v${n}</span>
        <span class="vbody"><span class="note">${NOTES[doc][n - 1] || '메모 없음'}</span><span class="date">${stamp(DATES[doc][n - 1])}</span></span>
        ${latest ? '<span class="latest">최신</span>' : ''}</div>
      <span class="more">${ic('more')}</span>
    </div>`;
  const appRows = (k) => {
    const { doc } = APPINFO[k];
    const n = DATES[doc].length;
    return `
      <div class="dochead">이력서<span>${ic('branch')}이력서 v4에서 시작</span></div>
      <div class="fold"><div><div class="slot">${ic('plus')}새 버전으로 이력서 업데이트</div></div></div>
      ${vrow(doc, n, true)}
      ${n > 1 ? `<div class="older">이전 버전 ${n - 1}개 보기${ic('chevron')}</div>` : ''}
      <div class="fold"><div><p class="sec">포트폴리오</p><div class="slot">${ic('plus')}포트폴리오 추가…</div></div></div>
      ${APPINFO[k].cover ? `<p class="sec">자기소개서</p>
      <div class="row cl" data-at="app:cl" data-item="cl">${ic('quote')}<span class="t">문항과 답변</span><span class="more">${ic('more')}</span></div>` : ''}`;
  };
  // A cover letter card; `extra` is what the scene has typed at the end of the second answer so far.
  const count = (t) => `공백 포함 ${t.length.toLocaleString()}자 · 공백 제외 ${t.replace(/\s/g, '').length.toLocaleString()}자`;
  const card = ([q, a], n) => `
    <div class="clcard" data-card="${n}">
      <div class="clq">${ic('grip')}<span class="cln">${n}</span><span class="clt">${q}</span><span class="more">${ic('more')}</span></div>
      <div class="cla" data-at="cl:answer:${n}"><span class="ans">${a}</span><i class="caret"></i></div>
      <div class="clc">${count(a)}</div>
    </div>`;
  const lensbox = (rows, cls = '') => `<div class="lensbox ${cls}"><span class="glass"></span><div class="rows">${rows}</div><div class="lcopy"></div></div>`;
  const masterList = (doc) => {
    const n = DATES[doc].length;
    let rows = `<p class="sec">버전 ${n}개</p><div class="slot">${ic('plus')}새 버전으로 ${MASTERS[doc].title} 업데이트</div>`;
    for (let v = n; v >= 1; v--) rows += vrow(doc, v, v === n);
    return lensbox(rows);
  };

  frame.innerHTML = `
  <div class="app" data-kind="none" data-comparing="false" data-mode="split">
    <aside class="sb">
      ${lensbox(`
        <p class="sec">내 문서</p>
        ${Object.entries(MASTERS).map(([k, m]) => `<div class="row" data-at="row:${k}" data-item="${k}">${ic(m.icon)}<span class="t">${m.title}</span><span class="meta">v${DATES[k].length}</span></div>`).join('')}
        <div class="add">${ic('plus')}문서 추가</div>
        <p class="sec gap order-row">공고<span class="order">내가 정한 순서${ic('sort')}</span></p>
        ${APPS.map(([k, name, st]) => {
          const row = `<div class="row"${APPINFO[k] ? ` data-at="row:${k}"` : ''} data-item="${k}"><img src="assets/app/${k}.png" alt=""><span class="t">${name}</span><span class="meta" data-status-of="${k}">${STATUS[st]}</span></div>`;
          return k === NEW_APP ? `<div class="grow"><div>${row}</div></div>` : row;
        }).join('')}
        <div class="add" data-at="sb:addApp">${ic('plus')}공고 추가</div>`)}
      <span class="trash">${ic('trash')}</span>
    </aside>

    <section class="detail">
      <div class="dview empty"><svg viewBox="0 0 16 13" aria-hidden="true"><rect x=".8" y=".8" width="14.4" height="11.4" rx="2.4"/><path d="M5.6.8v11.4M2.6 3.6h1.4M2.6 5.6h1.4M2.6 7.6h1.4"/></svg><p>왼쪽에서 문서나 공고를 골라 주세요</p></div>
      <div class="dview doc backdrop"><div class="paper">
        ${['resume', 'portfolio', 'tailored', 'daangn'].flatMap((d) => DATES[d].map((_, i) => `<iframe data-doc="${d}:${i + 1}" data-src="${DOCS}${d}/v${i + 1}/index.html" tabindex="-1" aria-hidden="true" title=""></iframe>`)).join('')}
      </div></div>
      <div class="dview cover"><div class="cards">${COVER.map((c, i) => card(c, i + 1)).join('')}</div><span class="cl-add">${ic('plus')}</span></div>
      <div class="dview posting" data-at="post:scroll:560"><img src="assets/app/posting.png" alt="" width="838" height="2000" loading="lazy"></div>
      <div class="dview cmp">
        <div class="split">
          <div class="cpane" style="left:0"><div class="phead cmp-old-head"></div><div class="backdrop"></div><div class="paper"><iframe class="on cmp-old" data-src="${DOCS}tailored/v1/index.html" tabindex="-1" aria-hidden="true" title=""></iframe></div></div>
          <div class="cpane"><div class="phead cmp-new-head"></div><div class="backdrop"></div><div class="paper"><iframe class="on cmp-new" data-src="${DOCS}tailored/diff.html" tabindex="-1" aria-hidden="true" title=""></iframe></div></div>
        </div>
        <div class="inline">
          <div class="cpane"><div class="backdrop"></div><div class="paper"><iframe class="on cmp-new" data-src="${DOCS}tailored/diff.html" tabindex="-1" aria-hidden="true" title=""></iframe></div></div>
        </div>
        <div class="bbar"><span class="cmp-range"></span><span class="counts"><span><b class="sw i">가</b><em data-count="ins"></em></span><span><b class="sw d">가</b><em data-count="del"></em></span></span></div>
      </div>
      <div class="prep"><span class="orb"></span>바뀐 곳을 찾는 중…</div>
    </section>

    <section class="col">
      <div class="cview master"></div>
      <div class="cview application" data-status="preparing">
        ${lensbox(`
          <div class="ahead">
            <div class="aname"><img src="assets/app/webtoon.png" alt=""><div><b></b><span></span></div></div>
            <div class="track"><div class="steps-in"><span class="disc"></span>
              <div class="stp s0"><span class="ic">${ic('pencil')}</span><b>준비 중</b></div>
              <span class="line"><i></i></span>
              <div class="stp s1"><span class="ic">${ic('plane')}</span><b>제출 완료</b><small>${SUBMITTED_ON}</small></div>
            </div></div>
            <div class="acts">
              <button class="solid main" type="button" tabindex="-1" data-at="status:submit"><b>제출 완료로 표시</b><span>제출 완료로 표시</span></button>
              <button class="solid close" type="button" tabindex="-1"><b>제출 완료로 표시</b><span>마감으로 표시</span></button>
            </div>
          </div>
          <p class="sec">공고</p>
          <div class="row jd" data-at="app:jd" data-item="jd">${ic('page')}<span class="t">공고 내용</span><span class="host"></span></div>`, 'pinned')}
        ${lensbox('', 'list')}
      </div>
    </section>

    <header class="tb">
      <div class="tb-lead"><span class="tb-toggle">${ic('sidebar')}</span><div class="tb-title"><b></b><span></span></div></div>
      <div class="tb-trail">
        <div class="cap base-cap" hidden><span class="btn-in base"><span class="cmp-base">기준: v1</span>${ic('chevron')}</span></div>
        <div class="picker" hidden><span class="plens"></span><span class="btn-in" data-at="tb:split" data-mode="split">나란히</span><span class="btn-in" data-at="tb:inline" data-mode="inline">한 화면</span></div>
        <div class="cap cmp-cap" hidden>
          <span class="btn-in toggle" data-at="tb:compare">${ic('split')}<span class="label"><span style="visibility:hidden">이전 버전과 비교</span></span></span>
        </div>
        <div class="cap pdf-cap" hidden><span class="btn-in">${ic('pdf')}PDF로 저장</span></div>
        <div class="cap finder-cap" hidden><span class="btn-in">${ic('folder')}Finder에서 보기</span></div>
        <div class="cap web-cap" hidden><span class="btn-in">${ic('open')}브라우저에서 열기</span></div>
      </div>
    </header>

    <div class="sheet-dim"></div>
    <div class="sheet">
      <p class="sh-title">공고 추가</p>
      <div class="sform"></div>
      <div class="sbar"><span class="sh-lead"></span><span class="sbtn" data-at="sheet:cancel">취소</span><span class="sbtn prime"></span></div>
    </div>

    <span class="pointer"><svg viewBox="0 0 26 26" aria-hidden="true" style="stroke:none"><path d="M5 2.5v18.2l4.4-4.3 2.9 6.6 3-1.3-2.9-6.5h6.2z" fill="#000" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg><i></i></span>
  </div>`;

  const app = frame.querySelector('.app');
  const $ = (sel, root = app) => root.querySelector(sel);
  const $$ = (sel, root = app) => [...root.querySelectorAll(sel)];
  const pointer = $('.pointer');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* State: what the window shows. `act` is every control the demo (or a visitor) can press. */
  const INITIAL = {
    sel: null, ver: { resume: 4, portfolio: 3 }, item: 'jd', comparing: false, mode: 'split',
    added: false, sheet: null, postY: 0, typed: '', writing: false,
    status: Object.fromEntries(APPS.map(([k, , s]) => [k, s])),
  };
  const clone = (s) => JSON.parse(JSON.stringify(s));
  let state = clone(INITIAL);

  function act(s, at) {
    const [kind, a, b] = at.split(':');
    if (kind === 'row') { s.sel = a; s.comparing = false; s.postY = 0; s.writing = false; if (APPINFO[a]) s.item = DATES[APPINFO[a].doc].length; } // an application opens on its latest resume; 공고 내용 shows the posting
    if (kind === 'ver' && MASTERS[a]) s.ver[a] = +b;
    else if (kind === 'ver') s.item = +b;
    if (kind === 'app' && (a === 'cl' ? APPINFO[s.sel]?.cover : !APPINFO[s.sel]?.noPosting)) { s.item = a; s.postY = 0; s.writing = false; }
    if (kind === 'cl' && a === 'answer' && s.item === 'cl') { s.writing = true; s.typed = CL_TYPED; }
    if (at === 'sb:addApp' && !s.added) s.sheet = { phase: 'input', url: '' };
    // NewApplicationSheet: 불러오기 loads, then 공고 추가 adds it and selects it. 취소 while loading goes back to the URL.
    if (kind === 'sheet' && s.sheet) {
      const sh = s.sheet;
      if (a === 'cancel') { if (sh.phase === 'loading') sh.phase = 'input'; else s.sheet = null; }
      else if (a === 'url' && sh.phase === 'input') sh.url = POSTING_URL;
      else if (a === 'load' && sh.url && sh.phase === 'input') sh.phase = 'loading';
      else if (a === 'loaded' && sh.phase === 'loading') sh.phase = 'loaded';
      else if (a === 'add' && sh.phase !== 'input') Object.assign(s, { sheet: null, added: true, sel: NEW_APP, comparing: false, item: 'jd', postY: 0 });
    }
    if (kind === 'post' && b) s.postY = +b;
    // Only the NAVER WEBTOON resume has an earlier version to compare with.
    if (at === 'tb:compare' && compareKey(s)) s.comparing = !s.comparing;
    if (at === 'tb:split' || at === 'tb:inline') s.mode = a;
    if (at === 'status:submit' && APPINFO[s.sel]) s.status[s.sel] = s.status[s.sel] === 'preparing' ? 'submitted' : 'preparing';
    return s;
  }
  const startOf = (i) => SHOWCASE.scenes.slice(0, i).flatMap((sc) => sc.steps).reduce((s, st) => act(s, st.at), clone(INITIAL));

  /* Lens: one glass surface per list, plus an accent copy of the rows cut to the same rect. */
  function copyRows(box) {
    const copy = box.querySelector('.lcopy');
    const rows = box.querySelector('.rows').cloneNode(true);
    rows.querySelectorAll('[data-at]').forEach((el) => el.removeAttribute('data-at'));
    copy.replaceChildren(rows);
  }
  function placeLens(box, target, instant) {
    if (!target) { box.classList.remove('on'); return; }
    const rows = box.querySelector('.rows');
    const x = target.offsetLeft + rows.offsetLeft;
    const y = target.offsetTop + rows.offsetTop;
    const w = target.offsetWidth;
    const h = target.offsetHeight;
    const set = () => Object.entries({ x, y, w, h, ct: y, cl: x, cr: box.offsetWidth - x - w, cb: box.offsetHeight - y - h })
      .forEach(([k, v]) => box.style.setProperty('--' + k, v + 'px'));
    if (!box.classList.contains('on') || instant) {
      // A first selection settles in on its row, growing from 0.9 with the glass, instead of sliding in from elsewhere.
      box.classList.remove('on');
      const parts = [box.querySelector('.glass'), box.querySelector('.lcopy')];
      parts.forEach((p) => { p.style.transition = 'none'; });
      set();
      void box.offsetWidth;
      parts.forEach((p) => { p.style.transition = ''; });
      if (instant) parts.forEach((p) => { p.style.transition = 'none'; });
      box.classList.add('on');
      if (instant) { void box.offsetWidth; parts.forEach((p) => { p.style.transition = ''; }); }
    } else {
      set();
    }
  }

  /* RisingLetters: new words rise letter by letter out of a blur; the old ones fade at once. */
  function rise(host, text) {
    const old = host.querySelector('.rise:not(.out)');
    if (old && old.dataset.t === text) return;
    if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 100); }
    const span = document.createElement('span');
    span.className = 'rise';
    span.dataset.t = text;
    [...text].forEach((ch, i) => { const c = document.createElement('i'); c.style.setProperty('--i', i); c.textContent = ch; span.append(c); });
    host.append(span);
  }

  /* Render: apply `state` to the window. `instant` jumps without motion. */
  let shown = { kind: null, doc: null, app: null, comparing: false, dw: null, cmp: null };
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function geometry(layoutComparing) {
    const lead = layoutComparing ? 0 : 282;
    const colShown = state.sel && !layoutComparing;
    const dx = lead + (colShown ? 300 : 0);
    app.dataset.comparing = String(layoutComparing);
    app.style.setProperty('--lead', lead + 'px');
    app.style.setProperty('--cx', lead + 'px');
    app.style.setProperty('--dx', dx + 'px');
    const dw = 1512 - dx;
    // The document resizes once, not on every frame; only its position moves. Shrinking waits for the slide.
    // Width moves with the panel on the same curve, so the right edge stays put instead of snapping 0.5s later.
    app.style.setProperty('--dw', dw + 'px');
    shown.dw = dw;
  }

  function render(instant = false) {
    timers.forEach(clearTimeout);
    timers = [];
    if (instant || reduce.matches) app.classList.add('instant');
    const s = state;
    const kind = !s.sel ? 'none' : MASTERS[s.sel] ? 'master' : 'app';
    app.dataset.kind = kind;
    app.dataset.mode = s.mode;

    // Sidebar
    APPS.forEach(([k]) => { $(`.rows [data-status-of="${k}"]`).textContent = STATUS[s.status[k]]; });
    const sbBox = $('.sb .lensbox');
    $('.sb .rows .grow').classList.toggle('on', s.added);
    const placeSb = () => { copyRows(sbBox); placeLens(sbBox, s.sel && $(`.sb .rows [data-item="${s.sel}"]`), instant); };
    // A new row opens first (`state`), then the lens slides to it.
    if (s.added && !shown.added && !instant && !reduce.matches) later(placeSb, 320);
    else placeSb();
    shown.added = s.added;

    // Version column
    if (kind === 'master' && shown.doc !== s.sel) {
      $('.cview.master').innerHTML = masterList(s.sel);
      shown.doc = s.sel;
    }
    const appView = $('.cview.application');
    const info = APPINFO[s.sel];
    if (info && shown.app !== s.sel) {
      $('.aname img', appView).src = `assets/app/${s.sel}.png`;
      $('.aname b', appView).textContent = info.name;
      $('.aname span', appView).textContent = info.role;
      $('.host', appView).textContent = info.host;
      $('.list .rows', appView).innerHTML = appRows(s.sel);
      shown.app = s.sel;
    }
    if (info) {
      appView.dataset.status = s.status[s.sel];
      // StatusTrack.actions: 준비 중 offers 제출 완료로 표시 with 마감으로 표시 beside it; 제출 완료 only the way back.
      const preparing = s.status[s.sel] === 'preparing';
      $('.solid.main span').textContent = preparing ? '제출 완료로 표시' : '준비 중으로 되돌리기';
      $('.solid.close').hidden = !preparing;
    }
    let docKey = null;
    if (kind === 'master') {
      const box = $('.cview.master .lensbox');
      copyRows(box);
      placeLens(box, $(`.rows [data-item="${s.sel}:${s.ver[s.sel]}"]`, box), instant || shown.kind !== 'master');
      docKey = `${s.sel}:${s.ver[s.sel]}`;
    }
    if (kind === 'app') {
      const [pinned, list] = $$('.lensbox', appView);
      [pinned, list].forEach(copyRows);
      const fresh = instant || shown.kind !== 'app' || shown.lensApp !== s.sel;
      shown.lensApp = s.sel;
      // A lens covers only its own rows: moving between the pinned and the scrolling rows makes it appear anew.
      placeLens(pinned, s.item === 'jd' ? $('.rows [data-item="jd"]', pinned) : null, fresh);
      const row = s.item === 'jd' ? null : s.item === 'cl' ? '[data-item="cl"]' : `[data-item="${info.doc}:${s.item}"]`;
      const pick = () => placeLens(list, row && $('.rows ' + row, list), fresh);
      pick();
      later(pick, 300); // the add slots fold away when submitted, and the row moves up
      if (typeof s.item === 'number') docKey = `${info.doc}:${s.item}`;
    }
    $$('.paper iframe[data-doc]').forEach((f) => f.classList.toggle('on', f.dataset.doc === docKey));

    // Detail views
    const view = kind === 'none' ? 'empty' : docKey ? 'doc' : s.item === 'cl' ? 'cover' : 'posting';
    ['empty', 'doc', 'cover', 'posting'].forEach((v) => $('.dview.' + v).classList.toggle('on', v === view));
    renderCover();
    $('.dview.cmp').classList.toggle('on', s.comparing);
    const ck = compareKey(s);
    if (ck && shown.cmp !== ck) {
      const c = COMPARE[ck];
      $('.cmp-old').src = DOCS + c.old;
      $$('.cmp-new').forEach((f) => { f.src = DOCS + c.diff; });
      $('.cmp-old-head').textContent = `이전 버전 · v${c.from} · ${day(DATES[c.doc][c.from - 1])}`;
      $('.cmp-new-head').textContent = `선택한 버전 · v${c.to} · ${day(DATES[c.doc][c.to - 1])}`;
      $('.cmp-range').textContent = `v${c.from} → v${c.to}`;
      $('.cmp-base').textContent = `기준: v${c.from}`;
      Object.assign(diffCount, { ins: c.ins, del: c.del });
      counts();
      shown.cmp = ck;
    }
    app.style.setProperty('--py', s.postY);
    renderSheet();
    if (s.sheet?.phase === 'loading') later(() => { state = act(state, 'sheet:loaded'); render(); }, SHOWCASE.load);

    // Toolbar
    const title = kind === 'master' ? MASTERS[s.sel].title : kind === 'app' ? info.name : 'Folio';
    const sub = kind === 'master' ? `v${s.ver[s.sel]} · ${fullDay(DATES[s.sel][s.ver[s.sel] - 1])}` : kind === 'app' ? info.role : '';
    $('.tb-title b').textContent = title;
    $('.tb-title span').textContent = sub;
    $('.base-cap').hidden = !s.comparing;
    $('.picker').hidden = !s.comparing;
    const toggle = $('.toggle');
    // Letters rise only when the words change. A button that appears (or comes back, which restarts CSS
    // animations) shows its words at once.
    const appearing = $('.cmp-cap').hidden && view === 'doc';
    $('.cmp-cap').hidden = view !== 'doc';
    $('.pdf-cap').hidden = view !== 'doc';
    $('.web-cap').hidden = view !== 'posting';
    $('.finder-cap').hidden = view !== 'cover';
    toggle.classList.toggle('on', s.comparing);
    toggle.classList.toggle('off', view === 'doc' && !canCompare(s));
    rise($('.label', toggle), s.comparing ? '비교 끄기' : '이전 버전과 비교');
    if (appearing) $$('.rise', toggle).forEach((r) => r.classList.add('settled'));
    if (s.comparing) {
      const on = $(`.picker [data-mode="${s.mode}"]`);
      $$('.picker .btn-in').forEach((b) => b.classList.toggle('on', b === on));
      $('.picker').style.setProperty('--px', on.offsetLeft + 'px');
      $('.picker').style.setProperty('--pw', on.offsetWidth + 'px');
    }

    // Comparing: the toolbar changes now; the orb covers the page, then the panels slide away and it lifts.
    const prep = $('.prep');
    if (s.comparing && !shown.comparing && !instant && !reduce.matches) {
      prep.classList.add('on');
      geometry(false);
      later(() => geometry(true), 450);
      later(() => prep.classList.remove('on'), 450 + 340);
    } else {
      prep.classList.remove('on');
      geometry(s.comparing);
    }

    shown.kind = kind;
    shown.comparing = s.comparing;
    if (app.classList.contains('instant')) { void app.offsetWidth; app.classList.remove('instant'); }
  }

  /* The cover letter: only the second answer and its count change while the scene types. */
  function renderCover() {
    const cardEl = $('.clcard[data-card="2"]');
    const text = COVER[1][1] + state.typed;
    $('.ans', cardEl).textContent = text;
    $('.clc', cardEl).textContent = count(text);
    cardEl.classList.toggle('writing', state.writing);
  }

  /* The 공고 추가 sheet (NewApplicationSheet): only the URL text changes while typing. */
  const field = (label, value, cls = '') => `<div class="frow"><span class="flabel">${label}</span><span class="field ${cls}">${value}</span></div>`;
  function renderSheet() {
    const sh = state.sheet;
    app.classList.toggle('sheeted', !!sh);
    if (!sh) return; // the closing sheet keeps its last contents while it fades
    if (shown.phase !== sh.phase) {
      const loaded = sh.phase === 'loaded';
      $('.sform').innerHTML = loaded
        ? `<div class="fsec"><div class="pcard"><img src="assets/app/webtoon.png" alt=""><div><b>${PAGE.title}</b><span>${APPINFO.webtoon.host}</span></div></div></div>
           <div class="fsec">${field('회사', APPINFO.webtoon.name)}${field('직무', APPINFO.webtoon.role)}</div>
           <p class="ffoot">공고 내용 ${PAGE.chars}자를 저장해요.</p>`
        : `<div class="fsec">${field(`${ic('link')}공고 주소`, '<span class="url-val"></span><i class="caret"></i>', 'url')}</div>
           <div class="ffoot"><p>지금 보이는 공고 내용을 저장해요. 웹페이지가 바뀌어도 남아요.</p>
           ${sh.phase === 'loading' ? '<p class="busy"><span class="spin"></span>공고를 불러오는 중…</p>' : ''}</div>`;
      $('.sh-lead').textContent = { input: '직접 입력하기', loading: '', loaded: '주소 다시 입력' }[sh.phase];
      $('.sheet').dataset.phase = sh.phase;
      shown.phase = sh.phase;
    }
    const url = $('.url-val');
    if (url) url.textContent = sh.url;
    const prime = $('.sbtn.prime');
    prime.textContent = sh.phase === 'loaded' ? '공고 추가' : '불러오기';
    prime.dataset.at = sh.phase === 'loaded' ? 'sheet:add' : 'sheet:load';
    prime.classList.toggle('off', sh.phase !== 'loaded' && (!sh.url || sh.phase === 'loading'));
  }

  /* Scale: the window is 1512x949 points, drawn at the frame's width. Each page fits its pane's width. */
  new ResizeObserver(() => app.style.setProperty('--k', frame.clientWidth / 1512)).observe(frame);
  const paperRO = new ResizeObserver((entries) => entries.forEach(({ target: p }) => {
    const s = p.clientWidth / 900;
    p.style.setProperty('--s', s);
    p.style.setProperty('--fh', p.clientHeight / s + 'px');
  }));
  $$('.paper').forEach((p) => paperRO.observe(p));

  /* Pointer */
  function pointAt(el) {
    const a = app.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const k = a.width / 1512;
    // An answer is clicked at the end of its text, where the typing goes.
    if (el.matches('.cla')) {
      const end = el.querySelector('.caret').getBoundingClientRect();
      return { x: (end.left - a.left) / k + 4, y: (end.top - a.top + end.height / 2) / k };
    }
    const dx = el.matches('.posting') ? r.width / k / 2 : Math.min(r.width / k / 2, 70);
    return { x: (r.left - a.left) / k + dx, y: (r.top - a.top + r.height / 2) / k };
  }
  // Copies of rows under the lens carry no data-at, so this finds the real control. `scroll` aims at a pane without pressing.
  async function click(at, token, { apply = true, press = true } = {}) {
    const el = $(`[data-at="${at}"]`);
    if (!el) return;
    const p = pointAt(el);
    pointer.style.setProperty('--move', SHOWCASE.move + 'ms');
    pointer.style.setProperty('--mx', p.x + 'px');
    pointer.style.setProperty('--my', p.y + 'px');
    pointer.classList.add('on');
    $$('.btn-in.hov').forEach((b) => b.classList.remove('hov'));
    await wait(SHOWCASE.move);
    if (token !== playing) return;
    if (el.matches('.btn-in')) el.classList.add('hov');
    if (press) {
      pointer.classList.add('down');
      await wait(SHOWCASE.press);
      if (token !== playing) return;
      setTimeout(() => pointer.classList.remove('down'), 300);
    }
    if (apply) { state = act(state, at); render(); }
  }

  /* Player */
  let playing = 0;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // A scene plays over and over until another tab is picked. A tab jumps straight to its scene's start; a replay
  // moves back to it with the usual motion. With reduced motion the scene's end state just stays.
  async function playScene(i, replay = false) {
    const token = ++playing;
    if (!replay) setCaption(i);
    if (reduce.matches) {
      state = startOf(i + 1);
      render(true);
      return;
    }
    const start = startOf(i);
    if (!same(state, start)) { state = start; render(!replay); }
    await wait(SHOWCASE.lead);
    for (const step of SHOWCASE.scenes[i].steps) {
      if (token !== playing) return;
      await click(step.at, token, { apply: !step.type, press: !step.scroll });
      if (step.type) {
        for (let n = 1; n <= step.type.length; n++) {
          if (token !== playing) return;
          const text = step.type.slice(0, n);
          if (step.at === 'sheet:url') { state.sheet.url = text; renderSheet(); }
          else { state.writing = true; state.typed = text; renderCover(); }
          await wait(SHOWCASE.key);
        }
        state = act(state, step.at);
      }
      await wait(step.hold ?? SHOWCASE.hold);
    }
    if (token !== playing) return;
    await wait(SHOWCASE.loop);
    if (token === playing) playScene(i, true);
  }

  /* Captions and scene tabs */
  const showcase = frame.closest('.showcase');
  const caption = showcase.querySelector('.caption');
  const tabs = showcase.querySelector('.scene-tabs');
  SHOWCASE.scenes.forEach((sc) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.textContent = sc.tab;
    tabs.append(b);
  });
  const tabButtons = [...tabs.querySelectorAll('[role="tab"]')];
  function setCaption(i) {
    if (typeof selectTab === 'function') selectTab(tabs, i);
    const sc = SHOWCASE.scenes[i];
    caption.classList.add('swap');
    setTimeout(() => {
      caption.textContent = sc.text;
      if (sc.note) {
        const note = document.createElement('small');
        note.className = 'cap-note';
        note.textContent = sc.note;
        caption.append(note);
      }
      caption.classList.remove('swap');
    }, 160);
  }

  tabButtons.forEach((b, i) => b.addEventListener('click', () => playScene(i)));

  // Scene one plays once when the window first comes into view; after that only the tabs play scenes.
  const firstView = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    firstView.disconnect();
    if (!playing) playScene(0);
  }, { threshold: 0.35 });
  firstView.observe(frame);

  // The documents in the window load only when the window comes near the screen, not while the hero animates.
  const loadDocs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    loadDocs.disconnect();
    $$('iframe[data-src]').forEach((f) => { if (!f.getAttribute('src')) f.src = f.dataset.src; });
  }, { rootMargin: '600px 0px' });
  loadDocs.observe(frame);

  /* First paint, then real notes and diff counts when served over HTTP. */
  function counts() { $$('[data-count]').forEach((el) => { el.textContent = `${el.dataset.count === 'ins' ? '추가' : '삭제'} ${diffCount[el.dataset.count]}곳`; }); }
  counts();
  render(true);
  setCaption(0);

  Promise.all(Object.keys(NOTES).map((d) => fetch(`${DOCS}${d}/notes.json`).then((r) => (r.ok ? r.json() : Promise.reject())).then((n) => { NOTES[d] = n; })))
    .then(() => {
      shown.doc = null;
      shown.app = null;
      render(true);
    })
    .catch(() => {});
  Object.values(COMPARE).forEach((c) => fetch(DOCS + c.diff).then((r) => (r.ok ? r.text() : Promise.reject())).then((html) => {
    c.ins = (html.match(/<ins\b/g) || []).length;
    c.del = (html.match(/<del\b/g) || []).length;
    shown.cmp = null;
  }).catch(() => {}));
})();
