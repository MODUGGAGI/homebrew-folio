'use strict';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* RisingLetters: split text into letters that rise one by one */
function splitLetters(el) {
  // A <br> in the markup becomes a newline here and a <br> again between the letter spans.
  el.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text.replace(/\s*\n\s*/g, ' '));
  el.textContent = '';
  let i = 0;
  text.split(/( |\s*\n\s*)/).forEach((word) => {
    if (word === ' ') { el.append(' '); return; }
    if (!word.trim()) { el.append(document.createElement('br')); return; }
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    for (const ch of word) {
      const c = document.createElement('span');
      c.className = 'ch';
      c.style.setProperty('--i', i++);
      c.textContent = ch;
      w.append(c);
    }
    el.append(w);
  });
}

const risers = document.querySelectorAll('[data-rise]');
risers.forEach(splitLetters);
const riseObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); riseObserver.unobserve(e.target); }
  });
}, { threshold: 0.4 });
risers.forEach((el) => (el.hasAttribute('data-rise-now') ? el.classList.add('in') : riseObserver.observe(el)));

/* Copy buttons */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // file:// or older browsers: fall back to a hidden textarea
    const t = document.createElement('textarea');
    t.value = text;
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.append(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
}
document.querySelectorAll('.copy').forEach((btn) => {
  let timer;
  // The metal ring's highlight follows the pointer, like a small dent where the finger is.
  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
    btn.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
  });
  btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
  btn.addEventListener('click', async () => {
    await copyText(btn.dataset.copy);
    btn.classList.add('done');
    btn.setAttribute('aria-label', '설치 명령 복사됨');
    // A small "copied" note next to the button; made on first use and reused after.
    const bar = btn.closest('.cmdbar, .term-bar');
    let tip = bar && bar.querySelector('.copy-tip');
    if (bar && !tip) {
      tip = document.createElement('span');
      tip.className = 'copy-tip';
      tip.setAttribute('aria-hidden', 'true');
      tip.textContent = '복사됐어요';
      bar.append(tip);
      tip.getBoundingClientRect(); // so the first show still fades in
    }
    if (tip) tip.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (tip) tip.classList.remove('on');
      btn.classList.remove('done');
      btn.setAttribute('aria-label', '설치 명령 복사');
    }, 1800);
  });
});

/* Sliding lens under the selected tab */
function placeLens(tabs) {
  const sel = tabs.querySelector('[aria-selected="true"]');
  const lens = tabs.querySelector('.lens');
  if (!sel) return;
  lens.style.width = sel.offsetWidth + 'px';
  lens.style.transform = `translateX(${sel.offsetLeft}px)`;
}
function selectTab(tabs, index) {
  tabs.querySelectorAll('[role="tab"]').forEach((b, i) => {
    b.setAttribute('aria-selected', String(i === index));
    if (b.id) b.tabIndex = i === index ? 0 : -1;
  });
  placeLens(tabs);
  // A tab row wider than the screen scrolls inside itself to keep the selection in view.
  const sel = tabs.querySelectorAll('[role="tab"]')[index];
  if (sel && tabs.scrollWidth > tabs.clientWidth) {
    tabs.scrollTo({ left: sel.offsetLeft - (tabs.clientWidth - sel.offsetWidth) / 2, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }
}
const allTabs = document.querySelectorAll('.lens-tabs');
addEventListener('resize', () => allTabs.forEach(placeLens));
document.fonts && document.fonts.ready.then(() => allTabs.forEach(placeLens));
allTabs.forEach(placeLens);

/* Install tabs */
const installTabs = document.querySelector('.install-tabs');
const installButtons = [...installTabs.querySelectorAll('[role="tab"]')];
function showInstall(i, focus) {
  selectTab(installTabs, i);
  installButtons.forEach((b, j) => { document.getElementById(b.getAttribute('aria-controls')).hidden = i !== j; });
  if (focus) installButtons[i].focus();
}
installButtons.forEach((b, i) => {
  b.addEventListener('click', () => showInstall(i));
  b.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      showInstall((i + (e.key === 'ArrowRight' ? 1 : -1) + installButtons.length) % installButtons.length, true);
    }
  });
});

