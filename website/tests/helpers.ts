import { allOrganisms, Organisms } from '../src/types/Organism.ts';
import type { OrganismWithViewKey } from '../src/views/routing.ts';
import { ServerSide } from '../src/views/serverSideRouting.ts';

export function organismsWithView<ViewKey extends string>(viewKey: ViewKey): OrganismWithViewKey<ViewKey>[] {
    return allOrganisms.filter((organism) => ServerSide.routing.isOrganismWithViewKey(organism, viewKey));
}

export const organismOptions = {
    [Organisms.covid]: { lineage: 'JN.1*', lineageFieldPlaceholder: 'Nextclade pango lineage' },
    [Organisms.influenzaA]: { lineage: 'H1', lineageFieldPlaceholder: 'HA subtype' },
    [Organisms.h5n1]: { lineage: '2.3.4.4b', lineageFieldPlaceholder: 'Clade' },
    [Organisms.h1n1pdm]: { lineage: 'C.1.9.3', lineageFieldPlaceholder: 'Clade HA' },
    [Organisms.h3n2]: { lineage: '3C.2a1b', lineageFieldPlaceholder: 'Clade HA' },
    [Organisms.influenzaB]: { lineage: 'vic', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.victoria]: { lineage: 'V1A.3a.2', lineageFieldPlaceholder: 'Clade HA' },
    [Organisms.westNile]: { lineage: '1A', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.rsvA]: { lineage: 'A.D.5.2', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.rsvB]: { lineage: 'B.D.E.1', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.mpox]: { lineage: 'F.1', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.ebolaSudan]: { mutation: 'G5902T' },
    [Organisms.ebolaZaire]: { mutation: 'T18365C' },
    [Organisms.cchf]: { mutation: 'M:G3565A' },
    [Organisms.denv1]: { lineage: '1I_K.1.1', lineageFieldPlaceholder: 'Clade' },
    [Organisms.denv2]: { lineage: '2II_F.1.1', lineageFieldPlaceholder: 'Clade' },
    [Organisms.denv3]: { lineage: '3III_B.3.2', lineageFieldPlaceholder: 'Clade' },
    [Organisms.denv4]: { lineage: '4II_B.1.2', lineageFieldPlaceholder: 'Clade' },
    [Organisms.measles]: { lineage: 'B3', lineageFieldPlaceholder: 'Genotype' },
};
