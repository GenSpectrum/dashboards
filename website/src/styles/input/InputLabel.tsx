import { type ReactNode } from 'react';

interface InputLabelProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
}

export function InputLabel({ children, className, title, description }: InputLabelProps) {
    return (
        <label className={`w-full ${className || ''}`}>
            <div className='mb-2'>{title}</div>
            <p className='mb-2 max-w-xl text-sm text-gray-400'>{description}</p>
            {children}
        </label>
    );
}
