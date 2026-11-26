import type { FC } from 'react';

import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import { formatCount } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';

type CitationProps = { reference: ReportRef; entries: ReportEntries };

/** Show the data use terms and accession list for all entries used by the report. */
export const Citation: FC<CitationProps> = ({ reference, entries }) => {
    const terms = entries.terms.data;
    const href = `${window.location.origin}${hrefOf(reference)}`;
    return (
        <>
            {' '}
            {terms !== undefined && <Terms records={terms.total} restricted={terms.restricted} />}
            The list of accessions can be downloaded from{' '}
            <a href={href} className='break-all underline underline-offset-2'>
                {href}
            </a>
            .
        </>
    );
};

type TermsProps = { records: number; restricted: number };

const Terms: FC<TermsProps> = ({ records, restricted }) => {
    return (
        <>
            {formatCount(records - restricted)} of {formatCount(records)} sequences are under the Open Use Terms,{' '}
            {formatCount(restricted)} are under the Restricted-Use Terms.{' '}
        </>
    );
};
