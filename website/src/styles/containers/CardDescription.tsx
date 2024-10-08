import { type ReactNode } from 'react';

export function CardDescription({
    title,
    subtitle,
    icon,
}: {
    title: string;
    subtitle?: string;
    icon?: string | ReactNode;
}) {
    return (
        <div className='flex items-center gap-2'>
            <Icon icon={icon} />
            <Headline title={title} subtitle={subtitle} />
        </div>
    );
}

function Icon({ icon }: { icon?: string | ReactNode }) {
    if (icon === undefined) {
        return null;
    }

    return typeof icon === 'string' ? <div className={`iconify size-12 ${icon}`} /> : icon;
}

function Headline({ title, subtitle }: { title: string; subtitle?: string }) {
    if (subtitle === undefined) {
        return <Title title={title} />;
    }

    return (
        <div className='flex flex-col'>
            <Title title={title} />
            <div className='text-gray-400'>{subtitle}</div>
        </div>
    );
}

function Title({ title }: { title: string }) {
    return <div className='font-bold'>{title}</div>;
}
