import type { PageStateHandler } from '../../../views/pageStateHandlers/PageStateHandler.ts';
import type { ReportKind, ReportRef } from '../../domain/reports.ts';
import { forAddress, forKind, parseParams, referenceOf, searchOf, type ReportParams } from '../reportAddress.ts';
import { addressOf, KIND_PATHS } from '../reportKinds.ts';

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
