import { featuredStudy } from './content/featured-study.mjs?v=20261017.1';
import { projects } from './content/projects.mjs';
import { CACHE_KEY, EMAIL, createEmailDraft, fetchGitHubSnapshot, filterProjects, projectLink, projectStateURL, readProjectState, readSnapshot, sortProjects } from './portfolio-core.mjs?v=20261017.1';
import { RefreshController } from './refresh-controller.mjs?v=20261017.1';

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
  const sort = $('#projectSort');
  const buttons = $$('[data-filter]');
  const cards = $$('[data-project]');
  const cardById = new Map(cards.map(card => [card.dataset.project, card]));
  const grid = $('#projectGrid');
  const more = $('#showMore');
  const count = $('#projectCount');
  const empty = $('#emptyState');
  const initialLimit = 8;
  let state = readProjectState(window.location.href);
  let { category, expanded } = state;
  search.value = state.query; sort.value = state.sort;
  const update = (persist = true, clearAnchor = false) => {
    const matches = sortProjects(filterProjects(projects, category, search.value), sort.value);
    const isFiltered = category !== 'all' || search.value.trim() !== '' || sort.value !== 'featured';
    grid.classList.toggle('is-browsing', isFiltered);
    const visible = expanded || isFiltered ? matches : matches.slice(0, initialLimit);
    const ids = new Set(visible.map(project => project.id));
    cards.forEach(card => { card.hidden = !ids.has(card.dataset.project); });
    sortProjects(projects, sort.value).forEach(project => grid.append(cardById.get(project.id)));
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
    if (persist) {
      const url = projectStateURL(window.location.href, { category, query: search.value, sort: sort.value, expanded });
      if (clearAnchor && url.hash.startsWith('#project-')) url.hash = '';
      try { history.replaceState(null, '', url.pathname + url.search + url.hash); } catch {}
    }
  };
  function revealLinkedProject() {
    const id = window.location.hash.replace(/^#project-/, '');
    const card = window.location.hash.startsWith('#project-') ? cardById.get(id) : null;
    if (!card) return;
    category = 'all'; expanded = true; search.value = ''; sort.value = 'featured'; update();
    card.querySelector('details').open = true;
    requestAnimationFrame(() => {
      card.scrollIntoView({ block: 'start', behavior: 'auto' });
      card.querySelector('summary').focus({ preventScroll: true });
    });
  }
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; update(true, true); }));
  search.addEventListener('input', () => update(true, true));
  sort.addEventListener('change', () => update(true, true));
  more.addEventListener('click', () => { expanded = !expanded; update(true, true); });
  $('#resetSearch').addEventListener('click', () => { category = 'all'; search.value = ''; sort.value = 'featured'; expanded = false; update(true, true); search.focus(); });
  $$('[data-share-project]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const id = button.dataset.shareProject;
      const url = projectLink(window.location.href, id);
      const title = projects.find(project => project.id === id).title;
      try {
        await navigator.clipboard.writeText(url);
        $('#projectShareStatus').textContent = `Link to ${title} copied.`;
      } catch {
        const card = cardById.get(id);
        let field = card.querySelector('.project-link-field');
        if (!field) {
          field = document.createElement('input'); field.type = 'text'; field.readOnly = true; field.className = 'project-link-field';
          field.setAttribute('aria-label', `Shareable link to ${title}`); card.querySelector('.project-actions').after(field);
        }
        field.value = url; field.focus(); field.select();
        $('#projectShareStatus').textContent = `Link to ${title} selected. Use your device’s Copy command.`;
      }
    });
  });
  window.addEventListener('hashchange', revealLinkedProject);
  window.addEventListener('popstate', () => {
    state = readProjectState(window.location.href); category = state.category; expanded = state.expanded;
    search.value = state.query; sort.value = state.sort; update(false); revealLinkedProject();
  });
  update(false); revealLinkedProject();
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
  const pause = $('#toggleAutoRefresh');
  const status = $('#githubStatus');
  const connection = $('#githubConnection');
  const schedule = $('#githubSchedule');
  let storage;
  try { storage = localStorage; } catch {}
  const snapshot = readSnapshot(storage);
  let renderedSnapshot;
  let viewed = false;
  const dateTime = timestamp => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  const timeOnly = timestamp => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
  function render(value) {
    $('#repoTotal').textContent = value.publicRepos.toLocaleString();
    $('#followerTotal').textContent = value.followers.toLocaleString();
    const fragment = document.createDocumentFragment();
    value.repos.forEach(repo => {
      const article = document.createElement('article'); article.className = 'recent-repo';
      const link = document.createElement('a'); link.href = repo.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const title = document.createElement('h3'); title.textContent = projects.find(project => project.repo === repo.name)?.title || repo.name.replace(/^https---github\.com-Nitesh-Datascience-/, '').replace(/[_-]+/g, ' ');
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
    if (!value.repos.length) {
      const placeholder = document.createElement('p'); placeholder.className = 'github-placeholder';
      placeholder.textContent = 'No recent original repositories to display. Explore the GitHub profile above.';
      fragment.append(placeholder);
    }
    $('#recentRepos').replaceChildren(fragment);
  }
  function onChange(state) {
    if (state.snapshot && state.snapshot !== renderedSnapshot) { render(state.snapshot); renderedSnapshot = state.snapshot; }
    const saved = state.snapshot ? `Data from ${dateTime(state.snapshot.fetchedAt)}.` : 'Open the GitHub profile for more.';
    let label = state.snapshot ? state.source === 'live' ? 'Updated' : 'Saved data' : 'Ready';
    let text = state.snapshot ? `${state.source === 'live' ? 'Updated' : 'Saved snapshot'} · ${dateTime(state.snapshot.fetchedAt)}` : 'Public data from GitHub';
    let mode = state.snapshot ? state.source : 'ready';
    if (state.error === 'unavailable') { label = state.snapshot ? 'Saved data' : 'Unavailable'; mode = 'waiting'; text = `GitHub is temporarily unavailable. ${saved}`; }
    if (state.notice === 'cooldown') text = `Refresh available after ${timeOnly(state.manualAt)}. ${saved}`;
    if (state.error === 'rate') { label = 'Waiting'; mode = 'waiting'; text = `GitHub refresh limit reached. Retry after ${timeOnly(state.retryAt)}. ${saved}`; }
    if (state.paused) { label = 'Paused'; mode = 'paused'; text = `Automatic updates paused. ${saved}`; }
    if (!state.online) { label = 'Offline'; mode = 'offline'; text = `You’re offline. ${saved}`; }
    if (state.pending) { label = 'Refreshing'; mode = 'loading'; text = 'Refreshing public GitHub activity…'; }
    connection.textContent = label; connection.dataset.state = mode;
    if (status.textContent !== text) status.textContent = text;
    button.disabled = state.pending || !state.online;
    button.toggleAttribute('aria-busy', state.pending);
    if (state.pending) button.setAttribute('aria-busy', 'true');
    pause.textContent = state.paused ? 'Resume updates' : 'Pause updates';
    if (state.pending) schedule.textContent = 'Refreshing now';
    else if (state.paused) schedule.textContent = 'Auto refresh paused';
    else if (!state.online) schedule.textContent = 'Updates resume when online';
    else if (!state.visible) schedule.textContent = 'Updates resume when this page is visible';
    else if (state.started) schedule.textContent = `Next update ${timeOnly(state.dueAt)}`;
    else schedule.textContent = 'Automatic updates every five minutes';
  }
  const controller = new RefreshController({
    snapshot, onChange, online: navigator.onLine !== false, visible: !document.hidden,
    load: async () => {
      const value = await fetchGitHubSnapshot();
      try { storage?.setItem(CACHE_KEY, JSON.stringify(value)); } catch {}
      return value;
    },
  });
  controller.emit();
  button.addEventListener('click', () => { viewed = true; controller.refresh(true); });
  pause.addEventListener('click', () => controller.setPaused(!controller.getState().paused));
  document.addEventListener('visibilitychange', () => controller.setVisible(!document.hidden));
  window.addEventListener('online', () => controller.setOnline(true));
  window.addEventListener('offline', () => controller.setOnline(false));
  window.addEventListener('pagehide', () => controller.stop());
  window.addEventListener('pageshow', () => { if (viewed) controller.start(); });
  $('#githubLiveControls').hidden = false;
  button.hidden = false; pause.hidden = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { viewed = true; controller.start(); observer.disconnect(); }
    }, { rootMargin: '100px' });
    observer.observe($('#github'));
  } else { viewed = true; controller.start(); }
}


function initFeaturedStudy() {
  const buttons = $$('[data-chart]');
  const image = $('#studyImage');
  buttons.forEach(button => button.addEventListener('click', () => {
    const chart = featuredStudy.charts.find(item => item.id === button.dataset.chart);
    if (!chart) return;
    image.src = chart.src; image.alt = chart.alt;
    image.width = chart.width; image.height = chart.height;
    $('#studyCaption').textContent = chart.caption;
    $('#studyImageLink').href = chart.src;
    $('#studyFullSize').href = chart.src;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  $('#studyChartControls').hidden = false;
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
initFeaturedStudy();
initGitHub();
initContact();
$('#currentYear').textContent = new Date().getFullYear();

