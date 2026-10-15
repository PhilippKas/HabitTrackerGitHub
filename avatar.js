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
    hair: { black: '#2b2440', brown: '#6b4428', blond: '#e2c27a', red: '#c8402f', pink: '#ff2a6d', silver: '#dcdce6' },
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
  const INK = '#120b24';
  const JACKET = '#3a3159';
  const JACKET_HI = '#544a82';
  const CHROME = '#b9bdcc';
  const CHROME_DK = '#7d8196';
  let uid = 0;

  // Darken a #rrggbb colour by a factor (0..1).
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // Horizontal glitch: the art is drawn three times, the middle slice shifted.
  function glitchWrap(art, id, size, bands) {
    let defs = '', out = '';
    let y = 0;
    bands.forEach((b, i) => {
      defs += `<clipPath id="${id}a${i}"><rect x="0" y="${y}" width="${size}" height="${b.y - y}"/></clipPath>`;
      defs += `<clipPath id="${id}b${i}"><rect x="0" y="${b.y}" width="${size}" height="${b.h}"/></clipPath>`;
      out += `<g clip-path="url(#${id}a${i})">${art}</g>`;
      out += `<g clip-path="url(#${id}b${i})"><g transform="translate(${b.dx} 0)">${art}</g></g>`;
      y = b.y + b.h;
    });
    defs += `<clipPath id="${id}z"><rect x="0" y="${y}" width="${size}" height="${size - y}"/></clipPath>`;
    out += `<g clip-path="url(#${id}z)">${art}</g>`;
    const ticks = bands.map((b, i) =>
      `<rect x="${b.dx > 0 ? 4 : size - 4 - size * 0.3}" y="${b.y + b.h / 2 - 1}" width="${size * 0.3}" height="2" fill="${i % 2 ? '#ff2a6d' : '#00e5f2'}"/>`).join('');
    return `<defs>${defs}</defs>${out}${ticks}`;
  }

  // ── Runner (viewBox 0 0 120 120) ──
  // opts: { level, skin, hair, neon, glow, glitch: 0|1|2, bg }
  function runner(opts) {
    const o = Object.assign({ level: 1, glow: false, glitch: 0, bg: true }, opts || {});
    const look = normalize(o);
    const level = Math.max(1, Math.floor(Number(o.level) || 1));
    const p = unlocked(level);
    const skin = PALETTES.skin[look.skin], skinDk = shade(skin, 0.86);
    const hair = PALETTES.hair[look.hair];
    const neon = PALETTES.neon[look.neon];
    const id = `av${++uid}`;
    const red = '#ff3355';
    const eyeCol = o.glitch >= 2 ? red : o.glow ? neon : '#1b1626';

    let a = '';

    // Prestige ring + aura (behind everything)
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
        a += `<path d="M${(60 + r * Math.cos(a0)).toFixed(1)} ${(60 + r * Math.sin(a0)).toFixed(1)} A${r} ${r} 0 0 1 ${(60 + r * Math.cos(a1)).toFixed(1)} ${(60 + r * Math.sin(a1)).toFixed(1)}" fill="none" stroke="${i < lit ? on : off}" stroke-width="4"/>`;
      }
    }
    if (p.has('aura')) a += `<circle cx="60" cy="58" r="44" fill="${neon}" fill-opacity=".14"/><circle cx="60" cy="58" r="44" fill="none" stroke="${neon}" stroke-width="1.5" stroke-dasharray="3 5"/>`;

    // Hood back (level 1 only)
    const hood = !p.has('hair_messy');
    if (hood) a += `<path d="M30 70 C26 40 40 20 60 20 C80 20 94 40 90 70 L84 92 L36 92 Z" fill="${JACKET_HI}"/>`;

    // Shoulders / jacket
    a += `<path d="M10 120 C12 101 26 92 44 89 L76 89 C94 92 108 101 110 120 Z" fill="${JACKET}"/>`;
    // Neck
    a += `<path d="M51 70 L69 70 L70 91 C64 95 56 95 50 91 Z" fill="${skinDk}"/>`;
    if (p.has('barcode')) a += `<path d="M54 78 v6 M56 78 v6 M57.5 78 v6 M60 78 v6 M62.5 78 v6 M64 78 v6 M66 78 v6" stroke="${INK}" stroke-width="1.1" stroke-opacity=".7"/>`;
    // Shirt V
    a += `<path d="M48 89 L60 104 L72 89 Z" fill="${INK}"/>`;
    if (p.has('emblem')) a += `<path d="M86 104 l6 -6 l6 6 l-6 6 z" fill="none" stroke="${neon}" stroke-width="2"/><circle cx="92" cy="104" r="1.6" fill="${neon}"/>`;
    if (p.has('trim')) a += `<path d="M48 89 L60 104 L72 89" fill="none" stroke="${neon}" stroke-width="2"/><path d="M60 104 L60 120" stroke="${neon}" stroke-width="2"/>`;
    if (p.has('collar')) a += `<path d="M42 90 L50 72 L56 92 Z" fill="${JACKET_HI}"/><path d="M78 90 L70 72 L64 92 Z" fill="${JACKET_HI}"/>`;
    if (p.has('plate_l')) a += `<path d="M14 106 L21 93 L41 88 L44 99 L24 108 Z" fill="${CHROME_DK}"/><path d="M21 93 L41 88" stroke="${CHROME}" stroke-width="2"/>`;
    if (p.has('plate_r')) a += `<path d="M106 106 L99 93 L79 88 L76 99 L96 108 Z" fill="${CHROME_DK}"/><path d="M99 93 L79 88" stroke="${CHROME}" stroke-width="2"/>`;

    // Ears + head
    a += `<ellipse cx="41" cy="55" rx="3.5" ry="5.5" fill="${skinDk}"/><ellipse cx="79" cy="55" rx="3.5" ry="5.5" fill="${skinDk}"/>`;
    a += `<ellipse cx="60" cy="52" rx="19" ry="22" fill="${skin}"/>`;
    if (p.has('stud')) a += `<circle cx="79.5" cy="60" r="1.8" fill="${neon}"/>`;
    if (p.has('earpiece')) a += `<path d="M38 50 h-3 v11 h3" fill="none" stroke="${CHROME}" stroke-width="2.4"/><rect x="31" y="53" width="3" height="5" fill="${neon}"/>`;

    // Hair / hood front
    if (hood) {
      a += `<path d="M36 64 C34 40 44 28 60 28 C76 28 86 40 84 64 C82 46 74 36 60 36 C46 36 38 46 36 64 Z" fill="${JACKET_HI}"/>`;
    } else if (p.has('hair_spiky')) {
      a += `<path d="M39 50 L37 33 L45 37 L45 23 L53 31 L58 16 L63 29 L71 19 L71 32 L80 27 L79 39 L82 50 C77 40 68 37 60 38 C51 37 43 41 39 50 Z" fill="${hair}"/>`;
      if (p.has('streak')) a += `<path d="M58 16 L63 29 L60 38 L55 38 Z" fill="${neon}"/>`;
    } else {
      a += `<path d="M40 50 C38 32 48 27 60 27 C73 27 83 33 80 50 C77 41 71 37 65 39 C59 34 51 37 47 42 C45 44 42 46 40 50 Z" fill="${hair}"/>`;
    }

    // Brows, eyes, mouth
    if (!hood) a += `<path d="M49 46 L56 45 M64 45 L71 46" stroke="${shade(hair, 0.8)}" stroke-width="2" stroke-linecap="round"/>`;
    if (p.has('visor')) {
      a += `<path d="M42 49 L78 49 L76 58 L44 58 Z" fill="${neon}"/>`;
      a += `<rect x="49" y="52.5" width="8" height="2" fill="${o.glitch >= 2 ? red : INK}"/><rect x="63" y="52.5" width="8" height="2" fill="${o.glitch >= 2 ? red : INK}"/>`;
    } else {
      a += `<rect x="50" y="51" width="6" height="${o.glow ? 4 : 3.5}" rx="1" fill="${eyeCol}"/>`;
      if (p.has('cybereye')) {
        a += `<rect x="61" y="48" width="12" height="10" fill="${CHROME}"/><rect x="63" y="50.5" width="8" height="4.5" fill="${o.glitch >= 2 ? red : neon}"/>`;
      } else {
        a += `<rect x="64" y="51" width="6" height="${o.glow ? 4 : 3.5}" rx="1" fill="${eyeCol}"/>`;
      }
    }
    if (p.has('piercing') && !p.has('visor')) a += `<circle cx="71.5" cy="44" r="1.5" fill="${neon}"/>`;
    if (p.has('piercing')) a += `<circle cx="73" cy="47.5" r="1.4" fill="${neon}"/><circle cx="74.5" cy="45" r="1.1" fill="${neon}"/>`;
    if (p.has('circuit')) a += `<path d="M45 57 L49 62 L49 67" fill="none" stroke="${neon}" stroke-width="1.4"/><circle cx="49" cy="67.5" r="1.4" fill="${neon}"/>`;
    if (p.has('jaw')) {
      a += `<path d="M46 61 C47 70 53 75 60 75 C67 75 73 70 74 61 L69 67 L60 69 L51 67 Z" fill="${CHROME}"/><path d="M53 70 L67 70" stroke="${CHROME_DK}" stroke-width="1.4"/>`;
    } else {
      a += `<path d="M55 65 Q60 ${o.glow ? 68.5 : 66.5} 65 65" fill="none" stroke="${shade(skin, 0.6)}" stroke-width="1.6" stroke-linecap="round"/>`;
    }

    // Crown
    if (p.has('crown')) {
      a += `<path d="M36 22 Q60 4 84 22" fill="none" stroke="${neon}" stroke-width="2.5"/>`;
      a += `<path d="M48 13 L48 7 M60 9 L60 2 M72 13 L72 7" stroke="${neon}" stroke-width="2"/>`;
      a += `<circle cx="48" cy="6" r="2" fill="${neon}"/><circle cx="60" cy="2.5" r="2.2" fill="#fcee0a"/><circle cx="72" cy="6" r="2" fill="${neon}"/>`;
    }

    // Glow sparks when today is fully done
    if (o.glow && o.glitch < 2) a += `<path d="M94 30 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="${neon}"/><path d="M24 40 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5z" fill="${neon}"/>`;

    if (o.glitch >= 1) {
      const bands = o.glitch >= 2
        ? [{ y: 34, h: 7, dx: -7 }, { y: 52, h: 5, dx: 8 }, { y: 82, h: 9, dx: -6 }]
        : [{ y: 50, h: 5, dx: 4 }];
      a = glitchWrap(a, id, 120, bands);
    }

    const bg = o.bg ? `<path d="M14 0 H120 V106 L106 120 H0 V14 Z" fill="${INK}"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Runner, level ${level}">${bg}${a}</svg>`;
  }

  // ── Pet (viewBox 0 0 60 60) ──
  // opts: { level, neon, mood: 'sleep'|'neutral'|'happy'|'glitch', bg }
  function pet(opts) {
    const o = Object.assign({ level: 1, mood: 'neutral', bg: true }, opts || {});
    const look = normalize(o);
    const level = Math.max(1, Math.floor(Number(o.level) || 1));
    const p = unlocked(level);
    const form = petForm(p);
    const neon = PALETTES.neon[look.neon];
    const id = `pt${++uid}`;
    const BODY = '#efeafc', BODY_DK = '#cfc7ea';
    const EYE = p.has('neoneyes') ? neon : '#1b1626';
    const mood = ['sleep', 'neutral', 'happy', 'glitch'].includes(o.mood) ? o.mood : 'neutral';
    const lift = p.has('thrusters') ? -4 : 0;

    const eyes = (lx, rx, y, s) => {
      if (mood === 'sleep') return `<path d="M${lx - s} ${y} h${2 * s} M${rx - s} ${y} h${2 * s}" stroke="${EYE}" stroke-width="1.6" stroke-linecap="round"/>`;
      if (mood === 'happy') return `<path d="M${lx - s} ${y + 1} l${s} -${s} l${s} ${s} M${rx - s} ${y + 1} l${s} -${s} l${s} ${s}" fill="none" stroke="${EYE}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (mood === 'glitch') return `<rect x="${lx - s}" y="${y - s}" width="${2 * s}" height="${2 * s}" fill="#ff3355"/><rect x="${rx - s}" y="${y - s}" width="${2 * s}" height="${2 * s}" fill="#ff3355"/>`;
      return `<circle cx="${lx}" cy="${y}" r="${s}" fill="${EYE}"/><circle cx="${rx}" cy="${y}" r="${s}" fill="${EYE}"/>`;
    };

    let a = '';
    if (form === 'egg') {
      a += `<ellipse cx="30" cy="33" rx="14" ry="17" fill="${BODY}"/>`;
      a += `<path d="M18 32 L24 28 L28 34 L33 27 L38 33 L42 29" fill="none" stroke="${neon}" stroke-width="1.8"/>`;
      a += `<ellipse cx="30" cy="51" rx="11" ry="2.5" fill="#000" fill-opacity=".25"/>`;
      if (mood === 'sleep') a += `<text x="44" y="16" font-size="9" font-weight="800" fill="${neon}" font-family="sans-serif">z</text>`;
    } else {
      a += `<g transform="translate(0 ${lift})">`;
      if (p.has('wings')) {
        a += `<path d="M16 34 L4 26 L8 38 L2 40 L14 44 Z" fill="${neon}" fill-opacity=".55"/><path d="M44 34 L56 26 L52 38 L58 40 L46 44 Z" fill="${neon}" fill-opacity=".55"/>`;
      }
      if (p.has('thrusters')) {
        a += `<path d="M22 50 L25 50 L23.5 58 Z" fill="${neon}"/><path d="M35 50 L38 50 L36.5 58 Z" fill="${neon}"/>`;
      }
      if (form === 'glitchling') {
        a += `<path d="M22 24 L19 15 L27 21 Z M38 24 L41 15 L33 21 Z" fill="${BODY}"/>`;
        a += `<path d="M16 44 C13 30 21 21 30 21 C39 21 47 30 44 44 C40 50 20 50 16 44 Z" fill="${BODY}"/>`;
        a += eyes(25, 35, 34, 2);
      } else {
        const big = form === 'cybercat';
        const hy = big ? 25 : 28, hr = big ? 11 : 10;
        // tail, body, head, ears
        a += big
          ? `<path d="M40 48 C52 46 52 32 45 30" fill="none" stroke="${BODY_DK}" stroke-width="4" stroke-linecap="round"/>`
          : `<path d="M38 48 C47 48 48 40 44 38" fill="none" stroke="${BODY_DK}" stroke-width="3.5" stroke-linecap="round"/>`;
        a += big
          ? `<path d="M19 52 C17 40 23 33 30 33 C37 33 43 40 41 52 Z" fill="${BODY}"/>`
          : `<ellipse cx="30" cy="45" rx="10" ry="7" fill="${BODY}"/>`;
        if (p.has('stripes')) a += `<path d="M24 41 L27 44 M30 39 L30 44 M36 41 L33 44" stroke="${neon}" stroke-width="1.8" stroke-linecap="round"/>`;
        const ex = big ? 9 : 8, eh = big ? 13 : 10;
        a += `<path d="M${30 - hr + 1} ${hy - 3} L${30 - ex} ${hy - eh} L${30 - 2} ${hy - hr + 1} Z" fill="${BODY}"/>`;
        a += p.has('cyberear')
          ? `<path d="M${30 + hr - 1} ${hy - 3} L${30 + ex} ${hy - eh} L${30 + 2} ${hy - hr + 1} Z" fill="${CHROME}"/><circle cx="${30 + ex - 1}" cy="${hy - eh + 4}" r="1.3" fill="${neon}"/>`
          : `<path d="M${30 + hr - 1} ${hy - 3} L${30 + ex} ${hy - eh} L${30 + 2} ${hy - hr + 1} Z" fill="${BODY}"/>`;
        a += `<circle cx="30" cy="${hy}" r="${hr}" fill="${BODY}"/>`;
        if (p.has('stripes')) a += `<path d="M27 ${hy - hr + 1} L28 ${hy - hr + 5} M33 ${hy - hr + 1} L32 ${hy - hr + 5}" stroke="${neon}" stroke-width="1.6" stroke-linecap="round"/>`;
        if (p.has('tag')) a += `<path d="M22 ${hy + hr - 1} Q30 ${hy + hr + 3} 38 ${hy + hr - 1}" fill="none" stroke="${neon}" stroke-width="2"/><rect x="28" y="${hy + hr + 1}" width="4" height="4" fill="#fcee0a"/>`;
        a += eyes(26, 34, hy + 1, big ? 1.8 : 1.6);
        a += `<path d="M28.6 ${hy + 4.5} L30 ${hy + 5.8} L31.4 ${hy + 4.5}" fill="none" stroke="#e05a86" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      if (p.has('halo')) a += `<ellipse cx="30" cy="${form === 'cybercat' ? 8 : 10}" rx="9" ry="2.6" fill="none" stroke="#fcee0a" stroke-width="1.8"/>`;
      a += `</g>`;
      if (mood === 'sleep') a += `<text x="45" y="17" font-size="9" font-weight="800" fill="${neon}" font-family="sans-serif">z</text><text x="50" y="10" font-size="7" font-weight="800" fill="${neon}" font-family="sans-serif">z</text>`;
    }
    if (mood === 'glitch') a = glitchWrap(a, id, 60, [{ y: 26, h: 5, dx: 4 }]);

    const bg = o.bg ? `<circle cx="30" cy="30" r="30" fill="${INK}"/><circle cx="30" cy="30" r="28.5" fill="none" stroke="${neon}" stroke-width="1.5"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" role="img" aria-label="${PET_FORM_NAMES[form]}">${bg}${a}</svg>`;
  }

  // Today's condition → runner/pet modifiers.
  function condition({ doneToday, anyToday, integrity }) {
    const glitch = integrity < 30 ? 2 : integrity < 60 ? 1 : 0;
    return {
      glow: !!doneToday,
      glitch,
      mood: glitch === 2 ? 'glitch' : doneToday ? 'happy' : anyToday ? 'neutral' : 'sleep',
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
