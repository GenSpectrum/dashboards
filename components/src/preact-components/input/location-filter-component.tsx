import { LocationFilter } from '../../preact/locationFilter/location-filter';
import { PreactLitAdapter } from '../PreactLitAdapter';
import { customElement, property } from 'lit/decorators.js';

@customElement('gs-location-filter')
export class LocationFilterComponent extends PreactLitAdapter {
    @property()
    value = '';

    @property({ type: Array })
    fields: string[] = [];

    override render() {
        return <LocationFilter value={this.value} fields={this.fields} />;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-location-filter': LocationFilterComponent;
    }
}
