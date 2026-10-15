/* ─────────────────────────────────────
   Habit Tracker — evolving avatar (runner + pet companion)

   Pure SVG string builders. The look is DERIVED from the level (and today's
   condition); only the cosmetic choices in settings.avatar are stored.
   Almost every level unlocks one small upgrade — see EVOLUTION.

   Exposes one global, `Avatar` (or module.exports under Node). If this file
   fails to load, the app falls back to the class icon.
   ───────────────────────────────────── */
(function (root) {
  'use strict';

  // ── Evolution: one small upgrade per level ──
  const EVOLUTION = [
    { level: 1,  who: 'runner', part: 'base',       label: 'Street hoodie' },
    { level: 1,  who: 'pet',    part: 'egg',        label: 'Data Egg' },
    { level: 2,  who: 'runner', part: 'hair_messy', label: 'Hood down' },
    { level: 3,  who: 'pet',    part: 'glitchling', label: 'Hatched: Glitchling' },
    { level: 4,  who: 'runner', part: 'stud',       label: 'Ear stud' },
    { level: 5,  who: 'runner', part: 'hair_spiky', label: 'Spiky hair' },
    { level: 6,  who: 'runner', part: 'circuit',    label: 'Cheek circuit' },
    { level: 7,  who: 'pet',    part: 'kitten',     label: 'Grew into a Kitten' },
    { level: 8,  who: 'runner', part: 'cybereye',   label: 'Cyber-eye' },
    { level: 9,  who: 'runner', part: 'collar',     label: 'Collar up' },
    { level: 10, who: 'runner', part: 'plate_l',    label: 'Shoulder plate' },
    { level: 11, who: 'runner', part: 'trim',       label: 'Neon jacket trim' },
    { level: 12, who: 'pet',    part: 'cybercat',   label: 'Evolved: Cyber-cat' },
    { level: 13, who: 'pet',    part: 'stripes',    label: 'Neon stripes' },
    { level: 14, who: 'runner', part: 'plate_r',    label: 'Second shoulder plate' },
    { level: 15, who: 'runner', part: 'jaw',        label: 'Chrome jaw' },
    { level: 16, who: 'pet',    part: 'cyberear',   label: 'Cyber-ear' },
    { level: 17, who: 'runner', part: 'visor',      label: 'Neon visor' },
    { level: 18, who: 'pet',    part: 'thrusters',  label: 'Jet thrusters' },
    { level: 19, who: 'runner', part: 'streak',     label: 'Neon hair streak' },
    { level: 20, who: 'runner', part: 'crown',      label: 'Circuit crown' },
    { level: 21, who: 'runner', part: 'barcode',    label: 'Neck barcode' },
    { level: 22, who: 'pet',    part: 'halo',       label: 'Halo' },
    { level: 23, who: 'pet',    part: 'tag',        label: 'Collar tag' },
    { level: 24, who: 'runner', part: 'earpiece',   label: 'Earpiece' },
    { level: 25, who: 'runner', part: 'aura',       label: 'Neon aura' },
    { level: 26, who: 'pet',    part: 'wings',      label: 'Data wings' },
    { level: 27, who: 'runner', part: 'piercing',   label: 'Brow piercing' },
    { level: 28, who: 'runner', part: 'emblem',     label: 'Jacket emblem' },
    { level: 29, who: 'pet',    part: 'neoneyes',   label: 'Neon eyes' },
  ];
  // From level 30 the evolution never stops: one more prestige ring segment
  // every 2 levels; each full lap of the ring switches to a new colour.
  const PRESTIGE_START = 30;
  const PRESTIGE_EVERY = 2;
  const PRESTIGE_SEGMENTS = 24;
  const PRESTIGE_LAPS = ['#fcee0a', '#ff2a6d', '#39ff88', '#ffffff'];

  function prestige(level) {
    return level >= PRESTIGE_START ? Math.floor((level - PRESTIGE_START) / PRESTIGE_EVERY) + 1 : 0;
  }

  function unlocked(level) {
    return new Set(EVOLUTION.filter(e => e.level <= level).map(e => e.part));
  }

  // Upgrades that arrive exactly at `level` (for the level-up screen).
  function newAt(level) {
    const list = EVOLUTION.filter(e => e.level === level && level > 1);
    if (level >= PRESTIGE_START && (level - PRESTIGE_START) % PRESTIGE_EVERY === 0) {
      list.push({ level, who: 'runner', part: 'prestige', label: `Prestige ${prestige(level)}` });
    }
    return list;
  }

  // The next upgrade after `level`.
  function next(level) {
    const e = EVOLUTION.find(x => x.level > level);
    if (e) return e;
    const lv = level < PRESTIGE_START ? PRESTIGE_START
      : PRESTIGE_START + PRESTIGE_EVERY * (Math.floor((level - PRESTIGE_START) / PRESTIGE_EVERY) + 1);
    return { level: lv, who: 'runner', part: 'prestige', label: `Prestige ${prestige(lv)}` };
  }

  function petForm(parts) {
    return parts.has('cybercat') ? 'cybercat' : parts.has('kitten') ? 'kitten'
      : parts.has('glitchling') ? 'glitchling' : 'egg';
  }
  const PET_FORM_NAMES = { egg: 'Data Egg', glitchling: 'Glitchling', kitten: 'Kitten', cybercat: 'Cyber-cat' };

  // ── Customization ──
  const PALETTES = {
    skin: { s1: '#f3cfae', s2: '#e2ae86', s3: '#c68b5e', s4: '#8d5a3b', s5: '#5c3b2a' },
    hair: { black: '#352c4d', brown: '#6b4428', blond: '#e2c27a', red: '#c8402f', pink: '#ff2a6d', silver: '#dcdce6' },
    neon: { cyan: '#00e5f2', magenta: '#ff2a6d', yellow: '#fcee0a', green: '#39ff88', violet: '#a07bff' },
  };
  const DEFAULTS = { skin: 's2', hair: 'brown', neon: 'cyan', petName: 'Byte' };

  function normalize(a) {
    const o = a && typeof a === 'object' ? a : {};
    const pick = (k) => (typeof o[k] === 'string' && o[k] in PALETTES[k] ? o[k] : DEFAULTS[k]);
    const name = typeof o.petName === 'string' ? o.petName.trim().slice(0, 16) : '';
    return { skin: pick('skin'), hair: pick('hair'), neon: pick('neon'), petName: name || DEFAULTS.petName };
  }

  // ── Drawing helpers ──
  // Cel-shaded: every material has a flat base tone, a flat shadow tone and
  // (sometimes) a flat highlight. No gradients, no filters, no clipping.
  const INK = '#120b24';
  const JACKET = '#3a3159', JACKET_SH = '#2a2344', JACKET_HI = '#554b84', SEAM = '#211b36';
  const SHIRT = '#17112b';
  const CHROME = '#c4c8d7', CHROME_SH = '#7f849a', CHROME_HI = '#f1f2f8';
  const EYE_WHITE = '#f6f3fc', IRIS = '#3d2c55', LASH = '#1a1426';
  const RUNNER_MOODS = ['happy', 'neutral', 'tired', 'exhausted'];
  const PET_MOODS = ['happy', 'neutral', 'sleep', 'worried'];

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hex(c) { return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  // Darken a colour by a factor (0..1).
  function shade(h, f) { return hex(rgb(h).map(v => v * f)); }
  // Blend colour a toward b by t (0..1).
  function mix(a, b, t) { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); }
  // Four-point sparkle centred on (x, y).
  const sparkle = (x, y, r, fill) =>
    `<path d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z" fill="${fill}"/>`;

  // ── Runner (viewBox 0 0 120 120) ──
  // opts: { level, skin, hair, neon, mood: 'happy'|'neutral'|'tired'|'exhausted', bg }
  function runner(opts) {
    const o = Object.assign({ level: 1, mood: 'neutral', bg: true }, opts || {});
    const look = normalize(o);
    const level = Math.max(1, Math.floor(Number(o.level) || 1));
    const mood = RUNNER_MOODS.includes(o.mood) ? o.mood : 'neutral';
    const p = unlocked(level);
    const neon = PALETTES.neon[look.neon];
    const skin = PALETTES.skin[look.skin];
    const skinSh = shade(skin, 0.8), skinDeep = shade(skin, 0.62), skinHi = mix(skin, '#ffffff', 0.35);
    const lip = mix(shade(skin, 0.7), '#b4475a', 0.35);
    const hair = PALETTES.hair[look.hair];
    const hairSh = shade(hair, 0.68), hairHi = mix(hair, '#ffffff', 0.38);
    const brow = shade(hair, 0.62);
    const hood = !p.has('hair_messy');

    let back = '', body = '', head = '';

    // ── Backdrop: night skyline + prestige ring + aura ──
    if (o.bg) {
      back += `<path d="M14 0 H120 V106 L106 120 H0 V14 Z" fill="${INK}"/>`;
      back += `<path d="M0 72 H8 V58 H16 V66 H22 V50 H30 V120 H0Z M90 120 V54 H97 V44 H104 V60 H111 V48 H120 V120Z" fill="#1b1335"/>`;
      back += `<path d="M0 84 H12 V76 H20 V120 H0Z M100 120 V70 H108 V62 H116 V74 H120 V120Z" fill="#231a42"/>`;
      back += `<path d="M10 61h2v2h-2zM24 55h2v2h-2zM24 61h2v2h-2zM99 50h2v2h-2zM106 54h2v2h-2zM113 53h2v2h-2zM93 60h2v2h-2z" fill="${neon}" fill-opacity=".55"/>`;
      back += `<path d="M4 79h2v2h-2zM14 81h2v2h-2zM110 67h2v2h-2zM103 75h2v2h-2z" fill="#fcee0a" fill-opacity=".45"/>`;
      back += `<circle cx="60" cy="50" r="33" fill="#241b48"/>`;
    }
    const pr = prestige(level);
    if (pr > 0) {
      const lap = Math.floor((pr - 1) / PRESTIGE_SEGMENTS);          // 0 = first lap
      const lit = ((pr - 1) % PRESTIGE_SEGMENTS) + 1;
      const on = lap === 0 ? neon : PRESTIGE_LAPS[(lap - 1) % PRESTIGE_LAPS.length];
      const off = lap === 0 ? '#2a2342' : (lap === 1 ? neon : PRESTIGE_LAPS[(lap - 2) % PRESTIGE_LAPS.length]);
      const step = 360 / PRESTIGE_SEGMENTS;
      for (let i = 0; i < PRESTIGE_SEGMENTS; i++) {
        const a0 = (-90 + i * step + 2.5) * Math.PI / 180, a1 = (-90 + (i + 1) * step - 2.5) * Math.PI / 180;
        const r = 54;
        back += `<path d="M${(60 + r * Math.cos(a0)).toFixed(1)} ${(60 + r * Math.sin(a0)).toFixed(1)} A${r} ${r} 0 0 1 ${(60 + r * Math.cos(a1)).toFixed(1)} ${(60 + r * Math.sin(a1)).toFixed(1)}" fill="none" stroke="${i < lit ? on : off}" stroke-width="4"/>`;
      }
    }
    if (p.has('aura')) {
      back += `<circle cx="60" cy="56" r="45" fill="${neon}" fill-opacity=".13"/>`;
      back += `<circle cx="60" cy="56" r="45" fill="none" stroke="${neon}" stroke-width="1.4" stroke-dasharray="2 4"/>`;
      back += `<circle cx="60" cy="56" r="39" fill="none" stroke="${neon}" stroke-opacity=".35" stroke-width="1"/>`;
    }

    // ── Hood (level 1): back panel behind the head ──
    if (hood) {
      back += `<path d="M27 76 C23 45 37 19 60 19 C83 19 97 45 93 76 L87 95 L33 95 Z" fill="${JACKET_HI}"/>`;
      back += `<path d="M74 22 C88 30 96 50 93 76 L87 95 L76 95 C84 74 84 44 74 22 Z" fill="${JACKET}"/>`;
    }

    // ── Body: jacket, shirt, lapels, zipper, seams ──
    body += `<path d="M8 120 C10 102 24 93 43 89 L77 89 C96 93 110 102 112 120 Z" fill="${JACKET}"/>`;
    body += `<path d="M77 89 C96 93 110 102 112 120 H86 C88 108 86 97 77 89 Z" fill="${JACKET_SH}"/>`;
    body += `<path d="M27 99 C31 106 32 113 31 120 M93 99 C89 106 88 113 89 120" fill="none" stroke="${SEAM}" stroke-width="1.2"/>`;
    // Neck + jaw shadow
    body += `<path d="M51 68 L69 68 L70 90 C64 94 56 94 50 90 Z" fill="${skinSh}"/>`;
    body += `<path d="M51 70 C55 75 65 75 69 70 L69 76 C64 79 56 79 51 76 Z" fill="${skinDeep}" fill-opacity=".55"/>`;
    if (p.has('barcode')) body += `<path d="M53 80v6M54.8 80v6M56 80v6M58.4 80v6M60 80v6M62.6 80v6M64 80v6M65.6 80v6" stroke="${INK}" stroke-width="1" stroke-opacity=".75"/>`;
    // Shirt V and lapels
    body += `<path d="M47 89 L60 110 L73 89 Z" fill="${SHIRT}"/>`;
    body += `<path d="M43 89 L47 89 L60 110 L57 120 L49 120 L46 104 Z" fill="${JACKET_HI}"/>`;
    body += `<path d="M77 89 L73 89 L60 110 L63 120 L71 120 L74 104 Z" fill="${JACKET}"/>`;
    body += `<path d="M73 89 L60 110 L63 120" fill="none" stroke="${SEAM}" stroke-width="1"/>`;
    // Zipper
    body += `<path d="M60 110 V120" stroke="${p.has('trim') ? neon : '#8c86ad'}" stroke-width="1.4"/>`;
    body += `<path d="M58.6 113h2.8M58.6 116h2.8M58.6 119h2.8" stroke="${p.has('trim') ? neon : '#8c86ad'}" stroke-width=".8"/>`;
    if (p.has('trim')) body += `<path d="M47 89 L60 110 L73 89 M43 89 L46 104 L49 120 M77 89 L74 104 L71 120" fill="none" stroke="${neon}" stroke-width="1.6"/>`;
    if (p.has('emblem')) {
      body += `<path d="M90 103 l5 -5 l5 5 l-5 5 z" fill="${INK}" stroke="${neon}" stroke-width="1.6"/>`;
      body += `<path d="M95 100.5 v5 M92.5 103 h5" stroke="${neon}" stroke-width="1"/>`;
    }
    if (p.has('collar')) {
      body += `<path d="M40 91 L47 69 L55 92 Z" fill="${JACKET_HI}"/><path d="M47 69 L51 80 L55 92" fill="none" stroke="${SEAM}" stroke-width="1"/>`;
      body += `<path d="M80 91 L73 69 L65 92 Z" fill="${JACKET}"/><path d="M73 69 L69 80 L65 92" fill="none" stroke="${SEAM}" stroke-width="1"/>`;
    }
    const plate = (flip) => {
      const f = (x) => (flip ? 120 - x : x);
      const pts = (arr) => arr.map(([x, y]) => `${f(x)} ${y}`).join(' L');
      let s = `<path d="M${pts([[11, 110], [13, 99], [22, 92], [39, 88], [44, 99], [29, 103], [17, 112]])} Z" fill="${flip ? CHROME_SH : '#9a9fb3'}"/>`;
      s += `<path d="M${pts([[13, 99], [22, 92], [39, 88], [40.5, 91], [24, 95], [15, 102]])} Z" fill="${flip ? '#a2a7ba' : CHROME_HI}"/>`;
      s += `<path d="M${pts([[17, 106], [30, 100.5], [43, 97]])}" fill="none" stroke="${SEAM}" stroke-width="1"/>`;
      s += `<circle cx="${f(22)}" cy="101" r="1.1" fill="${SEAM}"/><circle cx="${f(34)}" cy="96" r="1.1" fill="${SEAM}"/>`;
      return s;
    };
    if (p.has('plate_l')) body += plate(false);
    if (p.has('plate_r')) body += plate(true);
    if (hood) {
      // drawstrings
      body += `<path d="M53 91 L51 105 M67 91 L69 105" stroke="#d9d4ef" stroke-width="1.3" stroke-linecap="round"/>`;
      body += `<rect x="49.8" y="104" width="2.4" height="4" rx=".8" fill="#9a94bd"/><rect x="67.8" y="104" width="2.4" height="4" rx=".8" fill="#9a94bd"/>`;
    }

    // ── Head ──
    // ears
    head += `<path d="M42 49 C37.5 46.5 35 51 36 55.5 C37 60 39.5 61.5 42.5 60 Z" fill="${skin}"/>`;
    head += `<path d="M40.5 52 C38.6 52.2 38.4 56 40.6 57.4" fill="none" stroke="${skinDeep}" stroke-width="1.1" stroke-linecap="round"/>`;
    head += `<path d="M78 49 C82.5 46.5 85 51 84 55.5 C83 60 80.5 61.5 77.5 60 Z" fill="${skinSh}"/>`;
    head += `<path d="M79.5 52 C81.4 52.2 81.6 56 79.4 57.4" fill="none" stroke="${skinDeep}" stroke-width="1.1" stroke-linecap="round"/>`;
    // face + cel shadow
    head += `<path d="M41 50 C41 37 49 30 60 30 C71 30 79 37 79 50 C79 58 77 64 73 69 C69 74 64 76.5 60 76.5 C56 76.5 51 74 47 69 C43 64 41 58 41 50 Z" fill="${skin}"/>`;
    head += `<path d="M67 32 C74.5 35.5 79 42 79 50 C79 58 77 64 73 69 C69 74 64 76.5 60 76.5 C64.5 72.5 68.5 66 69.5 58 C70.5 49 70.5 40 67 32 Z" fill="${skinSh}"/>`;
    head += `<path d="M41.4 52 C41.8 59 44 64.5 47.5 69" fill="none" stroke="${neon}" stroke-opacity=".35" stroke-width="1" stroke-linecap="round"/>`;
    // cheekbone highlight
    head += `<path d="M45 57 C46.5 54.5 49.5 54 51.5 55" fill="none" stroke="${skinHi}" stroke-width="1.2" stroke-linecap="round" stroke-opacity=".8"/>`;
    // nose
    head += `<path d="M60.8 53.5 C61.8 57 63.4 59.2 62.8 61 C61.8 62.2 59.6 62.2 58.4 61.4" fill="none" stroke="${skinDeep}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (p.has('stud')) head += `<circle cx="80.5" cy="60.5" r="1.7" fill="${neon}"/><circle cx="80" cy="60" r=".55" fill="#fff"/>`;
    if (p.has('earpiece')) {
      head += `<path d="M39.5 47 C35.5 47.5 34 52 35 58.5" fill="none" stroke="${CHROME}" stroke-width="2.2" stroke-linecap="round"/>`;
      head += `<path d="M35.6 58.5 Q38.5 65 47.5 65" fill="none" stroke="${CHROME_SH}" stroke-width="1.1" stroke-linecap="round"/>`;
      head += `<circle cx="48" cy="65" r="1.4" fill="${neon}"/>`;
    }
    if (p.has('circuit')) {
      head += `<path d="M44.5 58 L48 61.5 L48 66.5 M48 61.5 L51.5 61.5" fill="none" stroke="${neon}" stroke-width="1"/>`;
      head += `<circle cx="44.5" cy="58" r="1" fill="${neon}"/><circle cx="48" cy="66.8" r="1.1" fill="${neon}"/><circle cx="52" cy="61.5" r="1" fill="${neon}"/>`;
    }

    // eyes (drawn under the visor, which is semi-transparent)
    const eye = (cx, cyber) => {
      const cy = 52;
      let s = '';
      if (cyber) {
        s += `<path d="M${cx - 6} 47 L${cx + 5} 46.5 L${cx + 7} 51.5 L${cx + 5} 57 L${cx - 6} 57 L${cx - 7.2} 52 Z" fill="${CHROME}"/>`;
        s += `<path d="M${cx + 5} 46.5 L${cx + 7} 51.5 L${cx + 5} 57 L${cx + 1} 57 Z" fill="${CHROME_SH}"/>`;
        s += `<path d="M${cx - 5.5} 47.6 L${cx + 4.4} 47.2" stroke="${CHROME_HI}" stroke-width="1"/>`;
        s += `<circle cx="${cx}" cy="${cy}" r="3.6" fill="#251d3c"/>`;
        if (mood === 'happy') s += `<circle cx="${cx}" cy="${cy}" r="5.2" fill="${neon}" fill-opacity=".28"/>`;
        s += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="${neon}" fill-opacity="${mood === 'exhausted' ? 0.5 : 1}"/>`;
        s += `<circle cx="${cx}" cy="${cy}" r="1" fill="${INK}"/><circle cx="${cx - 0.9}" cy="${cy - 1}" r=".55" fill="#fff"/>`;
        s += `<circle cx="${cx - 4.6}" cy="55.4" r=".6" fill="${CHROME_SH}"/><circle cx="${cx + 3.6}" cy="48.4" r=".6" fill="${CHROME_SH}"/>`;
        return s;
      }
      const irisCol = mood === 'happy' ? neon : IRIS;
      s += `<path d="M${cx - 4.6} ${cy} Q${cx} ${cy - 4} ${cx + 4.6} ${cy} Q${cx} ${cy + 2.8} ${cx - 4.6} ${cy} Z" fill="${EYE_WHITE}"/>`;
      s += `<circle cx="${cx + 0.3}" cy="${cy - 0.3}" r="2.2" fill="${irisCol}"/>`;
      s += `<circle cx="${cx + 0.3}" cy="${cy - 0.3}" r="1" fill="${LASH}"/><circle cx="${cx - 0.5}" cy="${cy - 1.1}" r=".6" fill="#fff"/>`;
      // eyelids for tired / exhausted (skin-coloured, covering the top of the eye)
      if (mood === 'tired' || mood === 'exhausted') {
        const lidY = mood === 'tired' ? cy - 1.1 : cy + 0.3;
        s += `<path d="M${cx - 4.9} ${cy} Q${cx} ${cy - 4.4} ${cx + 4.9} ${cy} L${cx + 4.7} ${cy + 0.2} Q${cx} ${lidY} ${cx - 4.7} ${cy + 0.2} Z" fill="${skin}"/>`;
        s += `<path d="M${cx - 4.7} ${cy + 0.2} Q${cx} ${lidY} ${cx + 4.7} ${cy + 0.2}" fill="none" stroke="${LASH}" stroke-width="1.3" stroke-linecap="round"/>`;
      } else {
        s += `<path d="M${cx - 4.9} ${cy + 0.2} Q${cx} ${cy - 4.4} ${cx + 4.9} ${cy}" fill="none" stroke="${LASH}" stroke-width="1.4" stroke-linecap="round"/>`;
      }
      if (mood === 'happy') s += `<path d="M${cx - 3} ${cy + 2.6} Q${cx} ${cy + 3.6} ${cx + 3} ${cy + 2.6}" fill="none" stroke="${skinDeep}" stroke-width=".9" stroke-linecap="round"/>`;
      return s;
    };
    head += eye(52.5, false);
    head += eye(67.5, p.has('cybereye'));
    // under-eye shadows
    if (mood === 'tired' || mood === 'exhausted') {
      const bag = mood === 'tired' ? shade(skin, 0.78) : shade(skin, 0.64);
      head += `<path d="M48.6 55.3 Q52.5 57.2 56.4 55.3" fill="none" stroke="${bag}" stroke-width="1.2" stroke-linecap="round"/>`;
      if (!p.has('cybereye')) head += `<path d="M63.6 55.3 Q67.5 57.2 71.4 55.3" fill="none" stroke="${bag}" stroke-width="1.2" stroke-linecap="round"/>`;
    }
    // brows: worried tilt when exhausted, lowered when tired
    {
      const bl = mood === 'exhausted' ? 'M47 47.6 Q52 46 57 44.2 L57.2 45.6 Q52 47.2 47.3 48.8 Z'
        : mood === 'tired' ? 'M47 47 Q52 45.4 57 46 L56.9 47.2 Q52 46.6 47.3 48.2 Z'
        : 'M47 46.6 Q52 43.6 57 45.2 L56.8 46.5 Q52 45.2 47.3 47.8 Z';
      const br = mood === 'exhausted' ? 'M73 47.6 Q68 46 63 44.2 L62.8 45.6 Q68 47.2 72.7 48.8 Z'
        : mood === 'tired' ? 'M73 47 Q68 45.4 63 46 L63.1 47.2 Q68 46.6 72.7 48.2 Z'
        : 'M73 46.6 Q68 43.6 63 45.2 L63.2 46.5 Q68 45.2 72.7 47.8 Z';
      head += `<path d="${bl}" fill="${brow}"/><path d="${br}" fill="${brow}"/>`;
    }
    if (p.has('piercing')) head += `<circle cx="70.8" cy="44.6" r="1.1" fill="${CHROME_HI}"/><circle cx="72.6" cy="45.5" r="1.1" fill="${neon}"/>`;

    // mouth (hidden behind the jaw guard)
    if (!p.has('jaw')) {
      if (mood === 'happy') {
        head += `<path d="M54.5 65.5 Q60 72 65.5 65.5 Q60 67.6 54.5 65.5 Z" fill="#5b2235"/>`;
        head += `<path d="M55.6 66 Q60 67.4 64.4 66 L64 67 Q60 68 56 67 Z" fill="#fff"/>`;
        head += `<ellipse cx="47.5" cy="61" rx="2.6" ry="1.4" fill="#ff7a9a" fill-opacity=".35"/><ellipse cx="72" cy="61" rx="2.4" ry="1.3" fill="#ff7a9a" fill-opacity=".3"/>`;
      } else if (mood === 'tired') {
        head += `<path d="M56 67 Q60 67.4 64 67" fill="none" stroke="${lip}" stroke-width="1.5" stroke-linecap="round"/>`;
      } else if (mood === 'exhausted') {
        head += `<path d="M55.5 68.4 Q60 65.6 64.5 68.4" fill="none" stroke="${lip}" stroke-width="1.5" stroke-linecap="round"/>`;
      } else {
        head += `<path d="M55.5 66.2 Q60 68.4 64.5 66.2" fill="none" stroke="${lip}" stroke-width="1.5" stroke-linecap="round"/>`;
        head += `<path d="M58 69 Q60 69.8 62 69" fill="none" stroke="${skinHi}" stroke-width="1" stroke-linecap="round"/>`;
      }
    } else {
      head += `<path d="M46 62 C47 70 52 75 60 76.6 C68 75 73 70 74 62 L70 66.5 L60 68.6 L50 66.5 Z" fill="${CHROME}"/>`;
      head += `<path d="M74 62 C73 70 68 75 60 76.6 C65 73 68 70 69.6 66.6 L70 66.5 Z" fill="${CHROME_SH}"/>`;
      head += `<path d="M50 66.5 L60 68.6 L70 66.5" fill="none" stroke="${CHROME_HI}" stroke-width="1"/>`;
      head += `<path d="M55 71.2h10M56 73.4h8" stroke="#2a2440" stroke-width="1.1" stroke-linecap="round"/>`;
    }

    // visor (over the eyes)
    if (p.has('visor')) {
      head += `<path d="M41.5 47 L78.5 47 L77 56.8 L43 56.8 Z" fill="${neon}" fill-opacity="${mood === 'happy' ? 0.92 : 0.82}"/>`;
      head += `<path d="M41.5 47 L78.5 47 L77 56.8 L43 56.8 Z" fill="none" stroke="${CHROME_SH}" stroke-width="1.2"/>`;
      head += `<path d="M45.5 49 L59 49 L57.5 51 L44.8 51 Z" fill="#fff" fill-opacity=".5"/>`;
      head += `<path d="M38 50 L41.5 48 M82 50 L78.5 48" stroke="${CHROME}" stroke-width="2" stroke-linecap="round"/>`;
    }

    // ── Hair / hood rim ──
    if (hood) {
      head += `<path d="M45 41 Q52 34.5 60 36.5 Q68 34.5 75 41 Q68 38.6 60 40.4 Q52 38.6 45 41 Z" fill="${hair}"/>`;
      head += `<path d="M35.5 72 C32 45 43 29.5 60 29.5 C77 29.5 88 45 84.5 72 C83 50 74 36.5 60 36.5 C46 36.5 37 50 35.5 72 Z" fill="${shade(JACKET_HI, 0.84)}"/>`;
      head += `<path d="M73 31.5 C81.5 37 87 50 84.5 72 C83 54 79 42 73 31.5 Z" fill="${JACKET_SH}"/>`;
      head += `<path d="M42 44 C46 37 52 34 60 33.6" fill="none" stroke="${JACKET_HI}" stroke-width="1.2" stroke-linecap="round"/>`;
      back += `<path d="M27.6 74 C23.6 45 37 19.6 60 19.6" fill="none" stroke="${neon}" stroke-opacity=".6" stroke-width="1.3" stroke-linecap="round"/>`;
    } else if (p.has('hair_spiky')) {
      head += `<path d="M39 53 L36 36 L44 39 L42 24 L51 32 L55 16 L61 29 L69 18 L70 31 L80 25 L79 37 L85 40 L80.5 46 L81 53 C78 45 73 40.5 67 39.5 C61 41.5 53 39.5 48 42.5 C44 45.5 41 49 39 53 Z" fill="${hair}"/>`;
      head += `<path d="M61 29 L69 18 L70 31 L80 25 L79 37 L85 40 L80.5 46 L81 53 C78 45 73 40.5 67 39.5 C69 35 66 32 61 29 Z" fill="${hairSh}"/>`;
      head += `<path d="M43.5 37.5 L43 28.5 M51.5 31 L54.8 19.5 M38.5 41 L37.2 36.8" fill="none" stroke="${hairHi}" stroke-width="1.2" stroke-linecap="round"/>`;
      head += `<path d="M39 52.5 L36 36 L44 39 L42 24 L51 32 L55 16" fill="none" stroke="${neon}" stroke-opacity=".6" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/>`;
      head += `<path d="M48 42.5 L46.5 47 L51 43 M57 40.5 L56.5 45 L60 41" fill="${hair}"/>`;
      if (p.has('streak')) {
        head += `<path d="M55 16 L61 29 L58.5 40 L52.5 40.5 L51 32 Z" fill="${neon}"/>`;
        head += `<path d="M55 16 L61 29 L58.5 40" fill="none" stroke="${shade(neon, 0.7)}" stroke-width="1"/>`;
      }
    } else {
      head += `<path d="M40 53 C37 38 44 27 57 25 C68 23 80 28 82 42 C83 47 81.5 51 79.5 53.5 C78.5 46 75 41.5 70 39.5 C66 42.5 60 41.5 56 38.5 C52 42.5 46 44 42.5 47.5 C41.3 49.5 40.6 51.3 40 53 Z" fill="${hair}"/>`;
      head += `<path d="M70 39.5 C75 41.5 78.5 46 79.5 53.5 C81.5 51 83 47 82 42 C80.5 33 75 27 68 25 C72.5 30 73 35.5 70 39.5 Z" fill="${hairSh}"/>`;
      head += `<path d="M56 38.5 L53 46 L58.5 40.8 Z M63.5 40.5 L65.5 46.5 L67.5 41 Z" fill="${hair}"/>`;
      head += `<path d="M46 34 Q52 29 58.5 28 M47.5 38.5 Q51 35.5 54.5 34.6 M62 27.2 Q67 27.2 71 29.4" fill="none" stroke="${hairHi}" stroke-width="1.2" stroke-linecap="round"/>`;
      head += `<path d="M40 52.5 C37 38 44 27 57 25" fill="none" stroke="${neon}" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"/>`;
    }

    // crown
    if (p.has('crown')) {
      head += `<path d="M34 24 Q60 2 86 24" fill="none" stroke="${neon}" stroke-width="2.2"/>`;
      head += `<path d="M34 24 Q60 6.5 86 24" fill="none" stroke="${neon}" stroke-opacity=".4" stroke-width="1"/>`;
      head += `<path d="M47 15.5 V9 H44 M60 11.5 V4.5 M73 15.5 V9 H76" fill="none" stroke="${neon}" stroke-width="1.4"/>`;
      head += `<circle cx="43.5" cy="9" r="1.6" fill="${neon}"/><circle cx="76.5" cy="9" r="1.6" fill="${neon}"/>`;
      head += `<path d="M60 0.5 L63 4.5 L60 8.5 L57 4.5 Z" fill="#fcee0a"/><path d="M60 0.5 L63 4.5 L60 4.5 Z" fill="#fff" fill-opacity=".6"/>`;
    }

    // mood extras
    if (mood === 'happy') head += sparkle(95, 30, 4.5, neon) + sparkle(25, 38, 3, neon) + sparkle(89, 18, 2.2, '#fff');
    if (mood === 'exhausted') head += `<path d="M80 35 C78.5 38 78 39.5 78 40.5 A2 2 0 0 0 82 40.5 C82 39.5 81.5 38 80 35 Z" fill="#a8e8ff"/><path d="M79.4 39.6 A.9 .9 0 0 0 80.2 41" fill="none" stroke="#fff" stroke-width=".6"/>`;

    const headG = mood === 'exhausted' ? `<g transform="translate(0 2)">${head}</g>` : head;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Runner, level ${level}" data-mood="${mood}">${back}${body}${headG}</svg>`;
  }

  // ── Pet (viewBox 0 0 60 60) ──
  // opts: { level, neon, mood: 'happy'|'neutral'|'sleep'|'worried', bg }
  function pet(opts) {
    const o = Object.assign({ level: 1, mood: 'neutral', bg: true }, opts || {});
    const look = normalize(o);
    const level = Math.max(1, Math.floor(Number(o.level) || 1));
    const mood = PET_MOODS.includes(o.mood) ? o.mood : 'neutral';
    const p = unlocked(level);
    const form = petForm(p);
    const neon = PALETTES.neon[look.neon];
    const FUR = '#f1edfb', FUR_SH = '#cbc2e8', FUR_DEEP = '#a99fd0', PINK = '#ff9cc2', DARK = '#1b1626';
    const eyeCol = p.has('neoneyes') ? neon : DARK;
    const zz = `<path d="M44 12h4l-4 4h4" fill="none" stroke="${neon}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 5h3l-3 3h3" fill="none" stroke="${neon}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`;

    // Eyes / brows / mouth for the cat-like forms, centred on head (cx, cy).
    const face = (cx, cy, s) => {
      const lx = cx - 4.2 * s, rx = cx + 4.2 * s, ey = cy + 0.5 * s;
      let f = '';
      if (mood === 'sleep') {
        f += `<path d="M${lx - 2 * s} ${ey} Q${lx} ${ey + 1.8 * s} ${lx + 2 * s} ${ey} M${rx - 2 * s} ${ey} Q${rx} ${ey + 1.8 * s} ${rx + 2 * s} ${ey}" fill="none" stroke="${DARK}" stroke-width="${1.2 * s}" stroke-linecap="round"/>`;
      } else if (mood === 'happy') {
        f += `<path d="M${lx - 2 * s} ${ey + 0.8 * s} Q${lx} ${ey - 2 * s} ${lx + 2 * s} ${ey + 0.8 * s} M${rx - 2 * s} ${ey + 0.8 * s} Q${rx} ${ey - 2 * s} ${rx + 2 * s} ${ey + 0.8 * s}" fill="none" stroke="${DARK}" stroke-width="${1.3 * s}" stroke-linecap="round"/>`;
        f += `<ellipse cx="${lx - 1.2 * s}" cy="${ey + 3 * s}" rx="${1.8 * s}" ry="${1 * s}" fill="${PINK}" fill-opacity=".6"/><ellipse cx="${rx + 1.2 * s}" cy="${ey + 3 * s}" rx="${1.8 * s}" ry="${1 * s}" fill="${PINK}" fill-opacity=".6"/>`;
      } else {
        const r = mood === 'worried' ? 1.6 * s : 2 * s;
        for (const x of [lx, rx]) {
          f += `<ellipse cx="${x}" cy="${ey}" rx="${r}" ry="${r * 1.2}" fill="${eyeCol}"/>`;
          if (p.has('neoneyes')) f += `<ellipse cx="${x}" cy="${ey}" rx="${0.45 * s}" ry="${r}" fill="${DARK}"/>`;
          f += `<circle cx="${x - 0.6 * s}" cy="${ey - 0.8 * s}" r="${0.6 * s}" fill="#fff"/>`;
        }
        if (mood === 'worried') {
          f += `<path d="M${lx - 2.2 * s} ${ey - 3.4 * s} L${lx + 1.6 * s} ${ey - 4.6 * s} M${rx + 2.2 * s} ${ey - 3.4 * s} L${rx - 1.6 * s} ${ey - 4.6 * s}" stroke="${FUR_DEEP}" stroke-width="${1 * s}" stroke-linecap="round"/>`;
          f += `<path d="M${cx + 9 * s} ${cy - 6 * s} C${cx + 8 * s} ${cy - 4 * s} ${cx + 7.6 * s} ${cy - 3 * s} ${cx + 7.6 * s} ${cy - 2.3 * s} A${1.4 * s} ${1.4 * s} 0 0 0 ${cx + 10.4 * s} ${cy - 2.3 * s} C${cx + 10.4 * s} ${cy - 3 * s} ${cx + 10 * s} ${cy - 4 * s} ${cx + 9 * s} ${cy - 6 * s} Z" fill="#a8e8ff"/>`;
        }
      }
      // nose + mouth + whiskers
      f += `<path d="M${cx - 1.1 * s} ${cy + 3 * s} L${cx + 1.1 * s} ${cy + 3 * s} L${cx} ${cy + 4.1 * s} Z" fill="${PINK}"/>`;
      f += mood === 'worried'
        ? `<ellipse cx="${cx}" cy="${cy + 6 * s}" rx="${0.9 * s}" ry="${1.1 * s}" fill="${DARK}"/>`
        : `<path d="M${cx - 2 * s} ${cy + 4.6 * s} Q${cx - 1 * s} ${cy + 5.8 * s} ${cx} ${cy + 4.2 * s} Q${cx + 1 * s} ${cy + 5.8 * s} ${cx + 2 * s} ${cy + 4.6 * s}" fill="none" stroke="${DARK}" stroke-width="${0.8 * s}" stroke-linecap="round"/>`;
      f += `<path d="M${cx - 5 * s} ${cy + 3.4 * s} L${cx - 10 * s} ${cy + 2.4 * s} M${cx - 5 * s} ${cy + 4.6 * s} L${cx - 10 * s} ${cy + 5.2 * s} M${cx + 5 * s} ${cy + 3.4 * s} L${cx + 10 * s} ${cy + 2.4 * s} M${cx + 5 * s} ${cy + 4.6 * s} L${cx + 10 * s} ${cy + 5.2 * s}" stroke="${FUR_DEEP}" stroke-width="${0.55 * s}" stroke-linecap="round"/>`;
      return f;
    };

    let a = '';
    if (form === 'egg') {
      a += `<ellipse cx="30" cy="51.5" rx="11" ry="2.4" fill="#000" fill-opacity=".3"/>`;
      a += `<path d="M30 15 C39 15 44.5 27 44.5 36 C44.5 45 38.5 51 30 51 C21.5 51 15.5 45 15.5 36 C15.5 27 21 15 30 15 Z" fill="${FUR}"/>`;
      a += `<path d="M36 17.5 C41.5 21.5 44.5 29 44.5 36 C44.5 45 38.5 51 30 51 C36 47.5 39.5 41 39.5 34 C39.5 27 38.5 21.5 36 17.5 Z" fill="${FUR_SH}"/>`;
      a += `<path d="M17 33 L22 29.5 L25.5 34 L30 28.5 L34.5 34 L38.5 29.5 L43 32.5" fill="none" stroke="${neon}" stroke-width="1.6" stroke-linejoin="round"/>`;
      a += `<circle cx="23" cy="41" r="1.3" fill="${FUR_DEEP}"/><circle cx="34" cy="44" r="1" fill="${FUR_DEEP}"/><circle cx="27" cy="23" r="1" fill="${neon}" fill-opacity=".6"/><circle cx="37" cy="39" r="1.2" fill="${neon}" fill-opacity=".5"/>`;
      a += `<ellipse cx="23.5" cy="23.5" rx="2.6" ry="4" fill="#fff" fill-opacity=".85" transform="rotate(25 23.5 23.5)"/>`;
      if (mood === 'sleep') a += zz;
    } else {
      const lift = p.has('thrusters') ? -4 : 0;
      a += `<ellipse cx="30" cy="53.5" rx="${form === 'glitchling' ? 12 : 11}" ry="2.2" fill="#000" fill-opacity=".3"/>`;
      a += `<g transform="translate(0 ${lift})">`;
      if (p.has('wings')) {
        a += `<path d="M18 33 L4 23 L6.5 31 L2 34 L7 38 L4 44 L16 42 Z" fill="${neon}" fill-opacity=".3" stroke="${neon}" stroke-width="1"/>`;
        a += `<path d="M42 33 L56 23 L53.5 31 L58 34 L53 38 L56 44 L44 42 Z" fill="${neon}" fill-opacity=".3" stroke="${neon}" stroke-width="1"/>`;
        a += `<path d="M15 34 L8 29 M15 38 L7 37 M45 34 L52 29 M45 38 L53 37" stroke="${neon}" stroke-width=".8"/>`;
      }
      if (p.has('thrusters')) {
        a += `<path d="M22.5 54 L24.5 63 L26.5 54 Z M33.5 54 L35.5 63 L37.5 54 Z" fill="${neon}"/>`;
        a += `<path d="M23.6 54 L24.5 59 L25.4 54 Z M34.6 54 L35.5 59 L36.4 54 Z" fill="#fff"/>`;
        a += `<rect x="21.5" y="51" width="6" height="3.4" rx="1" fill="${CHROME_SH}"/><rect x="32.5" y="51" width="6" height="3.4" rx="1" fill="${CHROME_SH}"/>`;
      }
      if (form === 'glitchling') {
        a += `<path d="M21 25 L18 14.5 L27 21 Z M39 25 L42 14.5 L33 21 Z" fill="${FUR}"/>`;
        a += `<path d="M21.5 22 L19.8 17 L24.5 20.5 Z M38.5 22 L40.2 17 L35.5 20.5 Z" fill="${PINK}"/>`;
        a += `<path d="M15 44 C11.5 30 20 20 30 20 C40 20 48.5 30 45 44 C41.5 51 18.5 51 15 44 Z" fill="${FUR}"/>`;
        a += `<path d="M38 22.5 C44 26.5 48 34 45 44 C43.5 47.5 39 49.5 33 50 C38.5 46 41.5 38 38 22.5 Z" fill="${FUR_SH}"/>`;
        a += face(30, 33, 1.15);
        a += `<rect x="47" y="19" width="2.4" height="2.4" fill="${neon}"/><rect x="11" y="27" width="1.8" height="1.8" fill="${neon}" fill-opacity=".7"/><rect x="49" y="25" width="1.4" height="1.4" fill="${neon}" fill-opacity=".6"/>`;
      } else {
        const big = form === 'cybercat';
        const hx = 30, hy = big ? 24 : 27, hr = big ? 11 : 10.5;
        // tail
        a += big
          ? `<path d="M40 48 C52 47 53 33 46 29" fill="none" stroke="${FUR_SH}" stroke-width="4" stroke-linecap="round"/><path d="M46.8 31.6 C46.4 30.4 45.8 29.6 45 29" fill="none" stroke="${p.has('stripes') ? neon : FUR}" stroke-width="4" stroke-linecap="round"/>`
          : `<path d="M38 49 C47 49 48.5 41 44.5 38.5" fill="none" stroke="${FUR_SH}" stroke-width="3.4" stroke-linecap="round"/>`;
        // body + shadow + chest fluff + paws
        a += big
          ? `<path d="M19 53 C17 41 22 33.5 30 33.5 C38 33.5 43 41 41 53 Z" fill="${FUR}"/><path d="M33 34 C38.5 35.5 43 41.5 41 53 H35 C37.5 46 37 39 33 34 Z" fill="${FUR_SH}"/>`
          : `<ellipse cx="30" cy="46" rx="10.5" ry="7.5" fill="${FUR}"/><path d="M33 39 C38 40 41 43 40.5 47 C39.5 51 36 53.2 31 53.4 C35.5 50 36 44 33 39 Z" fill="${FUR_SH}"/>`;
        a += `<path d="M26 ${big ? 37 : 40} L27.6 ${big ? 40.5 : 43} L29.2 ${big ? 37.5 : 40.5} L30.8 ${big ? 40.5 : 43} L32.4 ${big ? 37 : 40}" fill="none" stroke="${FUR_SH}" stroke-width=".9" stroke-linejoin="round"/>`;
        a += `<ellipse cx="25" cy="53" rx="3.4" ry="2.2" fill="${FUR}"/><ellipse cx="35" cy="53" rx="3.4" ry="2.2" fill="${FUR}"/>`;
        a += `<path d="M24 52.4 v1.6 M26 52.4 v1.6 M34 52.4 v1.6 M36 52.4 v1.6" stroke="${FUR_DEEP}" stroke-width=".6"/>`;
        if (p.has('stripes')) a += `<path d="M23 44 Q24.5 46 23.6 48.6 M37 44 Q35.5 46 36.4 48.6" fill="none" stroke="${neon}" stroke-width="1.5" stroke-linecap="round"/>`;
        // collar + tag
        if (p.has('tag')) {
          a += `<path d="M21.5 ${hy + hr - 2} Q30 ${hy + hr + 2.6} 38.5 ${hy + hr - 2}" fill="none" stroke="${neon}" stroke-width="2"/>`;
          a += `<path d="M30 ${hy + hr + 1} l2.4 1.4 v2.8 L30 ${hy + hr + 6.6} l-2.4 -1.4 v-2.8 Z" fill="#fcee0a"/><circle cx="30" cy="${hy + hr + 3.8}" r=".7" fill="${DARK}"/>`;
        }
        // ears
        const ex = big ? 9.5 : 8.5, eh = big ? 14 : 12;
        a += `<path d="M${hx - hr + 1.5} ${hy - 2} L${hx - ex} ${hy - eh} L${hx - 1.5} ${hy - hr + 0.5} Z" fill="${FUR}"/>`;
        a += `<path d="M${hx - hr + 3.5} ${hy - 3.5} L${hx - ex + 0.8} ${hy - eh + 4} L${hx - 3.5} ${hy - hr + 1.5} Z" fill="${PINK}"/>`;
        if (p.has('cyberear')) {
          a += `<path d="M${hx + hr - 1.5} ${hy - 2} L${hx + ex} ${hy - eh} L${hx + 1.5} ${hy - hr + 0.5} Z" fill="${CHROME}"/>`;
          a += `<path d="M${hx + hr - 3.5} ${hy - 3.5} L${hx + ex - 0.8} ${hy - eh + 4} L${hx + 3.5} ${hy - hr + 1.5} Z" fill="#2a2440"/>`;
          a += `<circle cx="${hx + ex - 1.6}" cy="${hy - eh + 6}" r="1.2" fill="${neon}"/><path d="M${hx + ex} ${hy - eh} l1.5 -3" stroke="${CHROME_SH}" stroke-width=".9" stroke-linecap="round"/>`;
        } else {
          a += `<path d="M${hx + hr - 1.5} ${hy - 2} L${hx + ex} ${hy - eh} L${hx + 1.5} ${hy - hr + 0.5} Z" fill="${FUR_SH}"/>`;
          a += `<path d="M${hx + hr - 3.5} ${hy - 3.5} L${hx + ex - 0.8} ${hy - eh + 4} L${hx + 3.5} ${hy - hr + 1.5} Z" fill="${PINK}" fill-opacity=".75"/>`;
        }
        // head + shadow + cheek fluff
        a += `<path d="M${hx - hr} ${hy} C${hx - hr} ${hy - 7} ${hx - 6} ${hy - hr} ${hx} ${hy - hr} C${hx + 6} ${hy - hr} ${hx + hr} ${hy - 7} ${hx + hr} ${hy} C${hx + hr} ${hy + 6.5} ${hx + 6} ${hy + hr - 1} ${hx} ${hy + hr - 1} C${hx - 6} ${hy + hr - 1} ${hx - hr} ${hy + 6.5} ${hx - hr} ${hy} Z" fill="${FUR}"/>`;
        a += `<path d="M${hx + 5} ${hy - hr + 1} C${hx + 9} ${hy - 7} ${hx + hr} ${hy - 3} ${hx + hr} ${hy} C${hx + hr} ${hy + 6.5} ${hx + 6} ${hy + hr - 1} ${hx} ${hy + hr - 1} C${hx + 5} ${hy + 7} ${hx + 7.5} ${hy + 1} ${hx + 5} ${hy - hr + 1} Z" fill="${FUR_SH}"/>`;
        a += `<path d="M${hx - hr + 0.3} ${hy + 2} L${hx - hr - 2.4} ${hy + 4} L${hx - hr + 1} ${hy + 5} L${hx - hr - 1.6} ${hy + 7} L${hx - hr + 2.6} ${hy + 7}" fill="${FUR}"/>`;
        a += `<path d="M${hx + hr - 0.3} ${hy + 2} L${hx + hr + 2.4} ${hy + 4} L${hx + hr - 1} ${hy + 5} L${hx + hr + 1.6} ${hy + 7} L${hx + hr - 2.6} ${hy + 7}" fill="${FUR_SH}"/>`;
        if (p.has('stripes')) a += `<path d="M27 ${hy - hr + 1.5} L27.8 ${hy - hr + 5} M30 ${hy - hr + 0.8} V${hy - hr + 5.4} M33 ${hy - hr + 1.5} L32.2 ${hy - hr + 5}" stroke="${neon}" stroke-width="1.4" stroke-linecap="round"/>`;
        a += face(hx, hy, big ? 1 : 0.95);
      }
      if (p.has('halo')) {
        const y = form === 'cybercat' ? 6.5 : 9;
        a += `<ellipse cx="30" cy="${y}" rx="9" ry="2.6" fill="none" stroke="#fcee0a" stroke-width="1.8"/>`;
        a += `<path d="M23 ${y - 1.2} Q26 ${y - 2.4} 30 ${y - 2.5}" fill="none" stroke="#fff" stroke-width=".8" stroke-linecap="round"/>`;
      }
      a += `</g>`;
      if (mood === 'sleep') a += zz;
      if (mood === 'happy') a += sparkle(48, 16, 2.6, neon) + sparkle(12, 20, 1.8, neon);
    }

    const bg = o.bg ? `<circle cx="30" cy="30" r="30" fill="${INK}"/><circle cx="30" cy="30" r="28.5" fill="none" stroke="${neon}" stroke-width="1.5"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" role="img" aria-label="${PET_FORM_NAMES[form]}" data-mood="${mood}">${bg}${a}</svg>`;
  }

  // Today's condition → runner mood + pet mood.
  // Finishing everything today always shows the happy face; otherwise the
  // runner reflects the last 7 days (HP) and the pet sleeps until the first
  // check-off of the day.
  function condition(c) {
    const { doneToday, anyToday } = c || {};
    const hp = Number.isFinite(c && c.integrity) ? c.integrity : 100;
    return {
      mood: doneToday ? 'happy' : hp < 30 ? 'exhausted' : hp < 60 ? 'tired' : 'neutral',
      petMood: doneToday ? 'happy' : hp < 30 ? 'worried' : anyToday ? 'neutral' : 'sleep',
    };
  }

  const Avatar = {
    EVOLUTION, PALETTES, DEFAULTS, PET_FORM_NAMES,
    unlocked, newAt, next, prestige, petForm: level => petForm(unlocked(level)),
    normalize, runner, pet, condition,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Avatar;
  else root.Avatar = Avatar;
})(this);
