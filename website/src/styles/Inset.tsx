import type { WithClassName } from '../types/WithClassName.ts';

export function Inset({ children, className }: WithClassName) {
    return <div className={`rounded-md border-[1px] border-gray-200 shadow-inner ${className}`}>{children}</div>;
}
