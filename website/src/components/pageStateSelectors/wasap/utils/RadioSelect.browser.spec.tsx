import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { RadioSelect } from './RadioSelect';
import { it } from '../../../../../test-extend';

describe('RadioSelect', () => {
    const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
    ];

    it('renders all options', async () => {
        const mockOnChange = vi.fn();

        const { getByText } = render(
            <RadioSelect label='Test Radio' value='option1' options={options} onChange={mockOnChange} />,
        );

        await expect.element(getByText('Option 1')).toBeVisible();
        await expect.element(getByText('Option 2')).toBeVisible();
        await expect.element(getByText('Option 3')).toBeVisible();
    });

    it('marks the correct option as checked', async () => {
        const mockOnChange = vi.fn();

        const { getByLabelText } = render(
            <RadioSelect label='Test Radio' value='option2' options={options} onChange={mockOnChange} />,
        );

        const radio2 = getByLabelText('Option 2');
        await expect.element(radio2).toBeChecked();
    });

    it('calls onChange when clicking an option', async () => {
        const mockOnChange = vi.fn();

        const { getByLabelText } = render(
            <RadioSelect label='Test Radio' value='option1' options={options} onChange={mockOnChange} />,
        );

        const radio3 = getByLabelText('Option 3');
        await radio3.click();

        expect(mockOnChange).toHaveBeenCalledWith('option3');
    });
});
