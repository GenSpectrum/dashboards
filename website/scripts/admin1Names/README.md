# Check division mappings

Run from `website/`:

```bash
node scripts/admin1Names/check.mjs
```

The script reports which recorded divisions can be mapped and lists unmapped country and division pairs by frequency. It uses the staging RhyDB instance by default. To check another instance, pass `--instance <url>`.

Run the script when a report shows unmapped divisions or after refreshing the maps. In [`mappingData/`](../../src/pathoplexusExplorer/mappingData/), add division names and codes to `admin1Names.ts` and places within a division to `admin1Places.ts`. The tests in `admin1Names.spec.ts` check that the mapped areas exist.
