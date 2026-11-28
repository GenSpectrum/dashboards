# Generate host groups

The script generates `src/pathoplexusExplorer/mappingData/hostTaxa.json` from Pathoplexus host taxon IDs and the NCBI taxonomy. Regenerate it when new taxa appear under **Host not classified** in a report.

Run from `website/`:

```bash
curl -O https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdmp.zip
unzip taxdmp.zip nodes.dmp merged.dmp -d taxonomy/
node scripts/hostTaxa/generate.ts --taxonomy taxonomy/
```

The script reads from the staging RhyDB instance by default. To use another instance, pass `--instance <url>`.
