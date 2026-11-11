import type { Dispatch, SetStateAction } from 'react';

import type { WithClassName } from '../../types/WithClassName.ts';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

// Most browsers support at least 2000 characters, but we use a conservative limit
// to ensure compatibility across browsers and web servers
const MAX_URL_LENGTH = 2000;

export function ApplyFilterButton<PageState extends object>({
    pageStateHandler,
    newPageState,
    setPageState,
    className = '',
    disabled = false,
}: WithClassName<{
    pageStateHandler: PageStateHandler<PageState>;
    newPageState: PageState;
    setPageState: Dispatch<SetStateAction<PageState>>;
    disabled?: boolean;
}>) {
    const url = pageStateHandler.toUrl(newPageState);
    const fullUrl = `${window.location.origin}${url}`;
    const urlTooLong = fullUrl.length > MAX_URL_LENGTH;

    const applyFilters = () => {
        setPageState(newPageState);
    };

    if (urlTooLong) {
        return (
            <>
                <span role='button' className={`btn btn-primary btn-disabled ${className}`}>
                    Apply filters
                </span>
                <div className='alert alert-error mt-2'>
                    <span>
                        The URL is too long ({fullUrl.length} characters, maximum {MAX_URL_LENGTH}). Please reduce the
                        amount of data in the filters.
                    </span>
                </div>
            </>
        );
    }

    return disabled ? (
        <span role='button' className={`btn btn-primary btn-disabled ${className}`}>
            Apply filters
        </span>
    ) : (
        <button type='button' onClick={applyFilters} className={`btn btn-primary ${className}`}>
            Apply filters
        </button>
    );
}
