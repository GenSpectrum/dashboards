import type { FC, ReactNode } from 'react';

import { REPORT_KIND, type ReportKind } from '../../../pathoplexusExplorer/domain/reports.ts';
import { SERIES_COLORS } from '../charts/colors.ts';

const INK = '#57534e';
const HIGHLIGHT = SERIES_COLORS[0];

export const KindIcon: FC<{ kind: ReportKind }> = ({ kind }) => (
    <svg
        viewBox='0 0 48 48'
        aria-hidden
        className='size-11 shrink-0'
        fill='none'
        stroke={INK}
        strokeWidth={1.6}
        strokeLinecap='round'
    >
        {ICONS[kind]}
    </svg>
);

const GLOBE = (
    <>
        <circle cx={24} cy={24} r={16} />
        <ellipse cx={24} cy={24} rx={7.5} ry={16} />
        <line x1={24} y1={8} x2={24} y2={40} />
        <line x1={8} y1={24} x2={40} y2={24} />
        <line x1={10.1} y1={16} x2={37.9} y2={16} />
        <line x1={10.1} y1={32} x2={37.9} y2={32} />
    </>
);

const SPIKES = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6;
    const at = (radius: number) => [24 + radius * Math.cos(angle), 24 + radius * Math.sin(angle)] as const;
    const [x1, y1] = at(10.5);
    const [x2, y2] = at(14.5);
    return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />;
});

const VIRUS = (
    <>
        <circle cx={24} cy={24} r={10.5} />
        {SPIKES}
        <circle cx={21} cy={22} r={2.2} />
        <circle cx={27.5} cy={26.5} r={2.8} />
    </>
);

const TREE = (
    <>
        <path d='M8 24h6' />
        <path d='M14 14v20' />
        <path d='M14 34h8' />
        <path d='M22 29v10' />
        <path d='M22 29h12' />
        <path d='M22 39h18' />
        <g stroke={HIGHLIGHT} strokeWidth={2.4}>
            <path d='M14 14h8' />
            <path d='M22 9v10' />
            <path d='M22 9h18' />
            <path d='M22 19h12' />
        </g>
    </>
);

const WAVE_FROM = 7;
const WAVE_TO = 41;

function strandAt(x: number): { y: number } {
    return { y: 24 - 9 * Math.sin(((x - WAVE_FROM) * 2 * Math.PI) / 34) };
}

const BACKBONE = Array.from({ length: WAVE_TO - WAVE_FROM + 1 }, (_, step) => {
    const x = WAVE_FROM + step;
    return `${step === 0 ? 'M' : 'L'}${x} ${strandAt(x).y.toFixed(2)}`;
}).join(' ');

const POSITIONS = [8, 15, 22, 29, 36];
const CARRIED = 22;

const STRAND = (
    <>
        <path d={BACKBONE} strokeWidth={2.2} />
        {POSITIONS.map((x) => (
            <circle key={x} cx={x} cy={strandAt(x).y} r={2.3} fill='#ffffff' />
        ))}
        <circle cx={CARRIED} cy={strandAt(CARRIED).y} r={5.6} stroke={HIGHLIGHT} strokeWidth={1.5} />
        <circle cx={CARRIED} cy={strandAt(CARRIED).y} r={3.2} fill={HIGHLIGHT} stroke={HIGHLIGHT} />
    </>
);

const ICONS: Readonly<Record<ReportKind, ReactNode>> = {
    [REPORT_KIND.location]: GLOBE,
    [REPORT_KIND.virus]: VIRUS,
    [REPORT_KIND.lineage]: TREE,
    [REPORT_KIND.mutations]: STRAND,
};
