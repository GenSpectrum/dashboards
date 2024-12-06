export function SequencingEffortsSelectorFallback() {
    return <div className='h-[208px] lg:h-auto'></div>;
}

export function AnalyzeSingleVariantSelectorFallback() {
    return <div className='h-[372px] lg:h-auto'></div>;
}

export function CompareSideBySideSelectorFallback({ numFilters }: { numFilters: number }) {
    return (
        <div>
            {numFilters > 2 && <div className='h-[264px]' />}
            {numFilters <= 2 && <div className='h-[220px]' />}
        </div>
    );
}

export function CompareToBaselineSelectorFallback({ numFilters }: { numFilters: number }) {
    return (
        <>
            <div className='h-[460px] lg:h-auto'></div>
            {Array.from({ length: numFilters }).map((_, index) => (
                <div key={index} className='h-[156px] lg:h-auto'></div>
            ))}
        </>
    );
}

export function CompareVariantsSelectorFallback({ numFilters }: { numFilters: number }) {
    return (
        <>
            <div className='h-[296px] lg:h-auto'></div>
            {Array.from({ length: numFilters }).map((_, index) => (
                <div key={index} className='h-[156px] lg:h-auto'></div>
            ))}
        </>
    );
}
