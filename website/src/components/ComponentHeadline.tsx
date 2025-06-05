import { type FC } from 'react';

import { fragmentLinkScrollMargin } from '../layouts/base/header/headerConstants';

export type ComponentHeadlineProps = {
    title: string;
} & (
    | {
          collapsible: true;
          linkSuffix?: undefined;
      }
    | {
          linkSuffix?: string;
          collapsible?: false;
      }
);

export const ComponentHeadline: FC<ComponentHeadlineProps> = ({ title, linkSuffix, collapsible }) => {
    if (collapsible) {
        return <h2 className='inline font-bold capitalize'>{title}</h2>;
    }

    const fragmentId = title.toLowerCase().replace(/ /g, '-') + (linkSuffix ? `-${linkSuffix}` : '');

    return (
        <h2 className={`inline font-bold capitalize ${fragmentLinkScrollMargin}`} id={fragmentId}>
            <a href={`#${fragmentId}`} className='group flex items-center gap-1'>
                {title}
                <span className='iconify mdi--link-variant font-normal opacity-0 group-hover:opacity-100' />
            </a>
        </h2>
    );
};
