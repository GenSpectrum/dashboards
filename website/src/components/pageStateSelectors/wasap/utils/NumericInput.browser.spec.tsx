import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { NumericInput } from './NumericInput';
import { it } from '../../../../../test-extend';

describe('NumericInput', () => {
    it('renders with initial value', async () => {
        const mockOnChange = vi.fn();

        const { getByRole } = render(
            <NumericInput label='Test Input' value={5} min={0} max={10} step={1} onChange={mockOnChange} />,
        );

        const numberInput = getByRole('spinbutton');
        await expect.element(numberInput).toHaveValue(5);
    });

    it('calls onChange when number input changes', async () => {
        const mockOnChange = vi.fn();

        const { getByRole } = render(
            <NumericInput label='Test Input' value={5} min={0} max={10} step={1} onChange={mockOnChange} />,
        );

        const numberInput = getByRole('spinbutton');
        await numberInput.fill('7');

        expect(mockOnChange).toHaveBeenCalledWith(7);
    });

    it('calls onChange when range slider changes', async () => {
        const mockOnChange = vi.fn();

        const { getByRole } = render(
            <NumericInput label='Test Input' value={5} min={0} max={10} step={1} onChange={mockOnChange} />,
        );

        const slider = getByRole('slider');
        await slider.fill('8');

        expect(mockOnChange).toHaveBeenCalledWith(8);
    });
});
