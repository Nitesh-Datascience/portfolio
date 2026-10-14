import test from 'node:test';
import assert from 'node:assert/strict';
import { RefreshController } from '../refresh-controller.mjs';
import { CACHE_TTL } from '../portfolio-core.mjs';

function harness(load, snapshot = null, options = {}) {
  let now = Date.parse('2026-10-14T06:00:00Z');
  let nextId = 0;
  const timers = new Map();
  const states = [];
  const controller = new RefreshController({
    load: () => load(now), snapshot, now: () => now,
    setTimer: (callback, delay) => { timers.set(++nextId, { callback, at: now + delay }); return nextId; },
    clearTimer: id => timers.delete(id), onChange: state => states.push(state), ...options,
  });
  return { controller, states, timers, now: () => now, advance: async ms => {
    now += ms;
    for (const [id, timer] of [...timers]) {
      if (timer.at <= now && timers.has(id)) { timers.delete(id); await timer.callback(); }
    }
  } };
}

test('fresh saved data waits until its due time and uses one scheduled refresh', async () => {
  let calls = 0;
  const saved = { fetchedAt: Date.parse('2026-10-14T05:59:00Z') };
  const h = harness(async now => { calls++; return { fetchedAt: now }; }, saved);
  await h.controller.start();
  assert.equal(calls, 0); assert.equal(h.timers.size, 1);
  await h.advance(3 * 60_000); assert.equal(calls, 0);
  await h.advance(60_000); assert.equal(calls, 1);
  assert.equal(h.timers.size, 1);
  assert.equal(h.controller.getState().source, 'live');
  assert.equal(h.controller.getState().dueAt, h.now() + CACHE_TTL);
});

test('manual refresh observes the cooldown and does not duplicate an active request', async () => {
  let resolve;
  let calls = 0;
  const h = harness(now => { calls++; return new Promise(done => { resolve = () => done({ fetchedAt: now }); }); });
  const pending = h.controller.start();
  assert.equal(h.controller.getState().pending, true);
  assert.equal(await h.controller.refresh(true), false); assert.equal(calls, 1);
  resolve(); await pending;
  assert.equal(await h.controller.refresh(true), false);
  assert.equal(h.controller.getState().notice, 'cooldown');
  await h.advance(60_000);
  const second = h.controller.refresh(true); assert.equal(calls, 2);
  resolve(); await second;
  assert.equal(h.controller.getState().pending, false); assert.equal(h.timers.size, 1);
});

test('hidden and paused pages stop automatic requests; manual refresh works while paused', async () => {
  let calls = 0;
  const h = harness(async now => { calls++; return { fetchedAt: now }; });
  await h.controller.start();
  h.controller.setVisible(false); assert.equal(h.timers.size, 0);
  await h.advance(15 * 60_000); assert.equal(calls, 1);
  await h.controller.setVisible(true); assert.equal(calls, 2);
  h.controller.setPaused(true); await h.advance(15 * 60_000); assert.equal(calls, 2);
  await h.controller.refresh(true); assert.equal(calls, 3); assert.equal(h.timers.size, 0);
  await h.controller.setPaused(false); assert.equal(calls, 3); assert.equal(h.timers.size, 1);
});

test('offline mode preserves data and resumes a due refresh when connected', async () => {
  let calls = 0;
  const h = harness(async now => { calls++; return { fetchedAt: now }; }, null, { online: false });
  await h.controller.start(); assert.equal(calls, 0); assert.equal(h.timers.size, 0);
  await h.controller.setOnline(true); assert.equal(calls, 1);
  const saved = h.controller.getState().snapshot;
  h.controller.setOnline(false); await h.advance(10 * 60_000);
  assert.equal(calls, 1); assert.equal(h.controller.getState().snapshot, saved);
  await h.controller.setOnline(true); assert.equal(calls, 2);
});

test('rate limits block manual and scheduled requests until the server reset', async () => {
  let calls = 0;
  const h = harness(async now => {
    calls++;
    if (calls === 1) throw Object.assign(new Error('rate limit'), { code: 'RATE_LIMITED', retryAt: now + 3_600_000 });
    return { fetchedAt: now };
  });
  await h.controller.start(); assert.equal(calls, 1);
  await h.advance(120_000); await h.controller.refresh(true); assert.equal(calls, 1);
  await h.advance(3_480_000); assert.equal(calls, 2);
  assert.equal(h.controller.getState().error, null);
});

test('temporary failures keep saved data and back off before recovering', async () => {
  let calls = 0;
  const saved = { fetchedAt: Date.parse('2026-10-14T05:00:00Z') };
  const h = harness(async now => { calls++; if (calls < 3) throw new Error('network unavailable'); return { fetchedAt: now }; }, saved);
  await h.controller.start(); assert.equal(h.controller.getState().snapshot, saved);
  await h.advance(CACHE_TTL); assert.equal(calls, 2);
  assert.equal(h.controller.getState().dueAt, h.now() + 2 * CACHE_TTL);
  await h.advance(2 * CACHE_TTL); assert.equal(calls, 3);
  assert.equal(h.controller.getState().error, null);
  assert.equal(h.controller.getState().dueAt, h.now() + CACHE_TTL);
  h.controller.stop(); assert.equal(h.timers.size, 0);
});
