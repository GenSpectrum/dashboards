import { useContext, useRef, useState } from 'preact/hooks';
import { LapisUrlContext } from '../LapisUrlContext';
import { useQuery } from '../useQuery';
import { fetchAutocompletionList } from './fetchAutocompletionList';

export type LocationFilterProps = {
    value?: string;
    fields: string[];
};

export const LocationFilter = ({ value: initialValue, fields }: LocationFilterProps) => {
    const lapis = useContext(LapisUrlContext);

    const [value, setValue] = useState(initialValue ?? '');
    const [unknownLocation, setUnknownLocation] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    const { data, error, isLoading } = useQuery(() => fetchAutocompletionList(fields, lapis), [fields, lapis]);

    if (isLoading)
        return (
            <form class='flex'>
                <input type='text' class='input input-bordered grow' value={value} disabled />
                <button class='btn ml-1' disabled type='submit'>
                    Loading...
                </button>
            </form>
        );

    if (error) {
        return (
            <p>
                Error: {error.name} {error.message} {error.stack}
            </p>
        );
    }

    const onInput = (event: InputEvent) => {
        if (event.target instanceof HTMLInputElement) {
            const inputValue = event.target.value;
            setValue(inputValue);
            if (unknownLocation) {
                const eventDetail = parseLocation(inputValue, fields);
                if (hasMatchingEntry(data, eventDetail)) {
                    setUnknownLocation(false);
                }
            }
        }
    };

    const submit = (event: SubmitEvent) => {
        event.preventDefault();
        const eventDetail = parseLocation(value, fields);

        if (hasMatchingEntry(data, eventDetail)) {
            setUnknownLocation(false);

            formRef.current?.dispatchEvent(
                new CustomEvent('gs-location-changed', {
                    detail: eventDetail,
                    bubbles: true,
                    composed: true,
                }),
            );
        } else {
            setUnknownLocation(true);
        }
    };

    return (
        <form class='flex' onSubmit={submit} ref={formRef}>
            <input
                type='text'
                class={`input input-bordered grow ${unknownLocation ? 'border-2 border-error' : ''}`}
                value={value}
                onInput={onInput}
                list='countries'
            />
            <datalist id='countries'>
                {data?.map((v) => {
                    const value = fields
                        .map((field) => v[field])
                        .filter((value) => value !== null)
                        .join(' / ');
                    return <option key={value} value={value} />;
                })}
            </datalist>
            <button class='btn btn-primary ml-1' type='submit'>
                Submit
            </button>
        </form>
    );
};

const parseLocation = (location: string, fields: string[]) => {
    const fieldValues = location.split('/').map((part) => part.trim());
    return fieldValues.reduce((acc, fieldValue, i) => ({ ...acc, [fields[i]]: fieldValue }), {});
};

const hasMatchingEntry = (data: Record<string, string>[] | null, eventDetail: Record<string, string>) => {
    if (data === null) {
        return false;
    }

    const matchingEntries = Object.entries(eventDetail)
        .filter(([, value]) => value !== undefined)
        .reduce((filteredData, [key, value]) => filteredData.filter((it) => it[key] === value), data);

    return matchingEntries.length > 0;
};
