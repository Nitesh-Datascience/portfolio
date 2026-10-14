import { projects } from './content/projects.mjs';
import { CACHE_KEY, CACHE_TTL, EMAIL, createEmailDraft, fetchGitHubSnapshot, filterProjects, readSnapshot } from './portfolio-core.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function initTheme() {
  const button = $('#themeToggle');
  const updateLabel = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    button.title = `Switch to ${dark ? 'light' : 'dark'} theme`;
    document.querySelector('meta[name="theme-color"]').content = dark ? '#0b121b' : '#f6f8f7';
  };
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('nitesh.theme', theme); } catch {}
    updateLabel();
  });
  updateLabel();
  button.hidden = false;
}

function initNavigation() {
  const toggle = $('#menuToggle');
  const navigation = $('#mainNav');
  const links = $$('#mainNav a');
  const close = () => {
    navigation.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };
  toggle.addEventListener('click', () => {
    const open = !navigation.classList.contains('open');
    navigation.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', `${open ? 'Close' : 'Open'} navigation`);
    if (open) links[0].focus();
  });
  links.forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) {
      close(); toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!navigation.contains(event.target) && !toggle.contains(event.target)) close();
  });
  matchMedia('(max-width: 650px)').addEventListener?.('change', close);
  toggle.hidden = false;
  document.documentElement.classList.add('nav-ready');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.isIntersecting);
      if (entry) links.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-12% 0px -65% 0px', threshold: 0 });
    ['home', 'projects', 'skills', 'about', 'github', 'contact'].forEach(id => observer.observe(document.getElementById(id)));
  }
}

function initProjects() {
  const search = $('#projectSearch');
  const buttons = $$('[data-filter]');
  const cards = $$('[data-project]');
  const more = $('#showMore');
  const count = $('#projectCount');
  const empty = $('#emptyState');
  const initialLimit = 8;
  let category = 'all';
  let expanded = false;
  const update = () => {
    const matches = filterProjects(projects, category, search.value);
    const isFiltered = category !== 'all' || search.value.trim() !== '';
    const visible = expanded || isFiltered ? matches : matches.slice(0, initialLimit);
    const ids = new Set(visible.map(project => project.id));
    cards.forEach(card => { card.hidden = !ids.has(card.dataset.project); });
    const demoCount = matches.filter(project => project.demo).length;
    count.textContent = `${visible.length < matches.length ? `Showing ${visible.length} of ${matches.length}` : matches.length} project${matches.length === 1 ? '' : 's'} · ${demoCount} demo link${demoCount === 1 ? '' : 's'}`;
    empty.hidden = matches.length !== 0;
    more.hidden = isFiltered || matches.length <= initialLimit;
    more.setAttribute('aria-expanded', String(expanded));
    more.textContent = expanded ? 'Show fewer projects −' : `View all ${projects.length} projects +`;
    buttons.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; update(); }));
  search.addEventListener('input', update);
  more.addEventListener('click', () => { expanded = !expanded; update(); });
  $('#resetSearch').addEventListener('click', () => { category = 'all'; search.value = ''; expanded = false; update(); search.focus(); });
  update();
  $('#projectToolbar').hidden = false;
}

function createIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon'); svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`); svg.append(use);
  return svg;
}

