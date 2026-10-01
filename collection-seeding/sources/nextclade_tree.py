"""Helpers for deriving lineage definitions from a Nextclade reference tree (tree.json)."""

from typing import NamedTuple


class CladeInfo(NamedTuple):
    clade_name: str
    parent_clade: str | None
    branch_nuc: list[str]
    branch_aa: list[str]
    full_nuc: list[str]
    full_aa: list[str]
    new_nuc: list[str]
    new_aa: list[str]
    node_attrs: dict
    depth: int


def extract_clades(
    node,
    lineage_attr="clade_membership",
    parent_clade=None,
    accum_nuc=None,
    accum_aa=None,
    depth=0,
    parent_full_nuc=frozenset(),
    parent_full_aa=frozenset(),
):
    """Walk the Nextclade reference tree recursively, yielding one CladeInfo per introduced clade.

    Fields:
      - clade_name:   node_attrs.<lineage_attr> of the introducing node, e.g. "A.D.3.5"
      - parent_clade: node_attrs.<lineage_attr> of the parent node (None for the root clade)
      - branch_nuc:   nucleotide mutations on this branch only (relative to parent node),
                      e.g. ["C982T", "G108A"]
      - branch_aa:    AA mutations on this branch only, formatted as GENE:MUT,
                      e.g. ["F:T8A", "G:T4N"]
      - full_nuc:     all nucleotide mutations from the reference root down to and including
                      this clade's branch, expressed relative to the root reference sequence,
                      e.g. ["A982T", "G108A", "C241T"]
      - full_aa:      all AA mutations from root to this clade, expressed relative to root,
                      e.g. ["F:T8G", "G:T4N"]
      - new_nuc:      the entries of full_nuc that are not in the parent clade's full_nuc,
                      i.e. what distinguishes this clade from its parent. Unlike branch_nuc
                      this includes mutations on intermediate nodes between the parent
                      clade's introducing node and this clade's introducing node.
      - new_aa:       the same for full_aa
      - node_attrs:   the raw node_attrs of the introducing node (for extra metadata)
      - depth:        number of edges between the tree root and the introducing node

    A clade is introduced at any node whose node_attrs.<lineage_attr> is set and differs
    from its parent's. lineage_attr is e.g. "clade_membership" (Nextstrain clades, matches
    the nodes carrying branch_attrs.labels.clade) or "Nextclade_pango" (Pango lineages in
    the SARS-CoV-2 tree). The same clade can be introduced at more than one node.

    The root reference sequence (e.g. EPI_ISL_412866 for RSV-A) defines position zero
    for all accumulated mutations — i.e. full_nuc and full_aa give the complete set of
    substitutions needed to go from the reference to this clade.

    accum_nuc / accum_aa carry the accumulated state downward. Because _apply_*_mutations
    always returns a new dict rather than mutating in place, each recursive call receives
    its own independent copy of the state — sibling subtrees cannot interfere with each other.

    parent_full_nuc / parent_full_aa carry the full sets of the clade introduction that is
    the actual ancestor of the current node. Since a clade can be introduced at several
    nodes, this must be tracked along the path rather than looked up by clade name.
    """
    if accum_nuc is None:
        accum_nuc = {}
    if accum_aa is None:
        accum_aa = {}

    node_attrs = node.get("node_attrs", {})
    muts = node.get("branch_attrs", {}).get("mutations", {})
    node_clade = node_attrs.get(lineage_attr, {}).get("value")

    # Separate nucleotide mutations (key "nuc") from amino acid mutations (all other keys
    # are gene names such as "F", "G", "L", etc.).
    branch_nuc = sorted(muts.get("nuc", []), key=lambda m: int(m[1:-1]))
    branch_aa_by_gene = {k: v for k, v in muts.items() if k != "nuc"}

    # Fold this branch's mutations into the running accumulated state.
    # The returned dicts are new objects — the parent's dicts are untouched.
    accum_nuc = _apply_nuc_mutations(branch_nuc, accum_nuc)
    accum_aa = _apply_aa_mutations(branch_aa_by_gene, accum_aa)

    if node_clade and node_clade != parent_clade:
        # Flatten branch-level AA mutations into GENE:MUT strings for the "new" variant.
        branch_aa_flat = sorted(
            [
                f"{gene}:{m}"
                for gene, gene_muts in branch_aa_by_gene.items()
                for m in gene_muts
            ],
            key=lambda s: (s.split(":")[0], int(s.split(":")[1][1:-1])),
        )
        full_nuc = _format_accum_nuc(accum_nuc)
        full_aa = _format_accum_aa(accum_aa)
        yield CladeInfo(
            clade_name=node_clade,
            parent_clade=parent_clade,
            branch_nuc=branch_nuc,
            branch_aa=branch_aa_flat,
            full_nuc=full_nuc,
            full_aa=full_aa,
            new_nuc=[m for m in full_nuc if m not in parent_full_nuc],
            new_aa=[m for m in full_aa if m not in parent_full_aa],
            node_attrs=node_attrs,
            depth=depth,
        )
        parent_full_nuc = frozenset(full_nuc)
        parent_full_aa = frozenset(full_aa)

    # Pass the current node's clade as the parent context for children.
    # If a node has no clade (e.g. the synthetic root), fall back to whatever
    # was passed in from above.
    next_parent = node_clade or parent_clade
    for child in node.get("children", []):
        yield from extract_clades(
            child,
            lineage_attr,
            next_parent,
            accum_nuc,
            accum_aa,
            depth + 1,
            parent_full_nuc,
            parent_full_aa,
        )


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
    return [
        f"{ref}{pos}{cur}"
        for pos, (ref, cur) in sorted(accum.items(), key=lambda item: int(item[0]))
    ]


def _format_accum_aa(accum: dict[tuple[str, str], tuple[str, str]]) -> list[str]:
    """Render accumulated AA mutations as GENE:ORIG_REF_AA + POSITION + CURRENT_AA strings.

    E.g. {("F", "8"): ("T", "G")} → ["F:T8G"], meaning: in gene F at codon 8 the reference
    has T and this clade (from root) has G.
    """
    return [
        f"{gene}:{ref}{pos}{cur}"
        for (gene, pos), (ref, cur) in sorted(
            accum.items(), key=lambda item: (item[0][0], int(item[0][1]))
        )
    ]
