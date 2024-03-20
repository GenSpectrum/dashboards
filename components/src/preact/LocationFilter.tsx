import { useEffect, useRef } from 'preact/hooks';
import { lapisContext } from './LapisUrlContext';
import { observeContext, unobserveContext } from './context';

export type LocationFilterProps = {
    initialValue?: string;
    fields: string[];
};

export const LocationFilter = (/*{ initialValue, fields: stringFields }: LocationFilterProps*/) => {
    const ref = useRef<HTMLDivElement>(null);
    const contextRef = useRef<any>(null);

    useEffect(() => {
        if (ref !== null) {
            console.log('oberve');
            observeContext(ref.current, lapisContext, lapisContext, (a, b, c) => console.log('Hallo', a, b, c));
        }

        return () => unobserveContext(ref.current, lapisContext);
    }, [ref]);

    // return <ContextConsumer ref={contextRef}>/...</ContextConsumer>;

    return <div ref={ref}>LocationFilter</div>;

    // const fields = typeof stringFields === 'string' ? JSON.parse(stringFields) : stringFields;
    //
    // const lapis = useContext(LapisUrlContext);
    //
    // const [value, setValue] = useState(initialValue ?? '');
    // const [unknownLocation, setUnknownLocation] = useState(false);
    //
    // const formRef = useRef<HTMLFormElement>(null);
    //
    // Use the custom hook for data fetching
    // const { data, error, isLoading } = useQuery(() => fetchAutocompletionList(fields, lapis), [fields, lapis]);
    //
    // console.log(fields);

    // if (isLoading)
    //     return (
    //         <form class='flex'>
    //             <div>Lapis: {lapis}</div>
    //             <input type='text' class='input input-bordered flex-grow' value={value} disabled />
    //             <button class='btn ml-1' disabled>
    //                 Loading...
    //             </button>
    //         </form>
    //     );
    //
    // if (error) {
    //     console.log(typeof error, Object.keys(error), error);
    //     return (
    //         <p>
    //             Lapis: {lapis} - Error: {error.message} {JSON.stringify(error)} {error.toString()}
    //         </p>
    //     );
    // }
    //
    // const onInput = (event: JSXInternal.TargetedInputEvent<HTMLInputElement>) => {
    //     const inputValue = event.target.value;
    //     setValue(inputValue);
    //     if (unknownLocation) {
    //         const eventDetail = parseLocation(inputValue, fields);
    //         if (hasMatchingEntry(data, eventDetail)) {
    //             setUnknownLocation(false);
    //         }
    //     }
    // };
    //
    // const submit = (event: JSXInternal.TargetedSubmitEvent<HTMLFormElement>) => {
    //     event.preventDefault();
    //     const eventDetail = parseLocation(value, fields);
    //
    //     if (hasMatchingEntry(data, eventDetail)) {
    //         setUnknownLocation(false);
    //
    //         let b = formRef.current?.dispatchEvent(
    //             new CustomEvent('gs-location-changed', {
    //                 detail: eventDetail,
    //                 bubbles: true,
    //                 composed: true,
    //             }),
    //         );
    //         console.log('dispatch', b, formRef.current);
    //     } else {
    //         setUnknownLocation(true);
    //     }
    // };
    //
    // return (
    //     <form class='flex' onSubmit={submit} ref={formRef}>
    //         <div>Lapis: {lapis}</div>
    //         <input
    //             type='text'
    //             class={`input input-bordered flex-grow ${unknownLocation ? 'border-2 border-error' : ''}`}
    //             value={value}
    //             onInput={onInput}
    //             list='countries'
    //         />
    //         <datalist id='countries'>
    //             {data?.map((v) => {
    //                 const value = fields
    //                     .map((field) => v[field])
    //                     .filter((value) => value !== null)
    //                     .join(' / ');
    //                 return <option key={value} value={value} />;
    //             })}
    //         </datalist>
    //         <button class='btn btn-primary ml-1' type='submit' ongs-location-changed={(e) => console.log(e)}>
    //             Submit
    //         </button>
    //     </form>
    // );
};

const parseLocation = (location: string, fields: string[]) => {
    const fieldValues = location.split('/').map((part) => part.trim());
    return fieldValues.reduce((acc, fieldValue, i) => ({ ...acc, [fields[i]]: fieldValue }), {});
};

const hasMatchingEntry = (data: Record<string, string>[], eventDetail: Record<string, string>) => {
    const matchingEntries = Object.entries(eventDetail)
        .filter(([, value]) => value !== undefined)
        .reduce((filteredData, [key, value]) => filteredData.filter((it) => it[key] === value), data);

    return matchingEntries.length > 0;
};
