import type { WithClassName } from '../../types/WithClassName.ts';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

export function ApplyFilterButton<PageState extends object>({
    pageStateHandler,
    newPageState,
    className,
}: WithClassName<{
    pageStateHandler: PageStateHandler<PageState>;
    newPageState: PageState;
}>) {
    return (
        <a role='button' className={`btn btn-primary ${className}`} href={pageStateHandler.toUrl(newPageState)}>
            Apply filters
        </a>
    );
}
