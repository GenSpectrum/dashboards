from abc import ABC, abstractmethod

from models import Collection


class Source(ABC):
    name: str

    @abstractmethod
    def get_collections(self) -> list[Collection]:
        ...
