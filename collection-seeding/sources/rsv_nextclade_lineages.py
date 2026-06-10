import requests

from models import Collection, Variant
from sources import Source

RSV_A_TREE_URL = (
    "https://raw.githubusercontent.com/nextstrain/nextclade_data"
    "/refs/heads/master/data_output/nextstrain/rsv/a"
    "/EPI_ISL_412866/2026-04-14--11-55-23Z/tree.json"
)

RSV_B_TREE_URL = (
    "https://raw.githubusercontent.com/nextstrain/nextclade_data"
    "/refs/heads/master/data_output/nextstrain/rsv/b"
    "/EPI_ISL_1653999/2026-04-14--11-55-23Z/tree.json"
)


def _extract_clades(node, parent_clade=None):
    """Walk the Nextclade reference tree, yielding (clade, parent_clade, nuc_muts, aa_muts) for each introduced clade.

    A clade is introduced at any node where branch_attrs.labels.clade is set.
    Parent clade comes from the parent node's node_attrs.clade_membership.
    """
    labels = node.get("branch_attrs", {}).get("labels", {})
    muts = node.get("branch_attrs", {}).get("mutations", {})
    node_clade = node.get("node_attrs", {}).get("clade_membership", {}).get("value")

    if "clade" in labels:
        nuc_muts = muts.get("nuc", [])
        aa_muts = [
            f"{gene}:{m}"
            for gene, gene_muts in muts.items()
            if gene != "nuc"
            for m in gene_muts
        ]
        yield labels["clade"], parent_clade, nuc_muts, aa_muts

    next_parent = node_clade or parent_clade
    for child in node.get("children", []):
        yield from _extract_clades(child, next_parent)


def _build_collections(tree_json: dict, organism: str, organism_label: str, owned_tag: str) -> list[Collection]:
    collections = []
    for clade_name, parent_clade, nuc_muts, aa_muts in _extract_clades(tree_json["tree"]):
        parent_str = parent_clade or "—"
        variants: list[Variant] = [
            {
                "type": "filterObject",
                "name": "Nucleotide substitutions",
                "filterObject": {"nucleotideMutations": nuc_muts},
            },
            {
                "type": "filterObject",
                "name": "Amino acid substitutions",
                "filterObject": {"aminoAcidMutations": aa_muts},
            },
        ]
        description = (
            f"{organism_label} Nextclade clade {clade_name}. "
            f"Parent clade: {parent_str}. "
            f"{owned_tag}"
        )
        collections.append({
            "name": clade_name,
            "organism": organism,
            "description": description,
            "variants": variants,
        })
    return collections


class _RsvNextcladeLineagesBase(Source):
    owned_tag = "#nextclade-lineage"
    _tree_url: str
    _organism_label: str

    def get_collections(self) -> list[Collection]:
        print(f"Fetching Nextclade tree from {self._tree_url} ...")
        response = requests.get(self._tree_url, timeout=60)
        response.raise_for_status()
        tree_json = response.json()
        collections = _build_collections(tree_json, self.organism, self._organism_label, self.owned_tag)
        print(f"  Loaded {len(collections)} clade(s).")
        return collections


class RsvANextcladeLineagesSource(_RsvNextcladeLineagesBase):
    name = "rsv-a-nextclade-lineages"
    organism = "rsvA"
    _tree_url = RSV_A_TREE_URL
    _organism_label = "RSV-A"


class RsvBNextcladeLineagesSource(_RsvNextcladeLineagesBase):
    name = "rsv-b-nextclade-lineages"
    organism = "rsvB"
    _tree_url = RSV_B_TREE_URL
    _organism_label = "RSV-B"
