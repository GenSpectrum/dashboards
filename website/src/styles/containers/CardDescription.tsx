export function CardDescription({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) {
    const headline = <Headline title={title} subtitle={subtitle} />;

    return (
        <div className='flex items-center gap-2'>
            {icon !== undefined && <div className={`iconify size-12 ${icon}`}></div>}
            {headline}
        </div>
    );
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
