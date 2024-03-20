import { PropertyValues, ReactiveElement } from '@lit/reactive-element';
import { render } from 'preact';
import { unsafeCSS } from 'lit';
import { consume } from '@lit/context';
import { lapisContext } from '../lapis-context';
import { JSXInternal } from 'preact/src/jsx';
import { LapisUrlContext } from '../preact/LapisUrlContext';
import { LAPIS_URL } from '../constants';
import style from '../tailwind.css?inline';

import '../tailwind.css';

const tailwindElementCss = unsafeCSS(style);

export abstract class PreactLitAdapter extends ReactiveElement {
    static override styles = tailwindElementCss;

    @consume({ context: lapisContext })
    lapis: string = '';

    override update(changedProperties: PropertyValues) {
        const vdom = <LapisUrlContext.Provider value={LAPIS_URL}>{this.render()}</LapisUrlContext.Provider>;
        super.update(changedProperties);
        render(vdom, this.renderRoot);
    }

    protected abstract render(): JSXInternal.Element;
}
