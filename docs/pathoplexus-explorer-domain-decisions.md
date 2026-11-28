# Pathoplexus Explorer data interpretation

The reports and matrix use the following rules to count and compare Pathoplexus sequence entries.

## Sequence counts and collection dates

The Explorer counts one row per sequence entry, using its latest version and excluding revocations. A sample may have more than one sequence entry.

Pathoplexus represents collection dates as ranges. An entry belongs to a selected period or a chart interval only if its entire collection date range fits. An entry with no collection date may still have an upper bound taken from its release date. A report with only a start date uses its written date as the upper bound. A filter with only an end date therefore also checks that the lower bound is present. In the matrix, “No collection year” includes entries with a missing bound or a date range spanning calendar years.

Lineage reports give the earliest and latest collection dates as ranges. They omit those dates when a recorded lower bound has no valid upper bound.

## Geography and hosts

Inverting a Matrix filter keeps every sequence outside the selected categories, including sequences with a missing value when the missing category is outside the selection.

The Explorer uses UN M49 for continents and subregions. The Explorer uses current administrative divisions for all collection periods. A former division can contribute to a present-day area when its location identifies a single successor. Reports count a province or state only when the country’s lookup identifies the division. An entry with a city, free-text note, or ambiguous location still contributes to its country's total and accession list. A count of countries includes only places that M49 assigns to a continent, so recorded oceans are not counted as countries. Regional counts include records such as Borneo, Korea, and Yugoslavia when the region is known. Country totals require a location attributable to one country or area. Historical names follow the [INSDC geographic vocabulary](https://www.insdc.org/submitting-standards/geo_loc_name-qualifier-vocabulary/) and [M49 territorial changes](https://unstats.un.org/unsd/methodology/m49/). Filters use the same normalization as the breakdowns, so selecting a displayed area retrieves the entries counted for it.

Host groups come from the NCBI taxonomy. A host shown as an arthropod is classified by taxonomy. Its role in transmission cannot be inferred from that group. Unclassified hosts and entries without a recorded host are counted separately.

The [mapping data README](../website/src/pathoplexusExplorer/mappingData/README.md) lists the sources and lookup tables.

## Lineages and mutations

Lineage reports include descendants when RhyDB provides a hierarchy for that column. Without a hierarchy, a lineage report uses the exact value. Matrix subtype cells group by the assigned value, so a matrix cell and a report for the same lineage can have different counts.

Lineage mutation comparisons use the same place, period, and reference genome on both sides. The comparison group excludes the lineage and its descendants. Dengue requires selecting a serotype for mutation analysis because each serotype has its own reference genome. The cutoffs for highlighting characteristic mutations are chosen for the reports and are shown with the results.

A mutation report counts within the subtype or lineage that its address names, so a mutation listed in a lineage report links to a report on that lineage. Choosing the mutation report from the report menu keeps only the subtype that selects the reference genome.

A mutation query ignores the reference symbol before the position, as LAPIS does: `A12C` matches every sequence with C at position 12, whatever the reference has there.

For a query consisting of a single mutation, the proportion uses sequences with a called symbol at that position. Combined queries use the full selection. Insertions in a query filter the sequences, and the position summaries and the genome figure show only its mutations. A result omitted by a minimum frequency filter does not establish that the mutation is absent.

The genome figure places genes using unique, exact matches between reference proteins and translations of the reference genome. A gene without a unique match is left off the figure.

## Accession lists

The accession list covers the entries that the analysis uses, including the sequences used for comparison. When adding a report panel that uses a new group of sequences, make sure that the scope in [`entryScopes.ts`](../website/src/pathoplexusExplorer/domain/entryScopes.ts) still includes it. The matrix accession list covers the full selection, including entries grouped under “Other.”
