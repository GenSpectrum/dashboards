import type { FC, ReactNode } from 'react';

type TooltipProps = { x: number; y: number; width: number; children: ReactNode };

export const Tooltip: FC<TooltipProps> = ({ x, y, width, children }) => {
    const left = x + 16 + 240 > width ? Math.max(0, x - 16 - 240) : x + 16;
    return (
        <div
            role='tooltip'
            className='pointer-events-none absolute z-20 w-60 border border-stone-300 bg-white p-2 text-xs shadow-sm'
            style={{ left, top: Math.max(0, y - 10) }}
        >
            {children}
        </div>
    );
};
