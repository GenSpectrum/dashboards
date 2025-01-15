import {type PropsWithChildren, useState} from 'react';

export function Expandable({ children, maxHeightBeforeExpand }: PropsWithChildren<{maxHeightBeforeExpand: string}>) {
    const [openLarge, setOpenLarge] = useState(false);

    return (
        <div>
            <div className={`overflow-y-scroll ${openLarge ? '' : maxHeightBeforeExpand} rounded-md pb-2`}>
                {children}
            </div>

            <button className='px-2' onClick={() => setOpenLarge(!openLarge)}>
                {openLarge ? (
                    <>
                        <span className='iconify mdi--keyboard-arrow-up'></span>
                        <span className='text-sm text-gray-500'>Collapse</span>
                    </>
                ) : (
                    <>
                        <span className='iconify mdi--keyboard-arrow-down'></span>
                        <span className='text-sm text-gray-500'>Expand</span>
                    </>
                )}
            </button>
        </div>
    );
}
