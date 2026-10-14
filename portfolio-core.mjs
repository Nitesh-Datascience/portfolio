export const GITHUB_USER = 'Nitesh-Datascience';
export const EMAIL = 'ns0762005@gmail.com';
export const CACHE_KEY = 'nitesh.github.v1';
export const CACHE_TTL = 5 * 60 * 1000;

export function filterProjects(projects, category = 'all', query = '') {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter(project => {
    const haystack = [project.title, project.subtitle, project.categoryLabel, project.description, ...(project.tags || [])].join(' ').toLocaleLowerCase();
    return (category === 'all' || project.category === category) && terms.every(term => haystack.includes(term));
  });
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
      if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'GitHub refresh limit reached' : 'GitHub is temporarily unavailable');
      return await response.json();
    } finally { clearTimeout(timeout); }
  };
  const [profile, repositories] = await Promise.all([
    request(`https://api.github.com/users/${GITHUB_USER}`),
    request(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=100`),
  ]);
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
