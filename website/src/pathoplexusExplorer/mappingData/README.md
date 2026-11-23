# Pathoplexus Explorer mapping data

This directory contains lookup tables. The functions that use them are in `../domain/`.

- `subregions.ts` uses the UN M49 geographic classification. `countryNames.ts` maps country names to those used by the reports and maps.
- `provinceMaps.ts` lists the available maps in `website/public/mapData/`. The maps use Natural Earth and, for Kenya, geoBoundaries.
- `admin1Names.ts` maps division names and codes to areas on each map. `admin1Places.ts` maps places such as cities to the divisions that contain them. See the [division coverage script](../../../scripts/admin1Names/README.md) for how to check these tables.
- `hostTaxa.ts` is [generated from NCBI taxonomy](../../../scripts/hostTaxa/README.md).
- `missingValues.ts` contains placeholder values, including INSDC terms for missing geographic data.

See [data interpretation](../../../../docs/pathoplexus-explorer-domain-decisions.md) for how the reports and matrix use the mappings.
