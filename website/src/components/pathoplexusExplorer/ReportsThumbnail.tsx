import type { FC } from 'react';

import { SERIES_COLORS } from './ui/colors.ts';

const INK = '#44403b';
const PAPER = '#ffffff';
const RULE = '#d7d3cd';

export const ReportsThumbnail: FC = () => {
    const bars = [16, 27, 21, 32, 24, 13];
    return (
        <svg viewBox='0 0 200 110' aria-hidden className='h-full w-full' preserveAspectRatio='xMidYMid slice'>
            <rect x={56} y={6} width={88} height={98} fill={PAPER} stroke={RULE} />
            <rect x={64} y={14} width={48} height={5} fill={INK} />
            <rect x={64} y={23} width={72} height={2} fill={RULE} />
            <rect x={64} y={28} width={60} height={2} fill={RULE} />
            <rect x={64} y={36} width={72} height={1} fill={RULE} />
            {bars.map((value, index) => (
                <rect
                    key={index}
                    x={64 + index * 12}
                    y={74 - value}
                    width={9}
                    height={value}
                    fill={SERIES_COLORS[0]}
                    opacity={0.85}
                />
            ))}
            <line x1={64} y1={74} x2={136} y2={74} stroke={INK} strokeWidth={0.8} />
            <rect x={64} y={82} width={72} height={2} fill={RULE} />
            <rect x={64} y={87} width={56} height={2} fill={RULE} />
            <rect x={64} y={92} width={64} height={2} fill={RULE} />
        </svg>
    );
};
