export function Brand({ name }: { name: string }) {
    return (
        <div>
            <a href='/' className='my-8 flex items-center'>
                <img className='ml-4 mr-2' src='/favicon.png' alt='icon' />
                <div className='ml-2 font-bold'>{name}</div>
            </a>
        </div>
    );
}
