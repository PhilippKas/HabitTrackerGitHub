/* ─────────────────────────────────────
   Habit Tracker — game rules (cyberpunk RPG layer)

   Everything here is DERIVED from the stored check-offs; nothing is ever
   written back. The same data always produces the same XP, level, crits
   and badges — so the game survives export/import and can't drift.

   Plain script (no modules). Exposes one global, `Game`, so nothing here
   can collide with index.html — and the app keeps working (just without
   the game) if this file ever fails to load. Node gets the same object via
   module.exports for unit tests.
   ───────────────────────────────────── */

(function (root) {
  'use strict';

  // ── Date helpers (YYYY-MM-DD, local time) — shared with index.html ──
  function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function dateAdd(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return fmtDate(d);
  }

  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  // ── Rules ──
  const STATS = ['BODY', 'INT', 'TECH', 'COOL', 'EMP'];
  const STAT_INFO = {
    BODY: { name: 'Body',         cls: 'Solo',      icon: 'crosshair', hint: 'Fitness, sleep, health' },
    INT:  { name: 'Intelligence', cls: 'Netrunner', icon: 'cpu',       hint: 'Reading, learning' },
    TECH: { name: 'Tech',         cls: 'Techie',    icon: 'wrench',    hint: 'Skills, work, building' },
    COOL: { name: 'Cool',         cls: 'Fixer',     icon: 'briefcase', hint: 'Discipline, calm, money' },
    EMP:  { name: 'Empathy',      cls: 'Rockerboy', icon: 'music',     hint: 'People, creativity' },
  };
  const NO_CLASS = { cls: 'Drifter', icon: 'compass' };

  const RANKS = [
    [20, 'Legend'], [15, 'Street Samurai'], [10, 'Merc'],
    [5, 'Edgerunner'], [3, 'Punk'], [1, 'Street Kid'],
  ];

  const XP_BASE = 10;
  const XP_STREAK_STEP = 2;     // per consecutive day in the habit's current run…
  const XP_STREAK_CAP = 10;     // …up to this bonus
  const XP_PERFECT_DAY = 25;

  const ACHIEVEMENTS = [
    { id: 'jack_in',    name: 'Jack In',        icon: 'plug',     desc: 'First check-off' },
    { id: 'boot',       name: 'Boot Sequence',  icon: 'bolt',     desc: '3-day streak' },
    { id: 'chrome',     name: 'Chrome Will',    icon: 'flame',    desc: '7-day streak' },
    { id: 'iron',       name: 'Iron Protocol',  icon: 'shield',   desc: '30-day streak' },
    { id: 'legend',     name: 'Legend Status',  icon: 'crown',    desc: '100-day streak' },
    { id: 'full_sync',  name: 'Full Sync',      icon: 'sync',     desc: 'Every habit done in a day' },
    { id: 'clean_week', name: 'Clean Week',     icon: 'calendar', desc: 'Perfect Monday–Sunday' },
    { id: 'century',    name: 'Century',        icon: 'trophy',   desc: '100 check-offs' },
    { id: 'kilo',       name: 'Kilo',           icon: 'star',     desc: '1,000 check-offs' },
    { id: 'nat20',      name: 'Natural 20',     icon: 'dice',     desc: 'Roll a critical hit' },
    { id: 'reboot',     name: 'Reboot',         icon: 'refresh',  desc: 'Back after 7+ days off' },
    { id: 'specialist', name: 'Specialist',     icon: 'target',   desc: 'An attribute reaches 12' },
    { id: 'multiclass', name: 'Multiclass',     icon: 'layers',   desc: 'Three attributes at 8+' },
  ];

  // Deterministic d20 per (habit, day): FNV-1a hash → 1..20.
  function d20(habitId, date) {
    let h = 0x811c9dc5;
    const s = `${habitId}|${date}`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return (h % 20) + 1;
  }

  function streakBonus(run) {
    return Math.min(XP_STREAK_CAP, XP_STREAK_STEP * (run - 1));
  }

  // XP needed to go from level L to L+1.
  function levelCost(level) {
    return 100 + 50 * (level - 1);
  }

  function levelFromXp(xp) {
    let level = 1, rest = xp;
    while (rest >= levelCost(level)) { rest -= levelCost(level); level++; }
    return { level, into: rest, need: levelCost(level) };
  }

  function rankFor(level) {
    return RANKS.find(([min]) => level >= min)[1];
  }

  function statScore(statXp) {
    return Math.min(20, 3 + Math.floor(Math.sqrt(statXp / 40)));
  }

  function statMod(score) {
    return Math.floor((score - 10) / 2);
  }

  // ── The replay ──
  // Walks every day from the first check-off to today, in order, and
  // accumulates XP, streaks, perfect days and achievement unlocks.
  // Check-offs on future dates are ignored for the game.
  function computeProgress(state, todayStr) {
    const habits = (state && Array.isArray(state.habits)) ? state.habits : [];
    const sets = habits.map(h => new Set(
      (Array.isArray(h.completed) ? h.completed : []).filter(d => typeof d === 'string' && DATE_RE.test(d) && d <= todayStr)
    ));

    let earliest = null;
    sets.forEach(s => s.forEach(d => { if (!earliest || d < earliest) earliest = d; }));

    const statXp = Object.fromEntries(STATS.map(s => [s, 0]));
    const perHabit = {};
    habits.forEach(h => { perHabit[h.id] = { xp: 0, best: 0, count: 0 }; });
    const unlocked = {};
    const critDays = new Set();
    const perfectDays = new Set();
    const dayStats = new Map(); // date → { done, active }
    const unlock = (id, d) => { if (!unlocked[id]) unlocked[id] = d; };

    let xp = 0, checks = 0;
    const run = habits.map(() => 0);
    const last = habits.map(() => null);

    if (earliest) {
      for (let d = earliest; d <= todayStr; d = dateAdd(d, 1)) {
        let done = 0, active = 0;
        habits.forEach((h, i) => {
          const has = sets[i].has(d);
          const created = typeof h.createdAt === 'string' && DATE_RE.test(h.createdAt) ? h.createdAt : earliest;
          if (created <= d || has) active++;
          if (!has) return;

          done++;
          checks++;
          if (last[i] && daysBetween(last[i], d) > 7) unlock('reboot', d);
          run[i] = last[i] === dateAdd(d, -1) ? run[i] + 1 : 1;
          last[i] = d;

          let gain = XP_BASE + streakBonus(run[i]);
          if (d20(h.id, d) === 20) { gain *= 2; critDays.add(`${h.id}|${d}`); unlock('nat20', d); }
          xp += gain;
          if (STATS.includes(h.stat)) statXp[h.stat] += gain;
          const ph = perHabit[h.id];
          ph.xp += gain; ph.count++; ph.best = Math.max(ph.best, run[i]);

          unlock('jack_in', d);
          if (run[i] >= 3) unlock('boot', d);
          if (run[i] >= 7) unlock('chrome', d);
          if (run[i] >= 30) unlock('iron', d);
          if (run[i] >= 100) unlock('legend', d);
        });

        dayStats.set(d, { done, active });
        if (active > 0 && done === active) {
          perfectDays.add(d);
          xp += XP_PERFECT_DAY;
          unlock('full_sync', d);
          // Sunday closing a perfect Monday–Sunday week
          if (new Date(d + 'T00:00:00').getDay() === 0) {
            let week = true;
            for (let k = 1; k < 7; k++) if (!perfectDays.has(dateAdd(d, -k))) { week = false; break; }
            if (week) unlock('clean_week', d);
          }
        }
        if (checks >= 100) unlock('century', d);
        if (checks >= 1000) unlock('kilo', d);

        const scores = STATS.map(s => statScore(statXp[s]));
        if (scores.some(s => s >= 12)) unlock('specialist', d);
        if (scores.filter(s => s >= 8).length >= 3) unlock('multiclass', d);
      }
    }

    const lvl = levelFromXp(xp);
    const stats = {};
    STATS.forEach(s => {
      const score = statScore(statXp[s]);
      stats[s] = { xp: statXp[s], score, mod: statMod(score) };
    });
    const top = STATS.filter(s => statXp[s] > 0).sort((a, b) => statXp[b] - statXp[a])[0];
    const klass = top ? { cls: STAT_INFO[top].cls, icon: STAT_INFO[top].icon, stat: top } : { ...NO_CLASS, stat: null };

    return {
      xp,
      level: lvl.level,
      levelXp: lvl.into,
      nextXp: lvl.need,
      rank: rankFor(lvl.level),
      cls: klass.cls,
      clsIcon: klass.icon,
      topStat: klass.stat,
      stats,
      checks,
      integrity: completionRate(state, todayStr, 7),
      rate30: completionRate(state, todayStr, 30),
      achievements: ACHIEVEMENTS.map(a => ({ ...a, unlockedOn: unlocked[a.id] || null })),
      perHabit,
      critDays,
      perfectDays,
      dayStats,
    };
  }

  // Share of expected check-offs done over the last `days` days, not counting
  // today (today isn't over yet). A habit is expected from its createdAt on.
  // No expected check-offs → 100.
  function completionRate(state, todayStr, days) {
    const habits = (state && Array.isArray(state.habits)) ? state.habits : [];
    let expected = 0, done = 0;
    for (let k = 1; k <= days; k++) {
      const d = dateAdd(todayStr, -k);
      habits.forEach(h => {
        const has = Array.isArray(h.completed) && h.completed.includes(d);
        const created = typeof h.createdAt === 'string' && DATE_RE.test(h.createdAt) ? h.createdAt : d;
        if (created <= d || has) { expected++; if (has) done++; }
      });
    }
    return expected === 0 ? 100 : Math.round(100 * done / expected);
  }

  const Game = {
    fmtDate, dateAdd, daysBetween,
    STATS, STAT_INFO, ACHIEVEMENTS, d20, streakBonus, levelCost, levelFromXp, rankFor,
    statScore, statMod, computeProgress, completionRate,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Game;
  else root.Game = Game;
})(this);
