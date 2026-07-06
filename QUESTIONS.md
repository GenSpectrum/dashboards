# Open Questions — Flu Resistance Mutations (issue #1272)

## 1. Type B lineage mapping

**Problem:** Both `NA-inhibitors.json` and `PA-inhibitors.json` record B-lineage strains as
`"Type B"` or `"B"` without distinguishing B/Victoria from B/Yamagata.

**Current decision:** Mapped to `victoria` since B/Yamagata is no longer circulating as of 2024.

**Question:** Is this correct? Should we only include "Type B" rows in the `victoria` organism,
or should we also create an `influenzaB` aggregate? If new Yamagata data ever appeared, how
should it be handled?

---

## 2. "A(H1N1)" vs "A(H1N1)pdm09"

**Problem:** The source files use both `"A(H1N1)"` (pre-2009 seasonal) and `"A(H1N1)pdm09"`
(pandemic 2009 onward). The dashboards only have a single `h1n1pdm` organism.

**Current decision:** Both are included in the `h1n1pdm` source.

**Question:** Is this appropriate? Pre-2009 seasonal H1N1 is extinct; should those rows be
excluded or is the resistance data still relevant for the pdm09 context?

---

## 3. Baloxavir / PA-inhibitors resistance threshold

**Problem:** `PA-inhibitors.json` stores resistance only as numeric fold-change values (e.g.
`"5"`, `"22–54"`). There are no NI/RI/HRI labels. The current implementation includes
**all** rows and names variants `"FC {value}x"`.

**Question:**
- Should a fold-change cutoff be applied to filter out low-level changes?
- If so, what threshold? (e.g. FC ≥ 5, ≥ 10?)
- Should the variant name be the mutation name rather than the fold-change?
  (The RSV pattern uses the resistance type as the name, but fold-changes are more
  informative for PA inhibitors.)

---

## 4. Amino acid mutation gene names in LAPIS

**Problem:** The source files provide bare mutation strings like `"H275Y"` (from
`NA-inhibitors.json`) that we prefix with `"NA:"` before adding to
`aminoAcidMutations`. Similarly, Baloxavir mutations get `"PA:"`.

**Question:** Do the LAPIS instances for `h1n1pdm`, `h3n2`, `h5n1`, and `victoria` use
the standard influenza segment names (`PB2`, `PB1`, `PA`, `HA`, `NP`, `NA`, `M1`, `M2`,
`NS1`, `NS2`) for `aminoAcidMutations` queries? Or do they use segment numbers (Seg1–Seg8)
or some other convention? If the gene names are wrong the filter objects will not match any
sequences.

---

## 5. A(H3N2)v — zoonotic variant strains

**Problem:** `NA-inhibitors.json` contains a few `"A(H3N2)v"` entries (zoonotic variant
strains circulating in swine). These are currently excluded.

**Question:** Should these be included in the `h3n2` organism, or omitted because they are
not human seasonal strains?

---

## 6. A(H7N9) and other non-dashboard subtypes

**Problem:** `NA-inhibitors.json` contains `"A(H7N9)"` rows (and potentially others not in
the dashboards).

**Current decision:** These are silently ignored because they are not in `_strain_names` for
any of the four sources.

**Question:** Should we log a warning when unrecognised strains are encountered, to catch
future additions to the BU-ISCIII dataset?

---

## 7. Multi-gene mutations in `mutations_data.json` / `2022_NGS-surveillance.json`

**Problem:** The BU-ISCIII repo also contains `mutations_data.json` and
`2022_NGS-surveillance.json` which cover a broader set of antivirals (Pimodivir, M2
inhibitors, etc.) and sometimes list mutations across multiple segments simultaneously.

**Question:**
- Should these files be integrated as additional sources beyond the NA/PA inhibitors
  already covered?
- The original helper code (`isciii_loader.py`) explicitly warns that "multi-segment"
  mutation combinations are not supported. Should we skip those entries or include
  each mutation individually?

---

## 8. Ordering / stable collection IDs

The issue mentions placing flu resistance sources **after** RSV resistance to maintain
predictable IDs. The current `registry.py` ordering is:

```
CovidResistanceMutations
RsvAResistanceMutations
RsvBResistanceMutations
FluH1N1ResistanceMutations   ← new
FluH3N2ResistanceMutations   ← new
FluH5N1ResistanceMutations   ← new
FluVictoriaResistanceMutations ← new
RsvANextcladeLineages
RsvBNextcladeLineages
...
```

**Question:** Is this the intended position, or should all four flu sources go after the RSV
nextclade lineages as well?

---

## 9. Collection description / attribution

**Question:** Is the current description wording acceptable:

> "Influenza NA resistance mutations against Oseltamivir as per BU-ISCIII flu_resistance
> database (https://github.com/BU-ISCIII/flu_resistance). #resistance-mutation"

Or should it include a data version/date, a specific commit hash, or a different phrasing?
