# Pathoplexus Explorer

The Explorer provides printable reports and a matrix for Pathoplexus sequence entries. The browser queries RhyDB directly. The endpoint is configured in `dashboards.pathoplexusExplorer.rhydbUrl`.

## Code structure

```
pathoplexusExplorer/
  pageState/    report and matrix state, kept in the URL search params
  dataLayer/    RhyDB: HTTP client (transport/), RhyQL queries and how their rows are interpreted (queries/), React Query hooks (hooks/)
  domain/       subjects, places, periods, lineages, variants and the other notions that reports and filters are built from
  mappingData/  static tables that the domain rules use
  test/         fixtures for the specs
```

Components are in `../components/pathoplexusExplorer/`, and the Astro pages in `../pages/pathoplexus-explorer/` take the place of routes. Each page renders its content inside a `ConnectionProvider` (`dataLayer/hooks/connection.tsx`), which gives the hooks the RhyDB instance and the query client of the RhyDB reads. Imports only go downwards: components → `pageState/` → `dataLayer/` → `domain/` + `mappingData/`. ESLint enforces it (`import/no-restricted-paths`). Group and aggregate in RhyDB before rendering the results.

Report panels, Matrix filters, and accession downloads share one RhyDB snapshot per page. Each response identifies its snapshot with the `data-version` header. A change discards the page’s query cache and reruns the active reads. The page also checks the version on returning to a tab and once a minute while visible.

See [data interpretation](../../../docs/pathoplexus-explorer-domain-decisions.md) for the rules used to count and compare sequences. Keep grouping and filtering consistent when changing a classification.

_The Explorer's code has the same layers as the [W-ASAP dashboard](https://github.com/GenSpectrum/wasap-dashboard), and its RhyDB transport is kept close to W-ASAP's `src/dataLayer/transport/`._

## Variant queries

The mutation filter uses CoV-Spectrum and LAPIS notation. Examples include `C466T` for a nucleotide change, `L:C1234T` for a change on segment L, `F:K68N` for an amino acid change, and `ins_1234:ACG` for an insertion.

Use `lineage:A.D.5*` to include descendants when a lineage definition is available. Terms can be combined with `&`, `|`, `!`, parentheses, `[2-of: a, b, c]`, `[exactly-2-of: a, b, c]`, and `maybe(a)`. The grammar is in `domain/variant.ts`.
