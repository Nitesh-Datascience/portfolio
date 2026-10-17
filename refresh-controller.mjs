import { CACHE_TTL } from './portfolio-core.mjs?v=20261017.1';

// One refresh schedule for timers, manual requests, visibility, and connectivity.
export class RefreshController {
  constructor({ load, snapshot = null, onChange = () => {}, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout, online = true, visible = true }) {
    this.load = load; this.onChange = onChange; this.now = now;
    this.setTimer = setTimer; this.clearTimer = clearTimer;
    this.timer = null; this.started = false; this.failures = 0; this.lastAttempt = -Infinity;
    this.state = { snapshot, source: snapshot ? 'saved' : null, paused: false, visible, online, pending: false, error: null, notice: null, retryAt: 0, nextRefreshAt: snapshot ? snapshot.fetchedAt + CACHE_TTL : 0 };
  }
  getState() {
    return { ...this.state, started: this.started, manualAt: Math.max(this.state.retryAt, this.lastAttempt + 60_000), dueAt: Math.max(this.state.nextRefreshAt, this.state.retryAt, this.lastAttempt + 60_000) };
  }
  emit() { this.onChange(this.getState()); }
  schedule() {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    if (!this.started || this.state.paused || !this.state.visible || !this.state.online || this.state.pending) return;
    const delay = Math.max(0, this.getState().dueAt - this.now());
    this.timer = this.setTimer(() => { this.timer = null; return this.refresh(); }, Math.min(delay, 2_147_483_647));
  }
  start() { this.started = true; return this.refresh(); }
  stop() { this.started = false; if (this.timer !== null) this.clearTimer(this.timer); this.timer = null; }
  setPaused(paused) {
    this.state.paused = Boolean(paused); this.state.notice = null;
    this.emit(); this.schedule();
    if (!paused && this.started) return this.refresh();
  }
  setVisible(visible) {
    this.state.visible = Boolean(visible); this.emit(); this.schedule();
    if (visible && this.started && !this.state.paused) return this.refresh();
  }
  setOnline(online) {
    this.state.online = Boolean(online); this.emit(); this.schedule();
    if (online && this.started && !this.state.paused) return this.refresh();
  }
  async refresh(manual = false) {
    const state = this.state;
    if (manual) this.started = true;
    if (!this.started || state.pending) return false;
    if (!state.online || (!manual && (state.paused || !state.visible))) { this.emit(); this.schedule(); return false; }
    const now = this.now();
    const dueAt = Math.max(state.retryAt, this.lastAttempt + 60_000, manual ? 0 : state.nextRefreshAt);
    if (now < dueAt) { state.notice = manual ? 'cooldown' : null; this.emit(); this.schedule(); return false; }
    state.pending = true; state.notice = null; this.lastAttempt = now;
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null; this.emit();
    try {
      state.snapshot = await this.load();
      state.source = 'live'; state.error = null; state.retryAt = 0; this.failures = 0;
      state.nextRefreshAt = this.now() + CACHE_TTL;
      return true;
    } catch (error) {
      this.failures += 1;
      if (error?.code === 'RATE_LIMITED') {
        state.error = 'rate';
        state.retryAt = Math.max(this.now() + 60_000 * 2 ** Math.min(this.failures - 1, 5), Number.isFinite(error.retryAt) ? error.retryAt : this.now() + CACHE_TTL);
        state.nextRefreshAt = state.retryAt;
      } else {
        state.error = 'unavailable';
        state.nextRefreshAt = this.now() + Math.min(CACHE_TTL * 2 ** Math.min(this.failures - 1, 3), 30 * 60 * 1000);
      }
      return false;
    } finally { state.pending = false; this.emit(); this.schedule(); }
  }
}

