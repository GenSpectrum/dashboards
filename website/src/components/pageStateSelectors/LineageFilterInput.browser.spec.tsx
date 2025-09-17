import { waitFor, within } from '@testing-library/react';
import { page } from '@vitest/browser/context';
import React from "react";
import { describe, expect } from "vitest";
import { render } from 'vitest-browser-react';

import { LineageFilterInput, type LineageFilterConfig } from "./LineageFilterInput";
import { it } from "../../../test-extend";

const dummyLapis = "http://lapis.dummy";

describe("LineageFilterInput", () => {
    const dummyFilter = {} as any;

    it("renders with lineage filter type", async ({ routeMocker }) => {
        routeMocker.mockReferenceGenome();
        routeMocker.mockLineageDefinition();
        routeMocker.mockAggregated();

        const config: LineageFilterConfig = {
            placeholderText: "lineage",
            lapisField: "dummy",
            filterType: "lineage",
        };

        const screen = render(
            <gs-app lapis={dummyLapis}>
                <LineageFilterInput
                    lineageFilterConfig={config}
                    onLineageChange={() => {}}
                    lapisFilter={dummyFilter}
                    value={undefined}
                />,
            </gs-app>
        );



        await expect.element(screen.getByText("A(0)")).toBeInTheDocument();
        //await screen.getByRole('combobox').click();
        expect(screen.getByRole('option', {includeHidden: true}).elements()).toHaveLength(6);

        console.log('element:', screen.getByText('A(0)').element());

        console.log('length', document.querySelectorAll('li').length);

        const el = document.getElementsByTagName('gs-lineage-filter').item(0) as HTMLElement
        const shadow = el.shadowRoot!

        await waitFor(
            () => {
                const shadowRootFirstEl = shadow?.firstElementChild as HTMLElement;
                return expect(shadowRootFirstEl).toContainElement(shadowRootFirstEl);
            },
            { timeout: 1000 },
        );

        const shadowElement = within(shadow.firstElementChild as HTMLElement);

        shadowElement.getByRole('combobox').click();

        await expect.element(screen.getByText("A(0)")).toBeVisible();

        shadowElement.getAllByRole('option');

        const options = shadow.querySelectorAll('li');

        expect(options.length).toBeGreaterThan(0);
        expect(Array.from(options).some(o => o.textContent === 'A(0)')).toBe(true);
    });

    it("fetches from foo.bar", async ({ routeMocker }) => {
        routeMocker.mockFooBar();

        const res = await fetch("http://foo.bar/");
        const data = await res.json();
        expect(data.message).toBe("Hello World");
    });
});

