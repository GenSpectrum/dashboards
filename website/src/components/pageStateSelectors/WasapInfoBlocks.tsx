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
        <InfoBlock title='How it works'>
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

export function JaccardIndexInfo() {
    return (
        <InfoBlock title='Jaccard Index'>
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

export function MinProportionInfo() {
    return (
        <InfoBlock title='Minimum Proportion'>
            <p className='text-gray-700'>
                The minimum proportion threshold filters mutations based on their frequency within the selected variant.
            </p>
            <p className='mt-2 text-gray-700'>
                Only mutations that appear in at least this proportion of sequences belonging to the variant will be
                included. For example, a value of 0.05 means the mutation must appear in at least 5% of the variant's
                sequences.
            </p>
        </InfoBlock>
    );
}

export function MinCountInfo() {
    return (
        <InfoBlock title='Minimum Overall Count'>
            <p className='text-gray-700'>
                The minimum count threshold filters mutations based on their total occurrence across all sequences in
                the dataset, not just within the selected variant. Only mutations that appear in at least this many
                sequences overall will be included.
            </p>
        </InfoBlock>
    );
}

export function ExplorationModeInfo() {
    return (
        <InfoBlock title='Exploration modes'>
            <p className='mb-4 text-gray-700'>
                These exploration views allow visualising the mutations found in the recent past by:
            </p>
            <ul className='mb-4 list-inside list-disc space-y-2 text-gray-700'>
                <li>
                    <span className='font-semibold text-gray-900'>Resistance Mutations:</span> lookup of mutations known
                    to confer resistance to antiviral drugs
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Untracked Mutations:</span> novel mutations not yet
                    attributed to major variants
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Manual:</span> explore freely, using the filters on
                    the plot, i.e., search by minimal proportion
                </li>
                <li>
                    <span className='font-semibold text-gray-900'>Variant Explorer:</span> track variant-specific
                    mutations over time
                </li>
            </ul>

            <p className='text-gray-700'>
                The visualized data consists of aligned sequencing reads from virus-specific next-generation sequencing,
                displayed in both nucleotide and amino acid formats.
            </p>
        </InfoBlock>
    );
}
