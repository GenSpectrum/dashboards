export function Brand({ name }: { name: string }) {
    return (
        <a className='ml-2 font-bold' href='/'>
            {name}
        </a>
    );
}
