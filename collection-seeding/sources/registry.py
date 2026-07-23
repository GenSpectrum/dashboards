"""Registry of all available seeding sources.

To add a new source, import it here and add it to ALL_SOURCES. This is the only
place that needs to change — seed.py discovers sources exclusively through this list.
"""

from sources.covid_pango_lineages import (
    CovidPangoLineagesSource,
    CovidPangoLineagesSampleSource,
)
from sources.covid_resistance_mutations import CovidResistanceMutationsSource
from sources.influenza_resistance_mutations import (
    InfluenzaH1N1ResistanceMutationsSource,
    InfluenzaH3N2ResistanceMutationsSource,
    InfluenzaH5N1ResistanceMutationsSource,
    InfluenzaVictoriaResistanceMutationsSource,
)
from sources.rsv_resistance_mutations import (
    RsvAResistanceMutationsSource,
    RsvBResistanceMutationsSource,
)
from sources.rsv_nextclade_lineages import (
    RsvANextcladeLineagesSource,
    RsvBNextcladeLineagesSource,
)
from sources import Source

ALL_SOURCES: list[type[Source]] = [
    CovidResistanceMutationsSource,
    RsvAResistanceMutationsSource,
    RsvBResistanceMutationsSource,
    InfluenzaH1N1ResistanceMutationsSource,
    InfluenzaH3N2ResistanceMutationsSource,
    InfluenzaH5N1ResistanceMutationsSource,
    InfluenzaVictoriaResistanceMutationsSource,
    RsvANextcladeLineagesSource,
    RsvBNextcladeLineagesSource,
    CovidPangoLineagesSource,
    CovidPangoLineagesSampleSource,
]
