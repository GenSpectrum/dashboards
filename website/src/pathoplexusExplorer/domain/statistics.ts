/** Computes a 95% Wilson score interval for a binomial proportion. */
export function wilsonInterval(successes: number, total: number): { lower: number; upper: number } {
    if (total <= 0) {
        return { lower: 0, upper: 1 };
    }
    const z = 1.959964;
    const p = successes / total;
    const denominator = 1 + (z * z) / total;
    const center = (p + (z * z) / (2 * total)) / denominator;
    const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denominator;
    // Use exact endpoints for zero and all successes.
    return {
        lower: successes <= 0 ? 0 : Math.max(0, center - margin),
        upper: successes >= total ? 1 : Math.min(1, center + margin),
    };
}

export const LOW_COUNT = 10;

export function formatCount(value: number): string {
    return value.toLocaleString('en-US');
}

/** Reserve 0% and 100% for exact proportions. */
export function formatProportion(value: number): string {
    if (value === 0) {
        return '0%';
    }
    if (value < 0.001) {
        return '<0.1%';
    }
    if (value < 1 && value >= 0.995) {
        return '>99%';
    }
    return value < 0.1 ? `${(value * 100).toFixed(1)}%` : `${Math.round(value * 100)}%`;
}

export function formatIndex(value: number): string {
    return value.toFixed(2);
}
