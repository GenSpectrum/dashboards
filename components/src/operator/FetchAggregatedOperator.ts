import { Operator } from './Operator';
import { Dataset } from './Dataset';
import { LapisFilter } from '../types';
import { mapLapisFilterToUrlParams } from '../utils';

export class FetchAggregatedOperator<Fields> implements Operator<Fields & { count: number }> {
    constructor(
        private filter: LapisFilter,
        private fields: string[],
    ) {}

    async evaluate(lapis: string, signal?: AbortSignal): Promise<Dataset<Fields & { count: number }>> {
        const params = mapLapisFilterToUrlParams(this.filter);
        params.set('fields', this.fields.join(','));
        console.log('fetching');
        const promise = await (await fetch(`${lapis}/aggregated?${params.toString()}`, { signal })).json();
        console.log(promise);
        const data = promise.data;
        return {
            content: data,
        };
    }
}
