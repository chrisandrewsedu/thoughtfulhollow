// sampler-picross.stats.js — solve tracking + streaks, localStorage only.
// Exposes window.PicrossStats. All dates are ISO YYYY-MM-DD strings.

(function () {
  const KEY = 'picross-stats-v1';
  const SOLVED_KEY = 'picross-solved-ids-v1';

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { solves: [], totalMs: 0 };
      const obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.solves)) return { solves: [], totalMs: 0 };
      return obj;
    } catch {
      return { solves: [], totalMs: 0 };
    }
  }

  function write(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
  }

  function readSolvedIds() {
    try {
      const raw = localStorage.getItem(SOLVED_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function writeSolvedIds(ids) {
    try { localStorage.setItem(SOLVED_KEY, JSON.stringify(ids)); } catch {}
  }

  // Date in YYYY-MM-DD → previous day in YYYY-MM-DD.
  function prevDay(iso) {
    const dt = new Date(iso + 'T12:00:00');
    dt.setUTCDate(dt.getUTCDate() - 1);
    return dt.toISOString().slice(0, 10);
  }

  function todayET() {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    return fmt.format(new Date());
  }

  function recordSolve(opts) {
    const { date, elapsedMs, designId } = opts || {};
    if (!date) return getStats();
    const data = read();
    const exists = data.solves.find(s => s.date === date);
    if (!exists) {
      data.solves.push({ date, elapsedMs: elapsedMs || 0 });
      data.totalMs = (data.totalMs || 0) + (elapsedMs || 0);
      write(data);
    }
    if (designId) {
      const ids = readSolvedIds();
      if (!ids.includes(designId)) {
        ids.push(designId);
        writeSolvedIds(ids);
      }
    }
    return getStats();
  }

  function getStreak(today) {
    const data = read();
    if (!data.solves.length) return 0;
    const set = new Set(data.solves.map(s => s.date));
    // Start from today (ET). If today not solved, start from yesterday.
    let cursor = today || todayET();
    if (!set.has(cursor)) cursor = prevDay(cursor);
    let streak = 0;
    while (set.has(cursor)) {
      streak += 1;
      cursor = prevDay(cursor);
    }
    return streak;
  }

  function getStats(today) {
    const data = read();
    const count = data.solves.length;
    const avgMs = count > 0 ? Math.round((data.totalMs || 0) / count) : 0;
    return {
      streak: getStreak(today),
      solveCount: count,
      avgMs,
      totalMs: data.totalMs || 0,
    };
  }

  function getSolvedSet() {
    return new Set(readSolvedIds());
  }

  function getSolvedDates() {
    const data = read();
    return new Set(data.solves.map(s => s.date));
  }

  function formatDuration(ms) {
    if (!ms || ms < 1000) return '—';
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(SOLVED_KEY);
    } catch {}
  }

  window.PicrossStats = {
    recordSolve, getStreak, getStats,
    getSolvedSet, getSolvedDates,
    formatDuration, clear,
  };
})();
