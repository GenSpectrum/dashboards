import type { FC } from 'react';

export type CollectionInfoProps = {
    collectionId: number;
    collectionTitle: string;
    invalidVariants?: {
        name: string;
        error: string;
    }[];
};

/**
 * Info component that displays collection metadata and any invalid variants.
 */
export const CollectionInfo: FC<CollectionInfoProps> = ({ collectionId, collectionTitle, invalidVariants }) => {
    return (
        <div className='flex min-w-[180px] flex-col gap-4 rounded-md border-2 border-gray-100 sm:flex-row'>
            {/* Collection Link Stat */}
            <div className='stat content-start'>
                <div className='stat-title'>Collection</div>
                <div className='stat-value text-base'>
                    View{' '}
                    <a
                        href={`https://cov-spectrum.org/collections/${collectionId}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='link'
                    >
                        {collectionTitle}
                    </a>{' '}
                    on CoV-Spectrum
                </div>
                <div className='stat-desc text-wrap'>{collectionTitle}</div>
            </div>

            {/* Invalid Variants Stat (conditional) */}
            {invalidVariants && invalidVariants.length > 0 && (
                <div className='stat'>
                    <div className='stat-title'>Invalid Variants</div>
                    <div className='stat-value text-base'>
                        <span className='rounded bg-yellow-200 px-1 py-0.5'>{invalidVariants.length}</span>
                    </div>
                    <div className='stat-desc text-wrap'>
                        <ul className='mt-1 list-inside list-disc space-y-1'>
                            {invalidVariants.map((v, i) => (
                                <li key={i}>
                                    <strong>{v.name}</strong>: {v.error}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
