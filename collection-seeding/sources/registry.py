"""Registry of all available seeding sources.

To add a new source, import it here and add it to ALL_SOURCES. This is the only
place that needs to change — seed.py discovers sources exclusively through this list.
"""

from sources.pango_lineages import PangoLineagesSource, PangoLineagesSampleSource
from sources.resistance_mutations import ResistanceMutationsSource
from sources import Source

ALL_SOURCES: list[type[Source]] = [
    ResistanceMutationsSource,
    PangoLineagesSource,
    PangoLineagesSampleSource,
]
