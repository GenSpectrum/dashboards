export function Brand({ name }: { name: string }) {
    return (
        <div className='my-8 flex items-center'>
            <a href='/'>
                <img className='ml-4 mr-2' src='/favicon_thicker.svg' alt='icon' />
            </a>
            <a href='/' className='ml-2 font-bold'>
                {name}
            </a>
        </div>
    );
}
