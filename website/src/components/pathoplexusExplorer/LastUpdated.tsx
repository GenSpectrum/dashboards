import { useEffect, useState, type FC } from 'react';

import { connect } from '../../pathoplexusExplorer/dataLayer/transport/connection.ts';
import { formatDataVersion } from '../../pathoplexusExplorer/domain/dataVersion.ts';

type LastUpdatedProps = {
    rhydbUrl: string;
};

export const LastUpdated: FC<LastUpdatedProps> = ({ rhydbUrl }) => {
    const [updated, setUpdated] = useState('Loading…');

    useEffect(() => {
        const controller = new AbortController();
        void connect({ url: rhydbUrl })
            .dataVersion({ signal: controller.signal })
            .then((version) => {
                setUpdated(formatDataVersion(version) ?? 'Unavailable');
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setUpdated('Unavailable');
                }
            });
        return () => controller.abort();
    }, [rhydbUrl]);

    return <p className='mb-5 text-center text-sm text-slate-700'>Last updated: {updated}</p>;
};
