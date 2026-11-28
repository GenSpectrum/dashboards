import type { FC } from 'react';

import { SEQUENTIAL } from './ui/colors.ts';

const RULE = '#d7d3cd';
const PAPER = '#ffffff';
const GROUND = '#f6f5f2';

export const MatrixThumbnail: FC = () => {
    const cells = [
        [7, 5, 3, 1, 0],
        [4, 6, 2, 3, 1],
        [2, 3, 6, 1, 4],
        [1, 2, 0, 5, 2],
        [3, 1, 2, 0, 6],
        [0, 2, 1, 3, 2],
    ];
    return (
        <svg viewBox='0 0 200 110' aria-hidden className='h-full w-full' preserveAspectRatio='xMidYMid slice'>
            <rect x={0} y={0} width={200} height={110} fill={PAPER} />
            <rect x={54} y={8} width={32} height={94} fill={GROUND} stroke={RULE} />
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
                <rect key={row} x={58} y={14 + row * 13} width={24 - (row % 3) * 5} height={4} fill={SEQUENTIAL[1]} />
            ))}
            {[0, 1, 2, 3, 4].map((column) => (
                <rect key={column} x={94 + column * 12} y={8} width={8} height={3} fill={RULE} />
            ))}
            {cells.map((row, rowIndex) =>
                row.map((value, columnIndex) => (
                    <rect
                        key={`${rowIndex}-${columnIndex}`}
                        x={94 + columnIndex * 12}
                        y={15 + rowIndex * 14}
                        width={11}
                        height={13}
                        fill={value === 0 ? GROUND : SEQUENTIAL[value]}
                    />
                )),
            )}
            {[0, 1, 2, 3, 4].map((column) => (
                <rect key={column} x={94 + column * 12} y={101} width={11} height={3} fill={RULE} />
            ))}
        </svg>
    );
};
