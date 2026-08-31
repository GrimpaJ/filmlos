# Filmlos

**Pick a film by mood, not by title.**

Choosing a film with other people usually goes the same way: someone scrolls a list, everyone
reacts to names they already have an opinion about, and forty minutes later nobody has watched
anything. Filmlos flips it around. You set criteria — *short, funny, doesn't need much attention,
nothing bleak* — and the titles stay hidden until you press **Show matches** or **Surprise us**.

No accounts, no server, no build step. One HTML page, some CSS, some JavaScript, and CSV files you
can edit in a spreadsheet.

## Try it

Open **https://grimpaj.github.io/filmlos/** — the bundled lists load straight in the browser.

<sub>(If that 404s, enable GitHub Pages for this repo: *Settings → Pages → Source: Deploy from a
branch → `main` / `root`*.)</sub>

## Run it locally

Because browsers block `fetch()` on `file://`, the bundled lists only load when the folder is
served over HTTP:

```bash
git clone https://github.com/GrimpaJ/filmlos.git && cd filmlos && python -m http.server 8000
```

Then open `http://localhost:8000`.

You can also just double-click `index.html`. The bundled lists won't auto-load, but the file picker
still works — choose the CSVs in `lists/` by hand, or drop them onto the page.

## How it works

1. **Load one or more lists.** Bundled ones from `lists/`, your own CSVs, or a mix. Each file
   becomes its own toggleable list; identical titles across files are merged, not duplicated.
2. **Set filters.** Runtime, attention needed, emotional weight, tension, action, humor, ending,
   genre, setting, themes, decade, indie–mainstream, standalone vs. series. Within one group the
   chips are OR-ed, across groups they are AND-ed. The dial counts how many films survive.
3. **Reveal.** **Show matches** lists every survivor; **Surprise us** picks one at random.

Nothing leaves your browser. There is no backend and no analytics — the CSVs are read locally.

## Bundled lists

| List | Films | What's in it |
| --- | --- | --- |
| `lists/essentials.csv` | 165 | Broad, mainstream-leaning cross-section: blockbusters, animation, classics, comedy, horror, plus some European cinema. Good default for a mixed group. |
| `lists/creators-choice.csv` | 101 | The project author's own favourites — more indie, more drama, more recent arthouse. |

Both use original / international English titles. They overlap in zero films, so loading both gives
you 266.

`lists/index.json` is the manifest the start screen reads. Adding a list means dropping a CSV into
`lists/` and adding an entry there.

## Bring your own list

Any CSV with the right header works. The short version:

```
title,year,runtime_min,attention,weight,tension,action,humor,ending,genre,setting,themes,series,style,source
Dune: Part Two,2024,166,2,2,3,3,1,Bittersweet,Sci-Fi|Adventure,Future,Power & Politics|Revenge,Yes,Mainstream,
```

The five 1–3 scales are subjective on purpose — they describe how a film *feels* to watch, not how
good it is. Full column reference, the controlled vocabularies for genre/setting/themes, and a
pre-save checklist: **[docs/csv-format.md](docs/csv-format.md)**.

## Repository layout

```
index.html            the app shell
assets/filmlos.css    styling
assets/filmlos.js     parsing, filtering, rendering — all of the logic
lists/index.json      manifest of the bundled lists
lists/*.csv           the film data
docs/csv-format.md    how to write or extend a list
```

## Contributing

Corrections to ratings, new films, and whole new lists are all welcome — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

[CC0 1.0 Universal](LICENSE) — public domain. Use it, fork it, rip out the parts you like, no
attribution needed.
