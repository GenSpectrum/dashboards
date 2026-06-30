from abc import ABC, abstractmethod

from models import Collection


class Source(ABC):
    """A data source that produces collections to be seeded into the backend.

    Implement this to add a new source: set a unique `name` (used as the --source flag value),
    an `organism`, an `owned_tag` (added as a real tag to each collection and used to identify
    orphaned collections for deletion), and implement `get_collections` to return the collections
    to upsert. Then register it in sources/registry.py.

    Set `include_in_default_run = False` for sources that should only be used via --source
    (e.g. demo/sample sources that overlap with a full source).
    """

    include_in_default_run: bool = True

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def organism(self) -> str: ...

    @property
    @abstractmethod
    def owned_tag(self) -> str: ...

    @abstractmethod
    def get_collections(self) -> list[Collection]: ...
