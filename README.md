# dsh-artcraft-skills

Agent skills for the **fourteen ArtCraft applications** — spreadsheets, documents, slides, PDFs,
CAD, vector art, raster images, photo raw, video, motion graphics, page layout, interface design
and 3D texture painting.

The plugins in [lznnnnn1998/dsh-artcraft](https://github.com/lznnnnn1998/dsh-artcraft) give an
agent the **capability**: fourteen tools per application, every menu action reachable as a command.
These skills give it the **competence**: which application to reach for, in what order, and what a
finished deliverable must pass before it is handed over.

Each skill here is a workflow, not a tool reference. Every recipe in them was run against the real
applications, and the pitfalls are the ones that actually bit during that run.

| Skill | What it produces | Applications chained |
|---|---|---|
| [`artcraft`](skills/artcraft/SKILL.md) | The family overview: both interfaces, the discover→describe→run loop, per-craft quirks, live-app attach, visual verification | all fourteen |
| [`artcraft-report`](skills/artcraft-report-kit/SKILL.md) | A data-backed report as DOCX and PDF, with a **native editable chart** | GridCraft → WordCraft |
| [`artcraft-brand-kit`](skills/artcraft-brand-kit/SKILL.md) | A design system turned into exported assets and a brand book | FigCraft → DesignCraft |
| [`artcraft-explainer-video`](skills/artcraft-explainer-video/SKILL.md) | A slide deck rendered to frames and cut into an MP4 | DeckCraft → FilmCraft → SoundCraft |
| [`artcraft-cad-set`](skills/artcraft-cad-set/SKILL.md) | A drawing package: sheets converted and combined into one PDF | CADCraft → PdfCraft |
| [`artcraft-convert`](skills/artcraft-convert/SKILL.md) | A file converted by the application that owns its format | any → PDF/PNG/SVG/DOCX/… |

## Install

```sh
git clone https://github.com/lznnnnn1998/dsh-artcraft-skills
cd dsh-artcraft-skills
node scripts/install.mjs            # copies into ~/.dsh/skills
```

DSH reads skills from `$DSH_HOME/skills/<name>/SKILL.md`, so the install is a copy: no build step
and no plugin entry. Use `--dsh-home` for another profile home, `--dry-run` to look first.

Requirements: the ArtCraft plugins installed in the same DSH profile, and the applications' CLIs on
the machine (`node scripts/install-craft.mjs` from the plugin repository).

## Evidence, not assertion

Every skill states what was verified and what was not:

- **`artcraft-report`** — a title, body and native Word chart were produced, exported to PDF, the
  page rendered and inspected as an image. The chart is editable in Word; a library-based route can
  only embed a picture of one.
- **`artcraft-cad-set`** — a DXF drew (18,640 bytes), converted to a 1 KB vector PDF and a 29 KB
  PNG; `doc_combine` verified against its schema.
- **`artcraft-explainer-video`** — `file.render`, `file.importImageSequence` and `file.exportMedia`
  verified in the applications' catalogues.
- **`artcraft-brand-kit`** — `figcraft export` wrote a PNG; `file.place` verified against its
  parameter grammar.
- **`artcraft-convert`** — each row names the command that was run.

Where a pipeline step could not be run end to end, the skill says so instead of implying otherwise.

## Why not one skill per application

Fourteen near-identical "discover, then run" documents would burn context and teach nothing. The
family skill covers the common loop once; the other five exist because **combining applications is
where the value is** — data in a spreadsheet becoming a report, slides becoming a video, a drawing
becoming a deliverable PDF.

## Contributing

1. Write the recipe **by running it**, and put the command that failed first into the pitfalls.
2. `node scripts/validate-skills.mjs` must pass — a malformed frontmatter makes a skill vanish
   from the catalogue without any error, so the installer refuses to install one.
3. Keep the boundaries section honest about what needs the applications installed.

## License

MIT — see [LICENSE](LICENSE).
