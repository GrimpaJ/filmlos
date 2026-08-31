# Contributing

There is no build step and no toolchain. Clone, edit, open in a browser, done.

```bash
git clone https://github.com/GrimpaJ/filmlos.git
cd filmlos
python -m http.server 8000   # then open http://localhost:8000
```

## Adding films to an existing list

1. Open `lists/essentials.csv` (or another list) in a spreadsheet app, or a plain text editor.
2. Add one row per film, following [docs/csv-format.md](docs/csv-format.md).
3. Save as **CSV UTF-8**. Keep the header row and the column order intact.
4. If you added to a bundled list, bump its `count` in `lists/index.json`.
5. Reload the page and check the film shows up under the filters you'd expect.

Rows in the bundled lists are sorted alphabetically by title, case-insensitively. Keeping that
order makes diffs readable — but it isn't enforced anywhere, so don't lose sleep over it.

## Adding a whole new list

1. Drop `lists/your-list.csv` in, with the standard header.
2. Add an entry to `lists/index.json`:

   ```json
   {
     "file": "your-list.csv",
     "name": "Your List",
     "description": "One or two sentences on what makes this selection distinct.",
     "count": 42,
     "default": false
   }
   ```

   `default: true` pre-checks the list on the start screen. Only `essentials.csv` does that today.
3. Set the `source` column in your CSV to the same `name`, or leave it empty and it falls back to
   the manifest entry.

Themed lists are the most useful kind: *Comfort Watches*, *Under 100 Minutes*, *Documentaries*,
*90s Only*, a national cinema, whatever you'd actually reach for.

## Ratings are subjective — that's fine

The five 1–3 scales describe how a film *feels*, not how good it is. Two people will disagree about
whether *Whiplash* is a 2 or a 3 on tension, and that's fine. If you think an existing rating is
plain wrong, change it and say why in the PR — one sentence is enough.

## Changing genres, settings or themes

The filter chips come from the vocabularies at the top of `assets/filmlos.js`, **not** from the
CSVs. A value that isn't in those arrays produces no error — the film just never matches that
filter. So adding a new theme means two changes:

1. Add it to `THEMES` (or `GENRES` / `SETTINGS`) in `assets/filmlos.js`.
2. Add it to the vocabulary list in `docs/csv-format.md`.

Please keep these lists short. Every value added is another chip everyone has to scan past, so it
should earn its place across several films, not just one.

## Code changes

`assets/filmlos.js` is plain ES2020 in one IIFE, no dependencies, and it should stay that way — the
whole point is that the page works by opening a file. Match the surrounding style: two-space
indent, `const`/`let`, no framework, no transpiler.

Test by hand before opening a PR:

- Bundled lists load over `http://localhost:8000`.
- The file picker and drag-and-drop still work.
- Loading two lists reveals the "Film list" filter group.
- A CSV with a missing column shows a readable error instead of a blank page.

## Reporting problems

Open an issue. Wrong data, a film in the wrong decade, a broken CSV, a filter combination that
behaves oddly — all useful.
