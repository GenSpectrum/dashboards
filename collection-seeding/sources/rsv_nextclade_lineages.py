import requests

from models import Collection, Variant
from sources import Source
from sources.nextclade_tree import extract_clades

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


class _RsvNextcladeLineagesBase(Source):
    owned_tag = "nextclade-lineage"
    _tree_url: str
    _organism_label: str

    def get_collections(self) -> list[Collection]:
        print(f"Fetching Nextclade tree from {self._tree_url} ...")
        response = requests.get(self._tree_url, timeout=60)
        response.raise_for_status()
        tree_json = response.json()
        collections = _build_collections(
            tree_json, self.organism, self._organism_label, self.owned_tag
        )
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


def _build_collections(
    tree_json: dict, organism: str, organism_label: str, owned_tag: str
) -> list[Collection]:
    """Build one Collection per clade in the Nextclade reference tree.

    Each collection gets four variants, mirroring the shape used for COVID Pango lineages:

      - "Nucleotide substitutions"      — full set from reference root (for searching
                                          sequences that carry all defining substitutions
                                          of this clade)
      - "Amino acid substitutions"      — full AA set from reference root
      - "New nucleotide substitutions"  — branch-only mutations (what is newly introduced
                                          in this clade step relative to its parent clade)
      - "New amino acid substitutions"  — branch-only AA mutations
    """
    collections = []
    for clade in extract_clades(tree_json["tree"]):
        parent_str = clade.parent_clade or "—"
        variants: list[Variant] = [
            {
                "type": "filterObject",
                "name": "Nucleotide substitutions",
                "filterObject": {"nucleotideMutations": clade.full_nuc},
            },
            {
                "type": "filterObject",
                "name": "Amino acid substitutions",
                "filterObject": {"aminoAcidMutations": clade.full_aa},
            },
            {
                "type": "filterObject",
                "name": "New nucleotide substitutions",
                "filterObject": {"nucleotideMutations": clade.branch_nuc},
            },
            {
                "type": "filterObject",
                "name": "New amino acid substitutions",
                "filterObject": {"aminoAcidMutations": clade.branch_aa},
            },
        ]
        description = (
            f"{organism_label} Nextclade clade {clade.clade_name}. "
            f"Parent clade: {parent_str}."
        )
        collections.append(
            {
                "name": clade.clade_name,
                "organism": organism,
                "description": description,
                "variants": variants,
                "tags": [owned_tag],
            }
        )
    return collections
