import { html, LitElement } from 'lit';
import { provide } from '@lit/context';
import { lapisContext } from '../lapis-context';
import { customElement, property } from 'lit/decorators.js';

@customElement('gs-app')
class App extends LitElement {
    @provide({ context: lapisContext })
    @property()
    lapis: string = '';

    override render() {
        return html`${this.childNodes}`;
    }

    override createRenderRoot() {
        return this;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'gs-app': App;
    }
}
