export function ModalHeader({ title, icon }: { title: string; icon?: string }) {
    return (
        <div className='flex flex-col items-center gap-2 bg-gray-200 p-6'>
            {icon !== undefined && <div className={`iconify size-12 ${icon}`}></div>}
            <h2 className='text-lg font-bold'>{title}</h2>
        </div>
    );
}
