import { ServerSide } from '../src/views/serverSideRouting.ts';
import { allOrganisms } from '../src/types/Organism.ts';
import type { OrganismWithViewKey } from '../src/views/routing.ts';

export function organismsWithView<ViewKey extends string>(viewKey: ViewKey): OrganismWithViewKey<ViewKey>[] {
    console.log(process.env);
    return allOrganisms.filter((organism) => ServerSide.routing.isOrganismWithViewKey(organism, viewKey));
}
