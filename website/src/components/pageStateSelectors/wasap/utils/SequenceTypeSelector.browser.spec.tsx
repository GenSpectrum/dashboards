import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SequenceTypeSelector } from './SequenceTypeSelector';
import { it } from '../../../../../test-extend';

describe('SequenceTypeSelector', () => {
    it('renders nucleotide and amino acid options', async () => {
        const mockOnChange = vi.fn();

        const { getByText } = render(<SequenceTypeSelector value='nucleotide' onChange={mockOnChange} />);

        await expect.element(getByText('Nucleotide')).toBeInTheDocument();
        await expect.element(getByText('Amino acid')).toBeInTheDocument();
    });

    it('marks nucleotide as checked when selected', async () => {
        const mockOnChange = vi.fn();

        const { getByLabelText } = render(<SequenceTypeSelector value='nucleotide' onChange={mockOnChange} />);

        const nucleotideRadio = getByLabelText('Nucleotide');
        await expect.element(nucleotideRadio).toBeChecked();
    });

    it('marks amino acid as checked when selected', async () => {
        const mockOnChange = vi.fn();

        const { getByLabelText } = render(<SequenceTypeSelector value='amino acid' onChange={mockOnChange} />);

        const aminoAcidRadio = getByLabelText('Amino acid');
        await expect.element(aminoAcidRadio).toBeChecked();
    });

    it('calls onChange when switching from nucleotide to amino acid', async () => {
        const mockOnChange = vi.fn();

        const { getByLabelText } = render(<SequenceTypeSelector value='nucleotide' onChange={mockOnChange} />);

        const aminoAcidRadio = getByLabelText('Amino acid');
        await aminoAcidRadio.click();

        expect(mockOnChange).toHaveBeenCalledWith('amino acid');
    });
});
