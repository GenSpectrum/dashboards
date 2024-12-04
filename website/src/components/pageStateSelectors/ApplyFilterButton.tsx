import type { WithClassName } from '../../types/WithClassName.ts';
import type { PageStateHandler } from '../../views/PageStateHandler.ts';

export function ApplyFilterButton<PageState extends object, StateHandler extends PageStateHandler<PageState>>({
    pageStateHandler,
    newPageState,
    className,
}: WithClassName<{
    pageStateHandler: StateHandler;
    newPageState: PageState;
}>) {
    return (
        <a role='button' className={`btn btn-primary ${className}`} href={pageStateHandler.toUrl(newPageState)}>
            Apply filters
        </a>
    );
}
