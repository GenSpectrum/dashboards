/** Keep each field on one line and preserve empty columns for missing values. */
export function formatTsvRow(cells: readonly (string | number | null)[]): string {
    return cells.map((cell) => (typeof cell === 'string' ? cell.replace(/[\t\r\n]+/g, ' ') : cell)).join('\t');
}
