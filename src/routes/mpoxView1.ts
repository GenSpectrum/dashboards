export namespace MpoxView1 {
    export const organism = 'mpox' as const;
    export const pathname = `/${organism}/single-variant` as const;
    export type Pathname = typeof pathname;

    export type Route = {
        organism: typeof organism;
        pathname: Pathname;
    };

    export const toUrl = (route: Route): string => {
        const search = new URLSearchParams();
        // TODO
        return `${pathname}?${search}`;
    };

    export const parseUrl = (url: URL): Route | undefined => {
        // TODO
        return {
            organism,
            pathname,
        };
    };
}
