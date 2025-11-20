/**
 * A text block to be put into a Modal as helper information for labeled filter fields.
 */
function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className='relative p-8'>
            <form method='dialog'>
                <button className='btn btn-sm btn-circle btn-ghost absolute top-2 right-2'>✕</button>
            </form>
            <h1 className='mb-2 text-xl font-semibold'>{title}</h1>
            {children}
        </div>
    );
}

export function KnownVariantsExclusionInfo() {
    return (
        <InfoBlock title='How It Works'>
            <p className='text-gray-700'>
                Mutations that are characteristic of selected lineages are excluded based on clinical sequences on{' '}
                <a className='link' href='https://cov-spectrum.org/'>
                    CovSpectrum
                </a>
                .
            </p>
            <p className='text-gray-700'>
                For each lineage, mutations appearing in sequences assigned to this lineage are excluded if two criteria
                are met. First, the mutation appears in at least 9 sequences; second, it appears in at least 80 % of
                sequences assigned to that lineage. This is an empirical definition of characteristic mutations. For
                each lineage, mutations appearing at least 9 times and in ≥80% of its samples are excluded.
            </p>
        </InfoBlock>
    );
}

export function DefineClinicalSignatureInfo() {
    return (
        <InfoBlock title='Define Variant Signature based on Clinical Sequences from CovSpectrum'>
            <p className='text-gray-700'>
                Fetch characteristic mutations from clinical sequences assigned a given variant.
            </p>
            <p className='mt-2 text-gray-700'>
                Enter a{' '}
                <a className='link' href='https://cov-spectrum.org/'>
                    CovSpectrum
                </a>{' '}
                variant query to filter for a given Pango variant (e.g. "BA.5").
            </p>

            <h2 className='mt-4 mb-2 text-base font-semibold'>Minimum Proportion</h2>
            <p className='text-gray-700'>
                The minimum proportion threshold filters mutations based on their frequency within the selected variant.
            </p>
            <p className='mt-2 text-gray-700'>
                Only mutations that appear in at least this proportion of sequences belonging to the variant will be
                included. For example, a value of 0.8 means the mutation must appear in at least 80% of the variant's
                sequences.
            </p>

            <h2 className='mt-4 mb-2 text-base font-semibold'>Minimum Count</h2>
            <p className='text-gray-700'>
                The minimum count threshold filters mutations based on their occurrence across clinical sequences
                assigned to a selected variant. Only mutations that appear in at least this many clinical sequences of
                the selected variant will be included.
            </p>

            <h2 className='mt-4 mb-2 text-base font-semibold'>Jaccard Index</h2>
            <p className='text-gray-700'>
                The Jaccard index measures how specific a mutation is to a variant. It represents the overlap between
                sequences with the mutation and sequences of the variant.
            </p>
            <p className='mt-2 text-gray-700'>
                A value of 1.0 means the mutation appears exclusively in that variant. Lower values indicate the
                mutation also appears in other variants. The threshold filters mutations by their variant specificity.
            </p>
        </InfoBlock>
    );
}

export function ExplorationModeInfo() {
    return (
        <InfoBlock title='Exploration Modes'>
            <p className='mb-4 text-gray-700'>
                These exploration views allow visualising the mutations found in the recent past by:
            </p>
            <ul className='mb-4 list-inside list-disc space-y-2 text-gray-700'>
                <li>
                    <span className='font-semibold text-gray-900'>Manual:</span> explore freely, using the filters on
                    the plot, i.e., search by minimal proportion.
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Resistance Mutations:</span> lookup of mutations known
                    to confer resistance to antiviral drugs.
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Variant Explorer:</span> track variant-specific
                    mutations over time. Variant-specific mutations are computed based on user parameters and filtering
                    clinical sequences from{' '}
                    <a className='link' href='https://cov-spectrum.org'>
                        CovSpectrum
                    </a>
                    .
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Untracked Mutations:</span> novel mutations not yet
                    attributed to major variants. Variant-specific mutations are computed from clinical sequences from{' '}
                    <a className='link' href='https://cov-spectrum.org'>
                        CovSpectrum
                    </a>
                    .
                </li>
            </ul>

            <p className='text-gray-700'>
                The visualized data consists of aligned sequencing reads from virus-specific next-generation sequencing,
                displayed in both nucleotide and amino acid formats.
            </p>

            <h2 className='mt-4 mb-2 text-base font-semibold'>Subsampling Strategy</h2>
            <p className='text-gray-700'>
                Wastewater surveillance processes samples with highly variable read depths. To ensure consistent
                performance, we cap amplicon sequences at 4.5 million reads per sample through random subsampling,
                preserving Variant Allele Frequency and Haplotype Structure for reliable and predictable operations.
            </p>

            <h2 className='mt-4 mb-2 text-base font-semibold'>Alignment</h2>
            <p className='text-gray-700'>
                Align reads to reference genome{' '}
                <a className='link' href='https://www.ncbi.nlm.nih.gov/nuccore/1798174254'>
                    Wuhan-Hu-1, NC_045512.2
                </a>{' '}
                using{' '}
                <a className='link' href='https://github.com/lh3/bwa?rgh-link-date=2025-11-11T16%3A12%3A21.000Z'>
                    BWA
                </a>{' '}
                (Nucleotides) and{' '}
                <a
                    className='link'
                    href='https://github.com/bbuchfink/diamond?rgh-link-date=2025-11-11T16%3A12%3A21.000Z'
                >
                    DIAMOND
                </a>{' '}
                (Amino acids).
            </p>

            <p className='mt-2 text-gray-700'>
                For the full data for download, visit{' '}
                <a className='link' href='https://db.wasap.genspectrum.org'>
                    db.wasap.genspectrum.org
                </a>
                .
            </p>
        </InfoBlock>
    );
}
