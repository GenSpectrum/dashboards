import { type ReactNode } from 'react';

export function BorderedCard({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={`bordered flex flex-col gap-6 rounded-xl border-2 border-gray-200 p-4 ${className || ''}`}>
            {children}
        </div>
    );
}
