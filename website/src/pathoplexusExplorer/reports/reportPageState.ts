import { forAddress, forKind, parseParams, referenceOf, searchOf, type ReportParams } from './address.ts';
import { addressOf, KIND_PATHS, type ReportKind, type ReportRef } from './kinds.ts';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

export class ReportPageStateHandler implements PageStateHandler<ReportParams> {
    constructor(private readonly kind: ReportKind) {}

    parsePageStateFromUrl(url: URL): ReportParams {
        return forAddress(this.kind, parseParams(url.searchParams));
    }

    toUrl(pageState: ReportParams): string {
        return addressOf(this.kind, searchOf(pageState));
    }

    getDefaultPageUrl(): string {
        return KIND_PATHS[this.kind];
    }

    referenceOf(pageState: ReportParams): ReportRef | undefined {
        return referenceOf(this.kind, searchOf(pageState));
    }

    urlForKind(kind: ReportKind, pageState: ReportParams): string {
        return new ReportPageStateHandler(kind).toUrl(forKind(kind, pageState));
    }
}
