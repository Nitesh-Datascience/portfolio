import { featuredStudy } from './content/featured-study.mjs?v=20261017.1';
import { projects } from './content/projects.mjs';
import { CACHE_KEY, EMAIL, createEmailDraft, fetchGitHubSnapshot, filterProjects, projectLink, projectStateURL, readProjectState, readSnapshot, sortProjects } from './portfolio-core.mjs?v=20261017.1';
import { RefreshController } from './refresh-controller.mjs?v=20261017.1';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];


function initInteractiveLab() {
  const canvas = $('#skillCanvas');
  const track = $('#spotlightTrack');
  if (!canvas || !track) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const skills = ['PYTHON','SQL','POWER BI','EXCEL','MACHINE LEARNING','PANDAS','STATISTICS','DATA STORYTELLING'];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const palette = ['#8de8ce','#a8a2ff','#f2c27c','#9fc7ff','#f09ac7'];
  let width = 900, height = 520, frame = 0, running = false;
  const pointer = { x: -1000, y: -1000, active: false };
  const balls = skills.map((label,i)=>({
    label, x: 130+(i%4)*205, y: 105+Math.floor(i/4)*245,
    vx: (i%2 ? -1 : 1) * (.35 + (i%3)*.12), vy: .15+(i%4)*.08,
    r: 40+(i%3)*5, color: palette[i%palette.length], depth: .82+(i%4)*.09,
    phase: i*.9, mass: 1+(i%3)*.18
  }));
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = 900; height = 520;
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    canvas.style.aspectRatio = '900 / 520';
    if (reduced) draw(performance.now());
  }
  function draw(now = 0) {
    ctx.clearRect(0,0,width,height);
    // Subtle orbital paths give the skill field a dimensional, data-lab feel.
    ctx.save();
    ctx.strokeStyle = '#ffffff0b'; ctx.lineWidth = 1;
    for (let i=0;i<5;i++) {
      ctx.beginPath(); ctx.ellipse(450,260,115+i*83,54+i*38,-.16,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
    balls.forEach((b,i)=>{
      if (!reduced) {
        b.phase += .008*b.depth;
        b.vy += .006*b.depth;
        b.x += b.vx; b.y += b.vy;
        // Soft sphere-to-sphere collisions keep the motion lively without jitter.
        for (let j=i+1;j<balls.length;j++) {
          const other=balls[j], dx=other.x-b.x, dy=other.y-b.y, dist=Math.hypot(dx,dy)||1;
          const min=b.r+other.r+13;
          if (dist<min) {
            const nx=dx/dist, ny=dy/dist, push=(min-dist)*.018;
            b.vx-=nx*push/ b.mass; b.vy-=ny*push/b.mass;
            other.vx+=nx*push/other.mass; other.vy+=ny*push/other.mass;
          }
        }
        if (pointer.active) {
          const dx=b.x-pointer.x, dy=b.y-pointer.y, dist=Math.hypot(dx,dy)||1;
          if (dist<175) { const force=(175-dist)/175*.16; b.vx+=dx/dist*force; b.vy+=dy/dist*force; }
        }
        b.vx += Math.sin(b.phase)*.0015;
        b.vx *= .997; b.vy *= .997;
        if (b.x<b.r+5 || b.x>width-b.r-5) { b.vx *= -.88; b.x=Math.max(b.r+5,Math.min(width-b.r-5,b.x)); }
        if (b.y<b.r+5 || b.y>height-b.r-5) { b.vy *= -.86; b.y=Math.max(b.r+5,Math.min(height-b.r-5,b.y)); }
      }
      const radius=b.r*(.96+Math.sin(b.phase)*.025);
      const shadow=ctx.createRadialGradient(b.x,b.y+radius*.72,2,b.x,b.y+radius*.72,radius*1.3);
      shadow.addColorStop(0,'#00000048'); shadow.addColorStop(1,'#00000000');
      ctx.beginPath(); ctx.ellipse(b.x,b.y+radius*.78,radius*1.08,radius*.36,0,0,Math.PI*2); ctx.fillStyle=shadow; ctx.fill();
      const glow=ctx.createRadialGradient(b.x-radius*.42,b.y-radius*.48,2,b.x,b.y,radius*1.42);
      glow.addColorStop(0,b.color+'ee'); glow.addColorStop(.48,b.color+'8a'); glow.addColorStop(1,b.color+'00');
      ctx.beginPath(); ctx.arc(b.x,b.y,radius*1.38,0,Math.PI*2); ctx.fillStyle=glow; ctx.fill();
      const sphere=ctx.createRadialGradient(b.x-radius*.38,b.y-radius*.48,2,b.x+radius*.1,b.y+radius*.1,radius*1.2);
      sphere.addColorStop(0,'#52616f'); sphere.addColorStop(.24,'#202f3e'); sphere.addColorStop(.72,'#111c29'); sphere.addColorStop(1,'#080f18');
      ctx.beginPath(); ctx.arc(b.x,b.y,radius,0,Math.PI*2); ctx.fillStyle=sphere; ctx.fill();
      ctx.lineWidth=1.5; ctx.strokeStyle=b.color+'c8'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(b.x-radius*.18,b.y-radius*.28,radius*.52,radius*.22,-.55,Math.PI,Math.PI*2);
      ctx.strokeStyle='#ffffff55'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#f4f7fb'; ctx.font='700 '+(b.label.length>13?10:12)+'px DM Sans, sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.label,b.x,b.y);
    });
    if (!reduced && running) frame=requestAnimationFrame(draw);
  }
  function position(event) {
    const rect=canvas.getBoundingClientRect();
    pointer.x=(event.clientX-rect.left)/rect.width*width;
    pointer.y=(event.clientY-rect.top)/rect.height*height;
  }
  function start() { if (!reduced && !running) { running=true; frame=requestAnimationFrame(draw); } }
  function stop() { running=false; if (frame) cancelAnimationFrame(frame); frame=0; }
  canvas.addEventListener('pointermove',e=>{position(e);pointer.active=true;});
  canvas.addEventListener('pointerleave',()=>{pointer.active=false;});
  canvas.addEventListener('pointerdown',e=>{
    position(e);
    balls.forEach(b=>{const dx=b.x-pointer.x,dy=b.y-pointer.y,d=Math.hypot(dx,dy)||1;if(d<260){b.vx+=dx/d*3.2;b.vy+=dy/d*3.2-1.4;}});
    if (reduced) draw(performance.now());
  });
  const spotlightIds=['foresight','edupro','fraud','churn'];
  const spotlight=spotlightIds.map(id=>projects.find(p=>p.id===id)).filter(Boolean);
  let active=0;
  spotlight.forEach((p,i)=>{
    const card=document.createElement('article'); card.className='spotlight-card';
    const kicker=document.createElement('span'); kicker.className='spotlight-kicker'; kicker.textContent=String(i+1).padStart(2,'0')+' / '+p.categoryLabel.toUpperCase();
    const title=document.createElement('h3'); title.textContent=p.title;
    const desc=document.createElement('p'); desc.textContent=p.description;
    const tags=document.createElement('div'); tags.className='spotlight-tags';
    p.tags.forEach(tag=>{const el=document.createElement('span');el.textContent=tag;tags.append(el);});
    const links=document.createElement('div'); links.className='spotlight-links';
    const source=document.createElement('a'); source.href='https://github.com/Nitesh-Datascience/'+p.repo; source.target='_blank'; source.rel='noopener noreferrer'; source.textContent='VIEW SOURCE ↗'; links.append(source);
    if(p.demo){const demo=document.createElement('a');demo.href=p.demo;demo.target='_blank';demo.rel='noopener noreferrer';demo.textContent='LIVE DEMO ↗';links.append(demo);}
    card.append(kicker,title,desc,tags,links); track.append(card);
  });
  function show(index) {
    if (!spotlight.length) return;
    active=(index+spotlight.length)%spotlight.length;
    track.style.transform='translateX(-'+active*100+'%)';
    const count=$('#spotlightCount');
    if (count) count.textContent=String(active+1).padStart(2,'0')+' / '+String(spotlight.length).padStart(2,'0');
  }
  $('#spotlightPrev')?.addEventListener('click',()=>show(active-1));
  $('#spotlightNext')?.addEventListener('click',()=>show(active+1));
  resize(); show(0);
  if ('IntersectionObserver' in window && !reduced) {
    const observer=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting) start(); else stop();
    },{threshold:.08});
    observer.observe(canvas);
  } else start();
  window.addEventListener('resize',resize,{passive:true});
}

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

initInteractiveLab();
initTheme();
initNavigation();
initProjects();
initFeaturedStudy();
initGitHub();
initContact();
$('#currentYear').textContent = new Date().getFullYear();

