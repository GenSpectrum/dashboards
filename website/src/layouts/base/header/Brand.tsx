export function Brand() {
    return (
        <div className='my-8 flex items-center'>
            <a href='/' className='flex'>
                <img className='ml-4 mr-2' src='/virus-outline-colorful.svg' alt='icon' width='20' height='20' />
                <BrandName />
            </a>
        </div>
    );
}

type BrandNameProps = {
    fontsize?: string;
};

export function BrandName({ fontsize = 'font-bold' }: BrandNameProps) {
    return (
        <div className='ml-2'>
            Gen<span className={`${fontsize} text-indigo`}>S</span>
            <span className={`${fontsize} text-cyan`}>p</span>
            <span className={`${fontsize} text-teal`}>e</span>
            <span className={`${fontsize} text-green`}>c</span>
            <span className={`${fontsize} text-sand`}>t</span>
            <span className={`${fontsize} text-rose`}>r</span>
            <span className={`${fontsize} text-wine`}>u</span>
            <span className={`${fontsize} text-purple`}>m</span>
        </div>
    );
}
