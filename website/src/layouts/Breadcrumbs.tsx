export type BreadcrumbElement = {
    name: string;
    href?: string;
};

export const defaultBreadcrumbs: BreadcrumbElement[] = [{ name: 'Home', href: '/' }];

export function Breadcrumbs({ breadcrumbs }: { breadcrumbs: BreadcrumbElement[] }) {
    return (
        <div className='breadcrumbs text-xs'>
            <ol>
                {breadcrumbs.map((breadcrumb, index) => (
                    <li key={index}>
                        {breadcrumb.href !== undefined ? (
                            <a href={breadcrumb.href}>{breadcrumb.name}</a>
                        ) : (
                            <span>{breadcrumb.name}</span>
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
}
