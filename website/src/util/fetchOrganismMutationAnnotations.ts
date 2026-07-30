import type { MutationAnnotations } from '@genspectrum/dashboard-components/util';

import { BackendService } from '../backendApi/backendService.ts';
import { getBackendHost } from '../config';
import { getInstanceLogger } from '../logger.ts';
import { getErrorLogMessage } from './getErrorLogMessage';
import { fetchMutationAnnotationsFromCollections } from './resistanceMutations';
import { getDbIdSpace } from '../types/dbIdSpace';
import type { OrganismConstants } from '../views/OrganismConstants';

const logger = getInstanceLogger('fetchOrganismMutationAnnotations');

export async function fetchOrganismMutationAnnotations(
    constants: OrganismConstants,
    organism: string,
): Promise<MutationAnnotations | undefined> {
    const buildCollections = constants.buildResistanceMutationCollections;
    if (!buildCollections) {
        return undefined;
    }
    try {
        return await fetchMutationAnnotationsFromCollections(
            buildCollections(getDbIdSpace()),
            new BackendService(getBackendHost()),
        );
    } catch (error) {
        logger.error(`Failed to fetch resistance mutation annotations for ${organism}: ${getErrorLogMessage(error)}`);
        return undefined;
    }
}
