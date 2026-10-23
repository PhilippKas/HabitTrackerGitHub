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

  // ── Side quests: one real-life challenge per week ──
  // The quest of a week is derived from the week's Monday (no storage). The
  // pool is walked as a seeded shuffle per cycle, so every quest comes up
  // once per cycle and never twice in a row. state.quests only records what
  // the user did: { "<monday>": { id, rerolled?, done? } }.
  const QUEST_XP = 75;
  const QUEST_EPOCH = '2024-01-01'; // a Monday
  const QUESTS = [
    { id: 'analog',     name: 'Analog Mode',          desc: 'One evening with no screens after 9 pm.' },
    { id: 'recipe',     name: 'New Recipe Protocol',  desc: "Cook a dish you've never made before." },
    { id: 'reconnect',  name: 'Reconnect',            desc: "Call or meet someone you haven't talked to in months." },
    { id: 'uncharted',  name: 'Uncharted Sector',     desc: "Walk or ride somewhere you've never been." },
    { id: 'purge',      name: 'Data Purge',           desc: 'Delete 50 old photos or clear out one drawer.' },
    { id: 'sunrise',    name: 'Sunrise Run',          desc: 'Be outside within 30 minutes of sunrise, once.' },
    { id: 'gift',       name: 'Gift Protocol',        desc: 'Do something kind for someone without telling them.' },
    { id: 'offline',    name: 'Offline Read',         desc: 'Read 30 pages of a paper book in one sitting.' },
    { id: 'coldboot',   name: 'Cold Boot',            desc: 'End a shower with 30 seconds of cold water.' },
    { id: 'skillchip',  name: 'Skill Chip',           desc: 'Spend one hour learning something new.' },
    { id: 'ghost',      name: 'Ghost Mode',           desc: 'Take a 1-hour walk and leave your phone at home.' },
    { id: 'market',     name: 'Market Run',           desc: "Buy and try a fruit or vegetable you've never eaten." },
    { id: 'signal',     name: 'Signal Boost',         desc: 'Send someone a real thank-you message.' },
    { id: 'lowpower',   name: 'Low Power Mode',       desc: 'Go to bed one hour earlier than usual, one night.' },
    { id: 'hydro',      name: 'Coolant Flush',        desc: 'Drink 2 litres of water a day for 3 days.' },
    { id: 'streetart',  name: 'Street Scan',          desc: 'Photograph 5 interesting details in your neighbourhood.' },
    { id: 'sync',       name: 'Sync Session',         desc: 'Share a meal with someone, phones away.' },
    { id: 'breathe',    name: 'Netrunner Rest',       desc: '10 minutes of quiet breathing outdoors.' },
    { id: 'pushups',    name: 'Hardware Upgrade',     desc: 'Do 100 push-ups over the week, any split.' },
    { id: 'inbox',      name: 'Clean Slate',          desc: 'Reach inbox zero or unsubscribe from 10 newsletters.' },
    { id: 'nightwalk',  name: 'Night City Walk',      desc: 'Take an evening walk of at least 5 km.' },
    { id: 'mixtape',    name: 'Mixtape',              desc: "Listen to a full album you've never heard, start to finish." },
    { id: 'bugfix',     name: 'Bug Fix',              desc: "Finally do one small task you've been putting off." },
    { id: 'local',      name: 'Local Legend',         desc: "Visit a café, shop or museum nearby you've never been to." },
    { id: 'nosugar',    name: 'Sugar Firewall',       desc: 'One full day without added sugar.' },
    { id: 'mentor',     name: 'Mentor Mode',          desc: 'Teach someone something you know.' },
    { id: 'retro',      name: 'Retro Tech',           desc: 'Write a handwritten letter or postcard.' },
    { id: 'green',      name: 'Green Grid',           desc: 'Spend two hours in nature.' },
    { id: 'silent',     name: 'Silent Running',       desc: 'One full day without social media.' },
    { id: 'overclock',  name: 'Overclock',            desc: 'Try a sport or workout class you have never done.' },
    { id: 'archive',    name: 'Archive Entry',        desc: 'Write one page about your week in a journal.' },
    { id: 'plant',      name: 'Bio Module',           desc: 'Plant something or bring home a houseplant or herbs.' },
    { id: 'budget',     name: 'Budget Hack',          desc: 'Track every expense for three days.' },
    { id: 'stars',      name: 'Stargazer',            desc: 'Look at the night sky for 10 minutes.' },
    { id: 'volunteer',  name: 'Volunteer Run',        desc: 'Help out a neighbour or a good cause for an hour.' },
    { id: 'yes',        name: 'Comfort Zone Exit',    desc: "Say yes to something you'd normally turn down." },
  ];
  const QUEST_BY_ID = new Map(QUESTS.map(q => [q.id, q]));

  function fnv(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h;
  }

  // Monday of the week containing dateStr.
  function weekStart(dateStr) {
    return dateAdd(dateStr, -((new Date(dateStr + 'T00:00:00').getDay() + 6) % 7));
  }

  // Seeded shuffle of the pool for one cycle (mulberry32 + Fisher–Yates).
  function cyclePerm(c) {
    let a = fnv(`cycle|${c}`);
    const rnd = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const idx = QUESTS.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }

  // The quest a week starts with (before any reroll).
  function baseQuest(weekKey) {
    const w = Math.floor(daysBetween(QUEST_EPOCH, weekKey) / 7);
    const n = QUESTS.length;
    const c = Math.floor(w / n), pos = ((w % n) + n) % n;
    const perm = cyclePerm(c);
    // never the same quest twice in a row across a cycle boundary
    if (pos <= 1) {
      const prevLast = cyclePerm(c - 1)[n - 1];
      if (perm[0] === prevLast) [perm[0], perm[1]] = [perm[1], perm[0]];
    }
    return QUESTS[perm[pos]];
  }

  function questRecord(state, weekKey) {
    const all = state && state.quests;
    const r = all && typeof all === 'object' ? all[weekKey] : null;
    return r && typeof r === 'object' ? r : null;
  }

  function validDone(d, weekKey, todayStr) {
    return typeof d === 'string' && DATE_RE.test(d) && d >= weekKey && d <= dateAdd(weekKey, 6) && d <= todayStr;
  }

  // What the user sees for a week.
  function questFor(state, weekKey, todayStr) {
    const rec = questRecord(state, weekKey);
    const quest = (rec && QUEST_BY_ID.get(rec.id)) || baseQuest(weekKey);
    const rerolled = !!(rec && rec.rerolled === true);
    return {
      weekKey,
      quest,
      rerolled,
      done: rec && validDone(rec.done, weekKey, todayStr) ? rec.done : null,
      canReroll: !rerolled,
    };
  }

  // Replacement for a reroll: different from this week's quest and from the
  // quests shown the week before and after.
  function rerollQuest(state, weekKey) {
    const avoid = new Set([
      questFor(state, weekKey, weekKey).quest.id,
      questFor(state, dateAdd(weekKey, -7), weekKey).quest.id,
      baseQuest(dateAdd(weekKey, 7)).id,
    ]);
    let i = fnv(`${weekKey}|reroll`) % QUESTS.length;
    while (avoid.has(QUESTS[i].id)) i = (i + 1) % QUESTS.length;
    return QUESTS[i];
  }

  // Completed quests (valid only), newest first.
  function questLog(state, todayStr) {
    const all = state && state.quests && typeof state.quests === 'object' ? state.quests : {};
    return Object.keys(all)
      .filter(k => DATE_RE.test(k) && weekStart(k) === k)
      .map(k => questFor(state, k, todayStr))
      .filter(q => q.done)
      .sort((a, b) => (a.weekKey < b.weekKey ? 1 : -1));
  }

  // ── Streaks with breaks ──
  // A habit can allow `grace` (0–2) missed days per rolling 7 days. While a
  // streak is running, a missed day is "bridged" if fewer than `grace` breaks
  // were used in the 6 days before it; otherwise the streak ends. Today is
  // still open, so it never counts as a miss. The streak number counts done
  // days only. grace 0 = the classic strict streak.
  function graceOf(habit) {
    const g = habit && habit.grace;
    return g === 1 || g === 2 ? g : 0;
  }

  function streakInfo(habit, todayStr) {
    const grace = graceOf(habit);
    const done = new Set((habit && Array.isArray(habit.completed) ? habit.completed : [])
      .filter(d => typeof d === 'string' && DATE_RE.test(d) && d <= todayStr));
    const breaks = new Set();
    const runAt = new Map();   // done date → streak length after that day
    let run = 0, best = 0, log = [];

    let first = null;
    done.forEach(d => { if (!first || d < first) first = d; });
    if (first) {
      for (let d = first; d <= todayStr; d = dateAdd(d, 1)) {
        if (done.has(d)) {
          run++;
          best = Math.max(best, run);
          runAt.set(d, run);
          continue;
        }
        if (d === todayStr) break;               // today is still open
        if (run > 0 && log.filter(b => daysBetween(b, d) < 7).length < grace) {
          breaks.add(d);                          // bridged: streak survives
          log.push(d);
          continue;
        }
        run = 0;
        log = [];
      }
    }
    const recent = [...breaks].filter(b => daysBetween(b, todayStr) < 7).length;
    return {
      grace,
      current: run,
      best,
      breaks,
      runAt,
      breaksLeft: run > 0 ? Math.max(0, grace - recent) : grace,
    };
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
    const streaks = habits.map(h => streakInfo(h, todayStr));

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
          run[i] = streaks[i].runAt.get(d) || 1;   // honours allowed breaks
          last[i] = d;

          let gain = XP_BASE + streakBonus(run[i]);
          if (d20(h.id, d) === 20) { gain *= 2; critDays.add(`${h.id}|${d}`); unlock('nat20', d); }
          xp += gain;
          if (STATS.includes(h.stat)) statXp[h.stat] += gain;
          const ph = perHabit[h.id];
          ph.xp += gain; ph.count++;

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

    // Side quests: +QUEST_XP per completed quest
    const quests = questLog(state, todayStr);
    xp += quests.length * QUEST_XP;

    habits.forEach((h, i) => {
      const ph = perHabit[h.id];
      ph.best = streaks[i].best;
      ph.current = streaks[i].current;
      ph.grace = streaks[i].grace;
      ph.breaks = streaks[i].breaks;
      ph.breaksLeft = streaks[i].breaksLeft;
    });

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
      integrity: completionRate(state, todayStr, 7, streaks),
      rate30: completionRate(state, todayStr, 30, streaks),
      achievements: ACHIEVEMENTS.map(a => ({ ...a, unlockedOn: unlocked[a.id] || null })),
      perHabit,
      questsDone: quests.length,
      questLog: quests,
      critDays,
      perfectDays,
      dayStats,
      doneToday: !!dayStats.get(todayStr) && dayStats.get(todayStr).active > 0
        && dayStats.get(todayStr).done === dayStats.get(todayStr).active,
      anyToday: !!dayStats.get(todayStr) && dayStats.get(todayStr).done > 0,
    };
  }

  // Share of expected check-offs done over the last `days` days, not counting
  // today (today isn't over yet). A habit is expected from its createdAt on;
  // an allowed break is not expected, so it doesn't lower the rate.
  // No expected check-offs → 100.
  function completionRate(state, todayStr, days, streaks) {
    const habits = (state && Array.isArray(state.habits)) ? state.habits : [];
    const info = streaks || habits.map(h => streakInfo(h, todayStr));
    let expected = 0, done = 0;
    for (let k = 1; k <= days; k++) {
      const d = dateAdd(todayStr, -k);
      habits.forEach((h, i) => {
        if (info[i].breaks.has(d)) return;
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
    statScore, statMod, computeProgress, completionRate, streakInfo, graceOf,
    QUESTS, QUEST_XP, weekStart, questFor, rerollQuest, questLog, baseQuest,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Game;
  else root.Game = Game;
})(this);