/* MCP chat: plays once in view: type the request, then reveal the steps. */
const chat = document.querySelector('.chat-claude');
if (chat) {
  const typed = chat.querySelector('.typed');
  const steps = [...chat.querySelectorAll('.step')];
  const finish = () => { typed.textContent = typed.dataset.text; steps.forEach((el) => el.classList.add('shown')); };
  if (reduceMotion.matches) {
    finish();
  } else {
    chat.classList.add('js');
    const chatObserver = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      chatObserver.disconnect();
      chat.classList.add('typing');
      const text = typed.dataset.text;
      for (let n = 1; n <= text.length; n++) setTimeout(() => { typed.textContent = text.slice(0, n); }, n * 40);
      const done = text.length * 40;
      setTimeout(() => chat.classList.remove('typing'), done);
      steps.forEach((el, k) => setTimeout(() => el.classList.add('shown'), done + 250 + k * 300));
    }, { threshold: 0.5 });
    chatObserver.observe(chat);
  }
}

/* Lineage: draw the version tree once when it scrolls in; reduced motion shows the final state */
const lineage = document.querySelector('.lineage');
if (lineage && !reduceMotion.matches) {
  lineage.classList.add('js');
  const lineageObserver = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    lineageObserver.disconnect();
    lineage.classList.add('in');
    // Once the tree is drawn, light keeps flowing along the lines and the newest version breathes.
    // Branch lights start as soon as the badges are up; the trunk light and the v5 ring start as v5 appears,
    // so there is no pause between the drawing and the light.
    const start = (...kinds) => kinds.forEach((k) => lineage.querySelectorAll(`.flow.${k} animate, .flow.${k} animateMotion`).forEach((anim) => anim.beginElement()));
    setTimeout(() => start('dg', 'wt'), 2050);
    setTimeout(() => { lineage.classList.add('flowing'); start('main'); }, 2700);
  }, { threshold: 0.4 });
  lineageObserver.observe(lineage);
}

/* Header download button appears once the hero's own install button scrolls out of view */
const heroCta = document.querySelector('.hero-actions .btn-primary');
const navEl = document.querySelector('.nav');
const navCta = navEl && navEl.querySelector('.nav-cta');
if (heroCta && navCta) {
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0;
    navEl.classList.toggle('cta-on', on);
    navCta.tabIndex = on ? 0 : -1;
    navCta.setAttribute('aria-hidden', String(!on));
  }).observe(heroCta);
}

/* Contact address: assembled here so it is not plain text in the HTML */
document.querySelectorAll('.mail').forEach((a) => {
  const addr = `${a.dataset.u}@${a.dataset.d}`;
  a.href = `mailto:${addr}`;
  if (a.id === 'contact') a.textContent = addr;
});

/* Footer: only one popover open at a time; the releases list comes from GitHub (fallback stays on failure) */
const pops = [...document.querySelectorAll('.pop')];
pops.forEach((d) => d.addEventListener('toggle', () => { if (d.open) pops.forEach((o) => { if (o !== d) o.open = false; }); }));
document.addEventListener('click', (e) => { if (!e.target.closest('.pop')) pops.forEach((d) => { d.open = false; }); });
const relList = document.querySelector('.rel-list');
if (relList) {
  fetch('https://api.github.com/repos/MODUGGAGI/homebrew-folio/releases?per_page=5')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((list) => {
      const items = list.filter((x) => !x.draft && !x.prerelease);
      if (!items.length) return;
      relList.replaceChildren(...items.map((x) => {
        const li = document.createElement('li');
        const b = document.createElement('b');
        b.textContent = x.name || x.tag_name;
        const span = document.createElement('span');
        span.textContent = new Date(x.published_at).toLocaleDateString('ko-KR');
        li.append(b, span);
        return li;
      }));
    })
    .catch(() => {});
}

/* Light and dark: light by default, the choice remembered. The new theme opens out from the toggle as a circle
   where the browser can (View Transitions); otherwise, or with Reduce Motion, it switches at once. */
(() => {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const label = () => {
    const dark = root.dataset.theme === 'dark';
    toggle.setAttribute('aria-checked', String(dark));
  };
  const apply = (dark) => {
    if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme;
    if (meta) meta.content = dark ? '#05070F' : '#E9ECF6';
    try { localStorage.setItem('folio-theme', dark ? 'dark' : 'light'); } catch (e) { /* private mode: not remembered */ }
    label();
  };
  label();
  toggle.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    if (!document.startViewTransition || still.matches) return apply(dark);
    const r = toggle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => apply(dark)).ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.32, .72, 0, 1)', pseudoElement: '::view-transition-new(root)' });
    });
  });
})();
