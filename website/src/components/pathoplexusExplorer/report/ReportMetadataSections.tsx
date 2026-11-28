import type { FC } from 'react';

import { Hosts } from './Hosts.tsx';
import { Section } from './Layout.tsx';
import { MetadataAvailability } from './MetadataAvailability.tsx';
import { Submitters } from './Submitters.tsx';
import type { Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import type { ReportMetadata } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';

type ReportMetadataSectionsProps = {
    first: number;
    metadata: ReportMetadata;
    dates: Loadable<readonly RhydbRow[]>;
};

export const ReportMetadataSections: FC<ReportMetadataSectionsProps> = ({ first, metadata, dates }) => (
    <>
        <Section number={first} title='Hosts'>
            <Hosts rows={metadata.hosts} />
        </Section>
        <Section number={first + 1} title='Metadata availability'>
            <MetadataAvailability availability={metadata.availability} dates={dates} />
        </Section>
        <Section number={first + 2} title='Submitters'>
            <Submitters groups={metadata.groups} authors={metadata.authors} affiliations={metadata.affiliations} />
        </Section>
    </>
);
