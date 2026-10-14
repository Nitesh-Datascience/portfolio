import test from 'node:test';
import assert from 'node:assert/strict';
import { projects } from '../content/projects.mjs';
import { CACHE_KEY, CACHE_TTL, GITHUB_USER, createEmailDraft, fetchGitHubSnapshot, filterProjects, normalizeSnapshot, readSnapshot } from '../portfolio-core.mjs';

const now = Date.parse('2026-10-14T06:00:00Z');
const profile = { login: GITHUB_USER, public_repos: 42, followers: 5 };
const repo = (name, pushedAt = '2026-10-13T12:00:00Z', extra = {}) => ({ name, owner: { login: GITHUB_USER }, pushed_at: pushedAt, stargazers_count: 2, language: 'Python', description: 'A data project', ...extra });
const storage = value => ({ getItem: key => { assert.equal(key, CACHE_KEY); return value; } });

test('project filters combine category and case-insensitive search terms', () => {
  assert.equal(filterProjects(projects).length, 13);
  assert.deepEqual(filterProjects(projects, 'ml', 'CHURN python').map(p => p.id), ['churn', 'telecom']);
  assert.deepEqual(filterProjects(projects, 'analytics', 'excel').map(p => p.id), ['sales']);
  assert.equal(filterProjects(projects, 'analytics', 'K-Means').length, 0);
  assert.equal(filterProjects(projects, 'all', '  ').length, projects.length);
  assert.equal(filterProjects(projects, 'all', 'does-not-exist').length, 0);
});

test('curated content has unique IDs and valid source and demo destinations', () => {
  assert.equal(new Set(projects.map(p => p.id)).size, projects.length);
  assert.equal(projects.filter(p => p.demo).length, 7);
  for (const project of projects) {
    assert.match(project.repo, /^[A-Za-z0-9_.-]+$/);
    assert.ok(project.title && project.question && project.approach && project.deliverable);
    if (project.demo) {
      const url = new URL(project.demo);
      assert.equal(url.protocol, 'https:');
      assert.ok(url.hostname.endsWith('.streamlit.app'));
    }
  }
  assert.equal(projects.find(p => p.id === 'logistics').repo, 'https---github.com-Nitesh-Datascience-APL_Logistics');
});

test('email drafts retain Unicode and punctuation without adding recipients', () => {
  const result = createEmailDraft({ name: ' A & B ', email: 'user@example.com', purpose: 'Feedback &cc=other@example.com', message: 'Hello Nitesh,\nSQL + Python? हिंदी ✓' });
  const url = new URL(result.url);
  assert.equal(url.pathname, 'ns0762005@gmail.com');
  assert.equal(url.searchParams.get('body'), result.body);
  assert.match(result.body, /हिंदी ✓/);
  assert.equal(url.searchParams.get('cc'), null);
  assert.ok(result.body.endsWith('A & B\nuser@example.com'));
});

test('email drafts reject missing and malformed input', () => {
  for (const input of [
    { name: '  ', email: 'a@b.com', message: 'Hello there' },
    { name: 'A', email: '', message: 'Hello there' },
    { name: 'A', email: 'not an email', message: 'Hello there' },
    { name: 'A', email: 'a@b.com', message: '\n  ' },
  ]) assert.throws(() => createEmailDraft(input));
});

test('GitHub data excludes forks, archived and foreign repositories, and ignores remote URLs', () => {
  const snapshot = normalizeSnapshot(profile, [
    repo('older', '2026-10-01T12:00:00Z'),
    repo('newer', '2026-10-13T12:00:00Z', { html_url: 'https://evil.example' }),
    repo('fork', undefined, { fork: true }),
    repo('archived', undefined, { archived: true }),
    repo('foreign', undefined, { owner: { login: 'another-user' } }),
    repo('../bad'), repo('<script>'), repo('bad-date', 'not a date'),
  ], now);
  assert.deepEqual(snapshot.repos.map(p => p.name), ['newer', 'older']);
  assert.equal(snapshot.repos[0].url, `https://github.com/${GITHUB_USER}/newer`);
  assert.equal(snapshot.publicRepos, 42);
  assert.equal(snapshot.fetchedAt, now);
  assert.throws(() => normalizeSnapshot({ ...profile, public_repos: -1 }, [], now));
  assert.throws(() => normalizeSnapshot({ ...profile, login: 'other' }, [], now));
  assert.throws(() => normalizeSnapshot(profile, {}, now));
});

test('GitHub fetch requests public profile and repositories and returns validated data', async () => {
  const requests = [];
  const fetcher = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => url.includes('/repos?') ? [repo('project')] : profile };
  };
  const snapshot = await fetchGitHubSnapshot(fetcher, now);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(request => request.url.startsWith(`https://api.github.com/users/${GITHUB_USER}`)));
  assert.ok(requests.every(request => request.options.signal instanceof AbortSignal));
  assert.ok(requests.every(request => !('Authorization' in request.options.headers)));
  assert.equal(snapshot.repos[0].name, 'project');
});

test('GitHub rate limits and malformed responses fail without fabricated totals', async () => {
  await assert.rejects(fetchGitHubSnapshot(async () => ({ ok: false, status: 403 }), now), /refresh limit/);
  await assert.rejects(fetchGitHubSnapshot(async () => ({ ok: false, status: 500 }), now), /unavailable/);
  await assert.rejects(fetchGitHubSnapshot(async () => ({ ok: true, json: async () => ({}) }), now), /Unexpected/);
});

test('cached snapshots remain available during outages and rebuild safe URLs', () => {
  const snapshot = normalizeSnapshot(profile, [repo('safe-project')], now - CACHE_TTL - 1);
  snapshot.repos[0].url = 'javascript:alert(1)';
  const restored = readSnapshot(storage(JSON.stringify(snapshot)), now);
  assert.equal(restored.repos[0].url, `https://github.com/${GITHUB_USER}/safe-project`);
  assert.equal(restored.fetchedAt, snapshot.fetchedAt);
  assert.equal(restored.publicRepos, 42);
});

test('expired, future, corrupt, and inaccessible cache entries are discarded', () => {
  const snapshot = normalizeSnapshot(profile, [repo('project')], now);
  assert.equal(readSnapshot(storage(JSON.stringify(snapshot)), now + 25 * 60 * 60 * 1000), null);
  assert.equal(readSnapshot(storage(JSON.stringify(snapshot)), now - 1), null);
  assert.equal(readSnapshot(storage('{broken'), now), null);
  assert.equal(readSnapshot(storage('null'), now), null);
  assert.equal(readSnapshot(storage(JSON.stringify({ ...snapshot, repos: [null] })), now), null);
  assert.equal(readSnapshot({ getItem() { throw new Error('Blocked'); } }, now), null);
  assert.equal(readSnapshot(undefined, now), null);
});