function initGitHub() {
  const button = $('#refreshGitHub');
  const status = $('#githubStatus');
  let storage;
  try { storage = localStorage; } catch {}
  let snapshot = readSnapshot(storage);
  let lastAttempt = -Infinity;
  let pending = false;
  let started = false;
  const dateTime = timestamp => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  function render(value) {
    $('#repoTotal').textContent = value.publicRepos.toLocaleString();
    $('#followerTotal').textContent = value.followers.toLocaleString();
    const fragment = document.createDocumentFragment();
    value.repos.forEach(repo => {
      const article = document.createElement('article'); article.className = 'recent-repo';
      const link = document.createElement('a'); link.href = repo.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const title = document.createElement('h3'); title.textContent = repo.name.replace(/^https---github\.com-Nitesh-Datascience-/, '').replace(/[_-]+/g, ' ');
      link.append(title, createIcon('arrow-up-right'));
      const description = document.createElement('p'); description.textContent = repo.description;
      const meta = document.createElement('div'); meta.className = 'repo-meta';
      const language = document.createElement('span'); language.textContent = repo.language;
      const stars = document.createElement('span'); stars.textContent = `☆ ${repo.stars} star${repo.stars === 1 ? '' : 's'}`;
      meta.append(language, stars);
      const time = document.createElement('time'); time.className = 'repo-time'; time.dateTime = repo.pushedAt;
      time.textContent = `Last pushed ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(repo.pushedAt))}`;
      article.append(link, description, meta, time); fragment.append(article);
    });
    if (value.repos.length) $('#recentRepos').replaceChildren(fragment);
  }
  if (snapshot) { render(snapshot); status.textContent = `Saved snapshot · ${dateTime(snapshot.fetchedAt)}`; }
  async function refresh(manual = false) {
    const now = Date.now();
    if (pending) return;
    if (manual && now - lastAttempt < 60_000) {
      status.textContent = `Please wait ${Math.ceil((60_000 - (now - lastAttempt)) / 1000)} seconds before refreshing again.${snapshot ? ` Data from ${dateTime(snapshot.fetchedAt)}.` : ''}`;
      return;
    }
    if (!manual && now - lastAttempt < 60_000) return;
    if (!manual && snapshot && now - snapshot.fetchedAt < CACHE_TTL) return;
    pending = true; lastAttempt = now; button.disabled = true; button.setAttribute('aria-busy', 'true');
    status.textContent = 'Refreshing public GitHub data…';
    try {
      snapshot = await fetchGitHubSnapshot();
      render(snapshot);
      try { storage?.setItem(CACHE_KEY, JSON.stringify(snapshot)); } catch {}
      status.textContent = `Updated ${dateTime(snapshot.fetchedAt)} · auto-refresh on`;
    } catch (error) {
      const reason = error?.message === 'GitHub refresh limit reached' ? 'GitHub refresh limit reached.' : 'GitHub is temporarily unavailable.';
      status.textContent = snapshot ? `${reason} Showing saved data from ${dateTime(snapshot.fetchedAt)}.` : `${reason} Open the profile above or try Refresh later.`;
    } finally { pending = false; button.disabled = false; button.removeAttribute('aria-busy'); }
  }
  function start() {
    if (started) return;
    started = true;
    refresh();
    setInterval(() => { if (!document.hidden) refresh(); }, CACHE_TTL);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }
  button.addEventListener('click', () => { start(); refresh(true); });
  button.hidden = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { start(); observer.disconnect(); }
    }, { rootMargin: '100px' });
    observer.observe($('#github'));
  } else start();
}

function initContact() {
  const form = $('#contactForm');
  const status = $('#formStatus');
  const copyButton = $('#copyEmail');
  const copyStatus = $('#copyStatus');
  function getDraft() {
    if (!form.reportValidity()) return null;
    try {
      status.removeAttribute('data-error');
      return createEmailDraft(Object.fromEntries(new FormData(form)));
    } catch (error) { status.dataset.error = 'true'; status.textContent = error.message; return null; }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const draft = getDraft();
    if (!draft) return;
    window.location.href = draft.url;
    status.textContent = 'Your email draft is ready. Review and send in your email app. If it did not open, choose Copy message.';
  });
  $('#copyDraft').addEventListener('click', async () => {
    const draft = getDraft();
    if (!draft) return;
    const text = `To: ${EMAIL}\nSubject: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Message copied. Paste it into your email app to review and send.';
    } catch {
      let label = $('#draftFallbackLabel');
      let field = $('#draftFallback');
      if (!field) {
        label = document.createElement('label'); label.id = 'draftFallbackLabel'; label.htmlFor = 'draftFallback'; label.className = 'draft-fallback-label'; label.textContent = 'Select and copy your prepared message';
        field = document.createElement('textarea'); field.id = 'draftFallback'; field.className = 'draft-fallback'; field.readOnly = true; field.rows = 8;
        status.after(label, field);
      }
      field.value = text; field.focus(); field.select();
      status.textContent = 'Automatic copying is unavailable. Your message is selected below; use your device’s Copy command.';
    }
  });
  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(EMAIL); copyStatus.textContent = 'Email address copied.'; }
    catch {
      const range = document.createRange(); range.selectNodeContents($('.email-link'));
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      copyStatus.textContent = 'Email address selected. Use your device’s Copy command.';
    }
  });
  form.hidden = false; copyButton.hidden = false;
}

initTheme();
initNavigation();
initProjects();
initGitHub();
initContact();
$('#currentYear').textContent = new Date().getFullYear();
