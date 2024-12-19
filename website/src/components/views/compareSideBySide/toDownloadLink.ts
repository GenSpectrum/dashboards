import type { Organism } from '../../../types/Organism.ts';
import type { DatasetAndVariantData, Id } from '../../../views/View.ts';
import type { CompareSideBySideStateHandler } from '../../../views/pageStateHandlers/CompareSideBySidePageStateHandler.ts';
import { toDisplayName } from '../../../views/pageStateHandlers/PageStateHandler.ts';

export function toDownloadLink(pageStateHandler: CompareSideBySideStateHandler, organism: Organism) {
    return ([id, { variantFilter, datasetFilter }]: [Id, DatasetAndVariantData]) => {
        const filter = pageStateHandler.variantFilterToLapisFilter(datasetFilter, variantFilter);
        const displayName = toDisplayName(variantFilter);
        const variantName = displayName.length > 0 ? displayName : `variant ${id + 1}`;

        return {
            label: `Download accessions of "${variantName}"`,
            filter,
            downloadFileBasename: `${organism}_${sanitizeForFilename(displayName)}_accessions`,
        };
    };
}

export function sanitizeForFilename(variantName: string) {
    return variantName.replaceAll(/[*\s]/g, '').replaceAll(/[+:]/g, '_');
}
