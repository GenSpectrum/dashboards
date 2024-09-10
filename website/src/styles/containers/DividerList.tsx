import { Children, Fragment, type ReactNode } from 'react';

export function DividerList({ children }: { children: ReactNode }) {
    const childrenArray = Children.toArray(children);

    return (
        <>
            {childrenArray.map((child, index) => (
                <Fragment key={index}>
                    {child}
                    {index < childrenArray.length - 1 && <hr className='my-4 border-gray-200' />}
                </Fragment>
            ))}
        </>
    );
}
