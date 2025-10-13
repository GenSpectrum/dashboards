import type { WithClassName } from '../../types/WithClassName.ts';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

// Most browsers support at least 2000 characters, but we use a conservative limit
// to ensure compatibility across browsers and web servers
const MAX_URL_LENGTH = 2000;

export function ApplyFilterButton<PageState extends object>({
    pageStateHandler,
    newPageState,
    className = '',
}: WithClassName<{
    pageStateHandler: PageStateHandler<PageState>;
    newPageState: PageState;
}>) {
    const url = pageStateHandler.toUrl(newPageState);
    const fullUrl = `${window.location.origin}${url}`;
    const urlTooLong = fullUrl.length > MAX_URL_LENGTH;

    const handleClick = () => {
        if (urlTooLong) {
            return;
        }
        window.location.href = url;
    };

    return (
        <>
            <button className={`btn btn-primary ${className}`} onClick={handleClick} disabled={urlTooLong}>
                Apply filters
            </button>
            {urlTooLong && (
                <div className='alert alert-error mt-2'>
                    <span>
                        The URL is too long ({fullUrl.length} characters, maximum {MAX_URL_LENGTH}). Please reduce the
                        amount of data in the filters.
                    </span>
                </div>
            )}
        </>
    );
}
