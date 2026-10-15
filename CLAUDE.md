# Habit Tracker PWA
 
A Progressive Web App habit tracker, deployed as static files on GitHub Pages.
All user data stays on-device — there is no backend and nothing is sent to a server.
 
## Tech constraints
 
- Vanilla HTML / CSS / JavaScript. No build step, no bundler, no framework.
  The repo must be deployable to GitHub Pages as plain static files.
- Start as a single `index.html` (markup + logic). Split into separate JS/CSS
  files only once it gets unwieldy.
- No external runtime dependencies unless there's a strong reason. Prefer
  standard web APIs.
## File layout
 
```
/
├── index.html      # markup + app logic
├── game.js         # gamification rules (pure functions, exposes one `Game` global)
├── manifest.json   # app name, icons, "display": "standalone"
├── sw.js           # service worker: caches the app shell for offline use
├── icon.svg        # icon source (PNGs are rendered from it)
├── icon-180.png    # iOS Home Screen (apple-touch-icon)
├── icon-192.png
└── icon-512.png
```
 
## GitHub Pages gotcha (important)
 
The site is served from a subpath like `https://<user>.github.io/<repo>/`, NOT
from a domain root. Therefore:
 
- All asset paths and the manifest `start_url` / `scope` must be **relative**
  (`./`) or include the `/<repo>/` prefix. Absolute `/foo` paths break install.
- The service worker cache list must use the same relative paths.
- GitHub Pages serves over HTTPS automatically — required for service workers
  and reliable "Add to Home Screen".
## Data persistence — the core concern
 
Data loss is the worst-case failure for this app. Design defensively.
 
- **Use `localStorage`, not IndexedDB.** Habit data is tiny (kilobytes of JSON).
  Read the full state on launch, write it back on every change. Do not add
  IndexedDB complexity unless the data model outgrows localStorage.
- **The app is meant to be added to the Home Screen.** iOS deletes script-writable
  storage after 7 days of non-use for sites used *in the browser*, but Home Screen
  installs are exempt from that timer. Treat browser-tab use as unsupported.
- **Call `navigator.storage.persist()` on every launch** to request protected
  storage and reduce the chance of eviction under device storage pressure.
  It's best-effort, not guaranteed — hence the next rule.
- **Always ship Export / Import.** Provide a button to download the full state as
  a `.json` file, and one to re-import it. This is the real backup and is
  non-negotiable. On-device storage is the working copy, not the only copy.
- **Loading never writes.** `loadState` only fills missing defaults in memory.
  Safety copies live next to the main `habits_v1` key and must never be
  overwritten automatically: `habits_v1_backup_pre_v2` (first-launch snapshot),
  `habits_v1_preimport` (for "Undo last import"), `habits_v1_unreadable_*`
  (data that failed to parse).
## Data model
 
Keep it flat and JSON-serializable so the whole state round-trips through one
`JSON.stringify` / `JSON.parse`:
 
```js
{
  "version": 1,                 // bump + migrate when the shape changes
  "habits": [
    {
      "id": "h_a1b2",
      "name": "Meditate",
      "createdAt": "2026-07-19",
      "completed": ["2026-07-18", "2026-07-19"]   // YYYY-MM-DD strings
    }
  ]
}
```
 
- Optional, additive fields (no version bump needed; older versions ignore them):
  `habit.stat` (`"BODY" | "INT" | "TECH" | "COOL" | "EMP"`), `settings.gamify`
  (false = game UI off), `settings.handle` (runner name), `settings.lastExport`.
- Store completions as a list of `YYYY-MM-DD` strings — makes streak math trivial.
- **Game state is derived, never stored.** XP, levels, attributes, crits and badges
  are recomputed from `completed` by `Game.computeProgress` (game.js). Don't persist
  any of it. The app must keep working if `game.js` fails to load (`window.Game`
  missing → game UI hidden).
- The `version` field is required: check it on load and migrate old data instead
  of breaking it.
## PWA requirements
 
- `manifest.json`: set `name`, `short_name`, both icon sizes, and
  `"display": "standalone"` so it opens fullscreen.
- `sw.js`: cache the app shell (`index.html`, CSS, JS, icons) so it opens offline.
  Use a versioned cache name and clean up old caches on `activate`.
- Re-cache critical assets on each launch as a resilience measure.
## Conventions
 
- Dates are always `YYYY-MM-DD` strings in local time. Never store timestamps.
- A streak = consecutive days up to today with a completion entry.
- Keep the UI touch-friendly: this runs on an iPhone.
## Deploy
 
1. Push these files to a GitHub repo.
2. Settings → Pages → deploy from the branch root.
3. Open `https://<user>.github.io/<repo>/` in Safari on iPhone.
4. Share → Add to Home Screen. Launch from the icon (not the browser tab).