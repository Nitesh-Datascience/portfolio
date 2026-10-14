export const GITHUB_USER = 'Nitesh-Datascience';
export const EMAIL = 'ns0762005@gmail.com';
export const CACHE_KEY = 'nitesh.github.v1';
export const CACHE_TTL = 5 * 60 * 1000;

export function filterProjects(projects, category = 'all', query = '') {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter(project => {
    const haystack = [project.title, project.subtitle, project.categoryLabel, project.description, ...(project.tags || [])].join(' ').toLocaleLowerCase();
    return (category === 'all' || (category === 'live' ? Boolean(project.demo) : project.category === category)) && terms.every(term => haystack.includes(term));
  });
}

export function sortProjects(projects, order = 'featured') {
  const sorted = [...projects];
  if (order === 'name') sorted.sort((a, b) => a.title.localeCompare(b.title, 'en'));
  if (order === 'demo') sorted.sort((a, b) => Number(Boolean(b.demo)) - Number(Boolean(a.demo)));
  return sorted;
}

export function readProjectState(url) {
  const params = new URL(url).searchParams;
  const category = params.get('category');
  const sort = params.get('sort');
  return {
    category: ['all', 'live', 'analytics', 'ml', 'ai'].includes(category) ? category : 'all',
    query: (params.get('q') || '').slice(0, 160),
    sort: ['featured', 'name', 'demo'].includes(sort) ? sort : 'featured',
    expanded: params.get('view') === 'all',
  };
}

export function projectStateURL(url, state) {
  const result = new URL(url);
  for (const key of ['category', 'q', 'sort', 'view']) result.searchParams.delete(key);
  if (state.category !== 'all') result.searchParams.set('category', state.category);
  if (state.query.trim()) result.searchParams.set('q', state.query.trim().slice(0, 160));
  if (state.sort !== 'featured') result.searchParams.set('sort', state.sort);
  if (state.expanded) result.searchParams.set('view', 'all');
  return result;
}

export function projectLink(url, id) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Invalid project ID');
  const result = new URL(url); result.search = ''; result.hash = `project-${id}`;
  return result.href;
}

export function githubRetryAt(headers, now = Date.now()) {
  const retry = headers?.get?.('retry-after');
  const remaining = headers?.get?.('x-ratelimit-remaining');
  const reset = headers?.get?.('x-ratelimit-reset');
  let retryAt = now + 60_000;
  if (retry && /^\d+$/.test(retry)) retryAt = Math.max(retryAt, now + Number(retry) * 1000);
  else if (retry && Number.isFinite(Date.parse(retry))) retryAt = Math.max(retryAt, Date.parse(retry));
  if (remaining === '0' && reset && /^\d+$/.test(reset)) retryAt = Math.max(retryAt, Number(reset) * 1000 + 1000);
  return Number.isSafeInteger(retryAt) ? retryAt : now + CACHE_TTL;
}

export function createEmailDraft({ name, email, purpose, message }) {
  const clean = value => String(value || '').trim();
  const sender = clean(name);
  const text = clean(message);
  if (!sender || !text || !clean(email)) throw new Error('Please complete your name, email, and message.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email))) throw new Error('Please enter a valid email address.');
  const subject = `Portfolio enquiry — ${clean(purpose) || 'Let’s connect'}`;
  const body = `Hi Nitesh,\n\n${text}\n\nRegards,\n${sender}\n${clean(email)}`;
  return { subject, body, url: `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

function count(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid GitHub response');
  return value;
}

export function normalizeSnapshot(profile, repositories, fetchedAt = Date.now()) {
  if (profile?.login !== GITHUB_USER || !Array.isArray(repositories)) throw new Error('Unexpected GitHub response');
  const repos = repositories.filter(repo => repo && repo.owner?.login === GITHUB_USER && !repo.fork && !repo.archived && /^[A-Za-z0-9_.-]+$/.test(repo.name) && Number.isFinite(Date.parse(repo.pushed_at)))
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, 3).map(repo => ({
      name: repo.name,
      description: typeof repo.description === 'string' ? repo.description.slice(0, 240) : 'Explore the project and its documentation on GitHub.',
      language: typeof repo.language === 'string' ? repo.language.slice(0, 40) : 'Repository',
      stars: Number.isSafeInteger(repo.stargazers_count) && repo.stargazers_count >= 0 ? repo.stargazers_count : 0,
      pushedAt: repo.pushed_at,
      url: `https://github.com/${GITHUB_USER}/${encodeURIComponent(repo.name)}`,
    }));
  if (!Number.isFinite(fetchedAt)) throw new Error('Invalid refresh timestamp');
  return { publicRepos: count(profile.public_repos), followers: count(profile.followers), repos, fetchedAt };
}

export async function fetchGitHubSnapshot(fetcher = globalThis.fetch, now = Date.now()) {
  const request = async url => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetcher(url, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
      if (!response.ok) {
        const limited = response.status === 403 || response.status === 429;
        const error = new Error(limited ? 'GitHub refresh limit reached' : 'GitHub is temporarily unavailable');
        if (limited) { error.code = 'RATE_LIMITED'; error.retryAt = githubRetryAt(response.headers, now); }
        throw error;
      }
      return await response.json();
    } finally { clearTimeout(timeout); }
  };
  // Sequential reads avoid a second request when the profile endpoint is rate-limited.
  const profile = await request(`https://api.github.com/users/${GITHUB_USER}`);
  const repositories = await request(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=100`);
  return normalizeSnapshot(profile, repositories, now);
}

export function readSnapshot(storage, now = Date.now()) {
  try {
    const snapshot = JSON.parse(storage.getItem(CACHE_KEY));
    if (!snapshot || !Number.isFinite(snapshot.fetchedAt) || snapshot.fetchedAt > now || now - snapshot.fetchedAt > 24 * 60 * 60 * 1000 || !Array.isArray(snapshot.repos)) return null;
    count(snapshot.publicRepos); count(snapshot.followers);
    const safe = normalizeSnapshot({ login: GITHUB_USER, public_repos: snapshot.publicRepos, followers: snapshot.followers }, snapshot.repos.map(repo => ({
      name: repo.name, owner: { login: GITHUB_USER }, description: repo.description, language: repo.language,
      stargazers_count: repo.stars, pushed_at: repo.pushedAt,
    })), snapshot.fetchedAt);
    return safe;
  } catch { return null; }
}
