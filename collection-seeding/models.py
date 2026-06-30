"""Shared type definitions for collection seeding."""

from typing import NotRequired, TypedDict


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
    tags: NotRequired[list[str]]


class ExistingCollection(TypedDict):
    """A collection as returned by the backend (includes the assigned id)."""

    id: int
    name: str
    description: str | None
    tags: NotRequired[list[str]]
