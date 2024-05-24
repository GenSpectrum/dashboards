export namespace View2 {
    export const pathname = '/covid/compare-side-by-side';

    export type Route = {
        route: 'view2';
    };

    export const parseUrl = (url: URL): Route | undefined => {
        return {
            route: 'view2',
        };
    };

    export const toUrl = (route: Route): string => {
        return '';
    };
}
