from typing import NamedTuple

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


class _CladeInfo(NamedTuple):
    clade_name: str
    parent_clade: str | None
    branch_nuc: list[str]
    branch_aa: list[str]
    full_nuc: list[str]
    full_aa: list[str]


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
    for clade in _extract_clades(tree_json["tree"]):
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


def _extract_clades(node, parent_clade=None, accum_nuc=None, accum_aa=None):
    """Walk the Nextclade reference tree recursively, yielding one _CladeInfo per introduced clade.

    Fields:
      - clade_name:   the clade label from branch_attrs.labels.clade, e.g. "A.D.3.5"
      - parent_clade: node_attrs.clade_membership of the parent node (None for the root clade)
      - branch_nuc:   nucleotide mutations on this branch only (relative to parent node),
                      e.g. ["C982T", "G108A"]
      - branch_aa:    AA mutations on this branch only, formatted as GENE:MUT,
                      e.g. ["F:T8A", "G:T4N"]
      - full_nuc:     all nucleotide mutations from the reference root down to and including
                      this clade's branch, expressed relative to the root reference sequence,
                      e.g. ["A982T", "G108A", "C241T"]
      - full_aa:      all AA mutations from root to this clade, expressed relative to root,
                      e.g. ["F:T8G", "G:T4N"]

    A clade is introduced at any node where branch_attrs.labels.clade is set.

    The root reference sequence (e.g. EPI_ISL_412866 for RSV-A) defines position zero
    for all accumulated mutations — i.e. full_nuc and full_aa give the complete set of
    substitutions needed to go from the reference to this clade.

    accum_nuc / accum_aa carry the accumulated state downward. Because _apply_*_mutations
    always returns a new dict rather than mutating in place, each recursive call receives
    its own independent copy of the state — sibling subtrees cannot interfere with each other.
    """
    if accum_nuc is None:
        accum_nuc = {}
    if accum_aa is None:
        accum_aa = {}

    labels = node.get("branch_attrs", {}).get("labels", {})
    muts = node.get("branch_attrs", {}).get("mutations", {})
    node_clade = node.get("node_attrs", {}).get("clade_membership", {}).get("value")

    # Separate nucleotide mutations (key "nuc") from amino acid mutations (all other keys
    # are gene names such as "F", "G", "L", etc.).
    branch_nuc = sorted(muts.get("nuc", []), key=lambda m: int(m[1:-1]))
    branch_aa_by_gene = {k: v for k, v in muts.items() if k != "nuc"}

    # Fold this branch's mutations into the running accumulated state.
    # The returned dicts are new objects — the parent's dicts are untouched.
    accum_nuc = _apply_nuc_mutations(branch_nuc, accum_nuc)
    accum_aa = _apply_aa_mutations(branch_aa_by_gene, accum_aa)

    if "clade" in labels:
        # Flatten branch-level AA mutations into GENE:MUT strings for the "new" variant.
        branch_aa_flat = sorted(
            [f"{gene}:{m}" for gene, gene_muts in branch_aa_by_gene.items() for m in gene_muts],
            key=lambda s: (s.split(":")[0], int(s.split(":")[1][1:-1])),
        )
        yield _CladeInfo(
            clade_name=labels["clade"],
            parent_clade=parent_clade,
            branch_nuc=branch_nuc,
            branch_aa=branch_aa_flat,
            full_nuc=_format_accum_nuc(accum_nuc),
            full_aa=_format_accum_aa(accum_aa),
        )

    # Pass the current node's clade_membership as the parent context for children.
    # If a node has no clade_membership (e.g. the synthetic root), fall back to whatever
    # was passed in from above.
    next_parent = node_clade or parent_clade
    for child in node.get("children", []):
        yield from _extract_clades(child, next_parent, accum_nuc, accum_aa)


