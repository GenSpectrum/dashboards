import { type FC, type PropsWithChildren } from 'react';

import { ComponentHeadline, type ComponentHeadlineProps } from './ComponentHeadline';

export type ComponentWrapperProps = PropsWithChildren<
    {
        height?: string;
    } & ComponentHeadlineProps
>;

export const ComponentWrapper: FC<ComponentWrapperProps> = ({
    title,
    height,
    collapsible = false,
    linkSuffix,
    children,
}) => {
    if (collapsible) {
        return (
            <details>
                <summary className='cursor-pointer font-bold'>
                    <ComponentHeadline title={title} collapsible={collapsible} />
                </summary>
                <div style={{ height }}>{children}</div>
            </details>
        );
    }

    return (
        <div>
            <ComponentHeadline title={title} linkSuffix={linkSuffix} collapsible={collapsible} />
            <div style={{ height }}>{children}</div>
        </div>
    );
};
