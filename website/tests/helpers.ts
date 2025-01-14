import { allOrganisms } from '../src/types/Organism.ts';
import type { OrganismWithViewKey } from '../src/views/routing.ts';
import { ServerSide } from '../src/views/serverSideRouting.ts';

export function organismsWithView<ViewKey extends string>(viewKey: ViewKey): OrganismWithViewKey<ViewKey>[] {
    return allOrganisms.filter((organism) => ServerSide.routing.isOrganismWithViewKey(organism, viewKey));
}
