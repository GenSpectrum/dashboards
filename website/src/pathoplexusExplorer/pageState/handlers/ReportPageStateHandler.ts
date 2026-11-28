import type { PageStateHandler } from '../../../views/pageStateHandlers/PageStateHandler.ts';
import type { ReportKind } from '../../domain/reports.ts';
import { forAddress, forKind, parseParams, searchOf, type ReportParams } from '../reportAddress.ts';
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

    urlForKind(kind: ReportKind, pageState: ReportParams): string {
        return addressOf(kind, searchOf(forKind(kind, pageState)));
    }
}