def _apply_nuc_mutations(
    branch_muts: list[str],
    accum: dict[str, tuple[str, str]],
) -> dict[str, tuple[str, str]]:
    """Apply a list of branch-level nucleotide mutations on top of an accumulated mutation dict.

    Each mutation string has the form REF_BASE + POSITION + NEW_BASE, e.g. "C982T", where:
      - REF_BASE  is the base in the *parent* node at this position.
      - POSITION  is the 1-based coordinate in the genome.
      - NEW_BASE  is the base introduced by this branch.

    The accumulated dict maps POSITION (str) → (ORIG_REF_BASE, CURRENT_BASE), where:
      - ORIG_REF_BASE  is the base in the root reference genome (not the parent).
      - CURRENT_BASE   is the base after all mutations from root to here.

    Three cases when applying a branch mutation at a position:

      1. Position not yet in accum (first time this position is mutated on this path):
         The parent base IS the reference base, so we record (ref_base_from_mut, new_base).

      2. Position already in accum (mutated earlier on the path from root):
         The parent base is no longer the reference base. We keep the original reference
         base from the existing entry and update only the current base.

      3. New base equals original reference base (reversion to reference):
         Net effect from root is zero — remove the position from the dict entirely.

    Returns a new dict; the input is not modified (so sibling branches are unaffected).
    """
    result = dict(accum)
    for mut in branch_muts:
        ref_base = mut[0]  # base in the parent (= reference if first mutation here)
        pos = mut[1:-1]  # genome position as string, e.g. "982"
        new_base = mut[-1]  # base introduced by this branch
        existing = result.get(pos)
        # If this position was already mutated earlier on the path, keep the original
        # reference base; otherwise the parent base is the reference base.
        orig_ref = existing[0] if existing else ref_base
        if new_base == orig_ref:
            # Reverted back to the reference state — remove from accumulated set.
            result.pop(pos, None)
        else:
            result[pos] = (orig_ref, new_base)
    return result


def _apply_aa_mutations(
    branch_muts_by_gene: dict[str, list[str]],
    accum: dict[tuple[str, str], tuple[str, str]],
) -> dict[tuple[str, str], tuple[str, str]]:
    """Apply branch-level amino acid mutations on top of an accumulated AA mutation dict.

    branch_muts_by_gene maps gene name → list of mutation strings, e.g.
    {"F": ["T8A", "L20F"], "G": ["T4N"]}.

    Each mutation string has the form REF_AA + POSITION + NEW_AA, e.g. "T8A", where:
      - REF_AA   is the amino acid in the *parent* node at this codon.
      - POSITION is the 1-based codon position within the gene.
      - NEW_AA   is the amino acid introduced by this branch.

    The accumulated dict maps (GENE, POSITION) → (ORIG_REF_AA, CURRENT_AA), where:
      - ORIG_REF_AA  is the amino acid in the root reference genome.
      - CURRENT_AA   is the amino acid after all mutations from root to here.

    The same three accumulation cases apply as for nucleotide mutations.

    Returns a new dict; the input is not modified.
    """
    result = dict(accum)
    for gene, muts in branch_muts_by_gene.items():
        for mut in muts:
            ref_aa = mut[0]  # amino acid in the parent
            pos = mut[1:-1]  # codon position within the gene
            new_aa = mut[-1]  # amino acid introduced by this branch
            key = (gene, pos)
            existing = result.get(key)
            orig_ref = existing[0] if existing else ref_aa
            if new_aa == orig_ref:
                result.pop(key, None)
            else:
                result[key] = (orig_ref, new_aa)
    return result


def _format_accum_nuc(accum: dict[str, tuple[str, str]]) -> list[str]:
    """Render accumulated nucleotide mutations as ORIG_REF_BASE + POSITION + CURRENT_BASE strings.

    E.g. {"982": ("A", "T")} → ["A982T"], meaning: at genome position 982 the reference
    has A and this clade (from root) has T.
    """
    return [f"{ref}{pos}{cur}" for pos, (ref, cur) in sorted(accum.items(), key=lambda item: int(item[0]))]


def _format_accum_aa(accum: dict[tuple[str, str], tuple[str, str]]) -> list[str]:
    """Render accumulated AA mutations as GENE:ORIG_REF_AA + POSITION + CURRENT_AA strings.

    E.g. {("F", "8"): ("T", "G")} → ["F:T8G"], meaning: in gene F at codon 8 the reference
    has T and this clade (from root) has G.
    """
    return [f"{gene}:{ref}{pos}{cur}" for (gene, pos), (ref, cur) in sorted(accum.items(), key=lambda item: (item[0][0], int(item[0][1])))]
