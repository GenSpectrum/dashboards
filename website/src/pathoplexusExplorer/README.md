# Pathoplexus Explorer

The Explorer provides printable reports and a matrix for Pathoplexus sequence entries. The browser queries RhyDB directly. The endpoint is configured in `dashboards.pathoplexusExplorer.rhydbUrl`.

## Code structure

- `domain/` and `mappingData/` define the classifications used in reports and filters.
- `rhydb/` builds and runs RhyQL queries. Group and aggregate in RhyDB before rendering the results.
- `reports/` and `matrix/` define the queries and results for each view. Their components are in `../components/pathoplexusExplorer/`.

See [data interpretation](../../../docs/pathoplexus-explorer-domain-decisions.md) for the rules used to count and compare sequences. Keep grouping and filtering consistent when changing a classification.

## Variant queries

The mutation filter uses CoV-Spectrum and LAPIS notation. Examples include `C466T` for a nucleotide change, `L:C1234T` for a change on segment L, `F:K68N` for an amino acid change, and `ins_1234:ACG` for an insertion.

Use `lineage:A.D.5*` to include descendants when a lineage definition is available. Terms can be combined with `&`, `|`, `!`, parentheses, `[2-of: a, b, c]`, `[exactly-2-of: a, b, c]`, and `maybe(a)`. The grammar is in `domain/variant.ts`.
