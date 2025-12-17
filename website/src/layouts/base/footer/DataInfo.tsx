import { type FC, type PropsWithChildren } from 'react';

import { externalLinkIconCss } from '../../../components/iconCss.ts';
import { type DataOrigin, dataOriginConfig } from '../../../types/dataOrigins';

export type DataInfoProps = {
    dataOrigins: DataOrigin[];
};

export const DataInfo: FC<DataInfoProps> = ({ dataOrigins }) => {
    return (
        <div className='flex justify-center'>
            <div className='p-2 text-xs'>
                Enabled by data from:
                {dataOrigins.map((dataOrigin, index) => (
                    <span key={dataOrigin}>
                        {index > 0 && (index === dataOrigins.length - 1 ? ' and ' : ', ')}
                        <DataOriginLink href={dataOriginConfig[dataOrigin].href}>
                            {dataOriginConfig[dataOrigin].name}
                        </DataOriginLink>
                    </span>
                ))}
            </div>
        </div>
    );
};

type DataOriginLinkProps = PropsWithChildren<{
    href: string;
}>;

const DataOriginLink: FC<DataOriginLinkProps> = ({ href, children }) => {
    return (
        <a className={externalLinkIconCss} href={href}>
            <span className='underline'>{children}</span>
        </a>
    );
};
