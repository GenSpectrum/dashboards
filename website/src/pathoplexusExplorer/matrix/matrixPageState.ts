import { addressOf, parseParams, searchOf, MATRIX_PATH, type MatrixParams } from './address.ts';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

export class MatrixPageStateHandler implements PageStateHandler<MatrixParams> {
    parsePageStateFromUrl(url: URL): MatrixParams {
        return parseParams(url.searchParams);
    }

    toUrl(pageState: MatrixParams): string {
        return addressOf(pageState);
    }

    getDefaultPageUrl(): string {
        return MATRIX_PATH;
    }

    canonicalSearch(pageState: MatrixParams): string {
        return searchOf(pageState).toString();
    }
}
