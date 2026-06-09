"""Registry of all available seeding sources.

To add a new source, import it here and add it to ALL_SOURCES. This is the only
place that needs to change — seed.py discovers sources exclusively through this list.
"""

from sources.covid_pango_lineages import CovidPangoLineagesSource, CovidPangoLineagesSampleSource
from sources.covid_resistance_mutations import CovidResistanceMutationsSource
from sources.rsv_resistance_mutations import RsvAResistanceMutationsSource, RsvBResistanceMutationsSource
from sources import Source

ALL_SOURCES: list[type[Source]] = [
    CovidResistanceMutationsSource,
    RsvAResistanceMutationsSource,
    RsvBResistanceMutationsSource,
    CovidPangoLineagesSource,
    CovidPangoLineagesSampleSource,
]
