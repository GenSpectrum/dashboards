from models import Collection
from sources import Source


class PlaceholderSource(Source):
    """Three placeholder collections that occupy IDs 1-3 so that subsequently seeded
    collections receive the IDs expected by hardcoded config (e.g. wastewaterConfig.ts)."""

    name = "placeholder"
    organism = "covid"
    owned_tag = "#placeholder"

    def get_collections(self) -> list[Collection]:
        return [
            {"name": f"Placeholder {i} #placeholder", "organism": "covid", "description": "", "variants": []}
            for i in range(1, 4)
        ]
