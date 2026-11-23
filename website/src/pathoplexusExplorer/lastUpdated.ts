/** Formats the RhyDB download timestamp in UTC. */
export function formatDataVersion(version: string | null): string | undefined {
    if (version === null || !/^\d+$/.test(version)) {
        return undefined;
    }
    const date = new Date(Number(version) * 1000);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    const day = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
    const time = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'UTC',
    }).format(date);
    return `${day}, ${time} UTC`;
}
