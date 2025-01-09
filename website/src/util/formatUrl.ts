export function formatUrl(pathname: string, searchParams: URLSearchParams) {
    const searchParamsString = searchParams.toString();
    return `${pathname}${searchParamsString === '' ? '' : `?${searchParamsString}&`}`;
}
