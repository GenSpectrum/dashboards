import requests

from models import Collection, Variant
from sources import Source
from sources.nextclade_tree import CladeInfo, extract_clades, new_since_parent

TREE_URL = (
    "https://raw.githubusercontent.com/nextstrain/nextclade_data"
    "/refs/heads/master/data/nextstrain/sars-cov-2/wuhan-hu-1/orfs/tree.json"
)

LINEAGE_ATTR = "Nextclade_pango"


class CovidPangoLineagesSource(Source):
    """Source: Pango lineage definitions from the Nextclade SARS-CoV-2 reference tree.

    Creates one collection per lineage, with nucleotide and amino acid mutations
    (substitutions and deletions) as variants.
    """

    name = "covid-pango-lineages"
    organism = "covid"
    owned_tag = "pango-lineage"

    def __init__(self, limit: int | None = None):
        self._limit = limit

    def get_collections(self) -> list[Collection]:
        print(f"Fetching Nextclade tree from {TREE_URL} ...")
        response = requests.get(TREE_URL, timeout=60)
        response.raise_for_status()
        tree = response.json()["tree"]

        lineages = _first_introductions(extract_clades(tree, LINEAGE_ATTR))
        designation_dates = _collect_designation_dates(tree)

        entries = list(lineages.values())
        if self._limit is not None:
            entries = entries[: self._limit]
        print(f"  Loaded {len(entries)} lineage(s).")
        return [
            self._build_collection(
                lineage,
                lineages.get(lineage.parent_clade),
                designation_dates.get(lineage.clade_name),
            )
            for lineage in entries
        ]

    def _build_collection(
        self,
        lineage: CladeInfo,
        parent: CladeInfo | None,
        designation_date: str | None,
    ) -> Collection:
        name = lineage.clade_name
        raw_parent = lineage.parent_clade or ""
        clade = lineage.node_attrs.get("clade_nextstrain", {}).get("value") or "—"
        date = designation_date or "unknown"

        parent_clause = f" ({raw_parent})" if raw_parent else ""

        nuc_subs = lineage.full_nuc
        aa_subs = lineage.full_aa
        nuc_subs_new, aa_subs_new = new_since_parent(lineage, parent)

        variants: list[Variant] = [
            {
                "type": "filterObject",
                "name": "Nucleotide substitutions",
                "description": "All nucleotide substitutions that define this lineage.",
                "filterObject": {"nucleotideMutations": nuc_subs},
            },
            {
                "type": "filterObject",
                "name": "Amino acid substitutions",
                "description": "All amino acid substitutions that define this lineage.",
                "filterObject": {"aminoAcidMutations": aa_subs},
            },
            {
                "type": "filterObject",
                "name": "New nucleotide substitutions",
                "description": f"Nucleotide substitutions not present in the parent lineage{parent_clause}.",
                "filterObject": {"nucleotideMutations": nuc_subs_new},
            },
            {
                "type": "filterObject",
                "name": "New amino acid substitutions",
                "description": f"Amino acid substitutions not present in the parent lineage{parent_clause}.",
                "filterObject": {"aminoAcidMutations": aa_subs_new},
            },
        ]

        description = (
            f"Pango lineage {name}. "
            f"Parent: {raw_parent or '—'}. "
            f"Nextstrain clade: {clade}. "
            f"Designated: {date}."
        )

        return {
            "name": name,
            "organism": "covid",
            "description": description,
            "variants": variants,
            "tags": [self.owned_tag],
        }


def _first_introductions(lineages) -> dict[str, CladeInfo]:
    """Pick one introduction per lineage.

    A few lineages appear at more than one place in the tree. We use the one closest to
    the root (the first one in tree order on ties).
    """
    result: dict[str, CladeInfo] = {}
    # TODO: ~10 lineages (e.g. FY.3, BF.38, PQ.2) are introduced at multiple nodes
    # in the Nextclade tree, sometimes with different mutations. This looks like an
    # upstream data issue (to be reported to nextclade_data); until then, picking the
    # shallowest node is good enough.
    for lineage in lineages:
        existing = result.get(lineage.clade_name)
        if existing is None or lineage.depth < existing.depth:
            result[lineage.clade_name] = lineage
    return result


def _collect_designation_dates(node, result=None) -> dict[str, str]:
    """Map lineage → designation date.

    The date is not necessarily set on the node introducing the lineage, so we look at
    all nodes of the tree.
    """
    if result is None:
        result = {}
    attrs = node.get("node_attrs", {})
    lineage = attrs.get(LINEAGE_ATTR, {}).get("value")
    date = (attrs.get("designation_date") or {}).get("value")
    if lineage and date:
        result.setdefault(lineage, date)
    for child in node.get("children", []):
        _collect_designation_dates(child, result)
    return result


class CovidPangoLineagesSampleSource(CovidPangoLineagesSource):
    """Same as CovidPangoLineagesSource but limited to the first 10 lineages, for quick testing."""

    name = "covid-pango-lineages-sample"
    include_in_default_run = False

    def __init__(self):
        super().__init__(limit=10)
