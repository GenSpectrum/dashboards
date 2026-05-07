"""Shared type definitions for collection seeding."""

from typing import TypedDict


class FilterObject(TypedDict, total=False):
    aminoAcidMutations: list[str]
    nucleotideMutations: list[str]


class Variant(TypedDict):
    type: str
    name: str
    filterObject: FilterObject


class Collection(TypedDict):
    name: str
    organism: str
    description: str
    variants: list[Variant]


class ExistingCollection(TypedDict):
    """A collection as returned by the backend (includes the assigned id)."""
    id: int
    name: str
