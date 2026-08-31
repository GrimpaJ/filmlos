# CSV format

Reference for editing an existing list or writing a new one by hand. Open the file in Excel,
Numbers, LibreOffice or Google Sheets — one row per film.

## Ground rules

- **Don't rename or delete the header row.** Columns are matched by name, not by position. The
  order of the columns doesn't matter; their spelling does.
- **Save as "CSV UTF-8".** Every spreadsheet app offers this on export. Anything else mangles
  accented characters.
- **Commas in titles are fine.** `Three Billboards Outside Ebbing, Missouri` is written with the
  field in quotes — spreadsheet apps do this for you automatically.
- **One row per title, and titles should be unique.** Filmlos normalises titles (case, accents,
  punctuation) when merging lists, so near-identical titles across two files are detected as
  duplicates and the second one is skipped.
- **Multi-value fields** (`genre`, `setting`, `themes`) are separated by a pipe `|` with no spaces
  around it: `Drama|Comedy`

## The columns

| Column | Type | Values |
| --- | --- | --- |
| `title` | text | Film title. Hidden until "Show matches" or "Surprise us". |
| `year` | number | Four-digit release year, e.g. `2016`. |
| `runtime_min` | number | Runtime in minutes, digits only, e.g. `148`. |
| `attention` | 1–3 | How much focus it demands. |
| `weight` | 1–3 | How heavy the subject matter is. |
| `tension` | 1–3 | How nerve-wracking it is. |
| `action` | 1–3 | How much action and pace. |
| `humor` | 1–3 | How much you laugh. |
| `ending` | enum | `Positive`, `Bittersweet` or `Bleak`. |
| `genre` | enum list | One or more genres, pipe-separated. |
| `setting` | enum list | One or more settings, pipe-separated. |
| `themes` | enum list | One or more themes, pipe-separated. |
| `series` | enum | `Yes` or `No`. |
| `style` | enum | `Indie`, `Mixed` or `Mainstream`. |
| `source` | text | Optional list label. Falls back to the file name. |

### Scales in detail

**`attention`** — how much concentration it takes to follow along.
1 = low (works as background viewing) · 2 = medium · 3 = high (nested plot, subtitles, full focus).

**`weight`** — how emotionally heavy or demanding the subject matter is.
1 = light and easy-going · 2 = medium · 3 = heavy, serious, draining.

**`tension`**, **`action`**, **`humor`** — 1 = low, 2 = medium, 3 = high.

### Derived buckets

`year` and `runtime_min` are turned into filter chips automatically. You don't enter these.

| `runtime_min` | Runtime chip |
| --- | --- |
| under 90 | Short |
| 90–120 | Medium |
| 121–160 | Long |
| over 160 | Epic |

| `year` | Decade chip |
| --- | --- |
| before 1980 | Pre-1980 |
| 1980–1989 | 1980s |
| 1990–1999 | 1990s |
| 2000–2009 | 2000s |
| 2010–2019 | 2010s |
| 2020 and later | 2020s |

### `series`

- `Yes` — part of a multi-film work that doesn't stand on its own (the story isn't finished).
- `No` — a self-contained film, even if sequels exist, as long as the story resolves.

### Controlled vocabularies

Copy-paste these rather than typing them. A typo or an invented value doesn't cause an error, but
the film will never show up under that filter, because the chips come from the vocabulary in
`assets/filmlos.js` — not from what's in the CSV.

**`genre`**
`Drama` `Comedy` `Thriller` `Action` `Horror` `Sci-Fi` `Crime` `Romance` `Biopic` `War` `Western`
`Mystery` `Fantasy` `Animation` `Musical` `Adventure` `Documentary` `Family` `Sports`

**`setting`**
`Modern` `Historical` `War` `Future` `Fantasy World`

**`themes`**
`Family` `Friendship` `Love & Relationships` `Grief & Loss` `Addiction` `Mental Health`
`Coming-of-Age` `Violence & Crime` `War` `Social Critique` `Revenge` `Identity` `LGBTQ+`
`Art & Music` `Power & Politics` `Isolation & Loneliness` `Survival`

Missing a genre or theme you need often? Open an issue — adding one is a one-line change in
`assets/filmlos.js`, but it has to be added there for the chip to exist.

### `source`

Optional free-text label the film shows up under in the "Film list" filter group once more than one
file is loaded. Leave the cell empty and Filmlos falls back to the file name (or, for a bundled
list, the name from `lists/index.json`).

## Copy-paste template

Header (this is the exact order used by the bundled lists):

```
title,year,runtime_min,attention,weight,tension,action,humor,ending,genre,setting,themes,series,style,source
```

Empty row with the expected shape:

```
Title,Year,Minutes,1-3,1-3,1-3,1-3,1-3,Positive/Bittersweet/Bleak,Genre1|Genre2,Setting1|Setting2,Theme1|Theme2,Yes/No,Indie/Mixed/Mainstream,
```

Filled-in example:

```
Dune: Part Two,2024,166,2,2,3,3,1,Bittersweet,Sci-Fi|Adventure,Future,Power & Politics|Revenge,Yes,Mainstream,
```

## Checklist before saving

- [ ] Header row unchanged?
- [ ] `year` and `runtime_min` are plain digits, no units?
- [ ] The five scale columns only contain `1`, `2` or `3`?
- [ ] `ending`, `series` and `style` taken verbatim from the lists above (capitalisation included)?
- [ ] `genre`, `setting` and `themes` `|`-separated and from the vocabularies above?
- [ ] Saved as CSV UTF-8?
