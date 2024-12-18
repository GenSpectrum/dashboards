import type { LapisFilter } from '@genspectrum/dashboard-components/util';

export function assembleDownloadUrl(
    accessionDownloadFields: string[],
    filter: LapisFilter,
    downloadFileBasename: string,
    lapisUrl: string,
) {
    const urlSearchParams = new URLSearchParams();
    for (const accessionField of accessionDownloadFields) {
        urlSearchParams.append('fields', accessionField);
    }
    urlSearchParams.set('dataFormat', 'tsv');
    urlSearchParams.set('downloadAsFile', 'true');
    urlSearchParams.set('downloadFileBasename', downloadFileBasename);
    addLapisFilters(urlSearchParams, filter);

    const url = new URL(lapisUrl);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/sample/details`;
    url.search = urlSearchParams.toString();

    return url.toString();
}

function addLapisFilters(urlSearchParams: URLSearchParams, filter: LapisFilter) {
    for (const key in filter) {
        const value = filter[key];
        if (value === undefined || value === null) {
            continue;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                urlSearchParams.append(key, item);
            }
        } else {
            urlSearchParams.append(key, `${value}`);
        }
    }
}
